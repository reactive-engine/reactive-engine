import { Flags, IReactive, TargetType, builtInSymbols, getTargetType, isNonTrackableKeys, isNumericKey, isObject, isReactive, isSymbol, toRaw } from "../imports";

export const ProxyMap = new WeakMap<any, any>();

export class Proxyable {
    /**
     *
     */
    constructor() {
        this.setHandler = this.setHandler.bind(this);
        this.createGetter = this.createGetter.bind(this);
        this.createSetter = this.createSetter.bind(this);
        this.ProxyHandler = this.ProxyHandler.bind(this);
        this.Generate = this.Generate.bind(this); 
    }
    private setHandler(target, p, engine: IReactive, parent) {

        if (engine['disposed']) {
            return;
        }
        const raw = toRaw(target);
        if (typeof raw[p] !== 'function') {
            engine && engine.overrides && engine.overrides.property.create(raw, p, engine);
        }
        if (Array.isArray(raw)) {
            engine.overrides.array.create(raw, p, engine, parent);
        } else if (raw instanceof Map) {
            engine.overrides.map.create(raw, p, engine, parent, Map);
        } else if (raw instanceof WeakMap) {
            engine.overrides.map.create(raw, p, engine, parent, WeakMap);
        } else if (raw instanceof Set) {
            engine.overrides.set.create(raw, p, engine, parent, Set);
        } else if (raw instanceof WeakSet) {
            engine.overrides.set.create(raw, p, engine, parent, WeakSet);
        }


    }
    private createGetter(engine, parent) {
        const self = this;
        return function (target, p, receiver) {
            if (Flags.Raw === p) {
                return target;
            } else if (Flags.ReceiverRaw === p) {
                return receiver;
            } else if (Flags.isReactive == p) {
                return true;
            } else if (receiver === ProxyMap.get(target)) {
                return target;
            }
            if (isSymbol(p) ? builtInSymbols.has(p) : isNonTrackableKeys(p as string)) {
                return engine.observe(Reflect.get(target, p, receiver), { data: target, key: p });
            }
            if (engine['disposed'] != true) {
                self.setHandler(target, p, engine, parent);
            }


            var res = engine.observe(Reflect.get(target, p, receiver), { data: target, key: p });
            return res;

        }
    }
    private createSetter(engine, parent) {
        const self = this;
        return function (target, p, newValue, receiver) {
            if (isSymbol(p) ? !builtInSymbols.has(p) : !isNonTrackableKeys(p as string)) {
                if (engine['disposed'] != true) {
                    self.setHandler(target, p, engine, { data: target, key: p });
                }
            }
            if (Array.isArray(newValue) || isObject(newValue)) {
                newValue = engine.observe(newValue, { data: target, key: p });
            }
            if (!Object.keys(target).includes(p as string)) {
                engine.onInsert(engine, {
                    key: target,
                    prop: p,
                    data: newValue,
                    source: 'object'
                })
                engine.onChanged(engine, { key: p, prop: target, type: 'create' });
                engine.onTrack(engine, { key: p, prop: target, type: 'create' });
            }
            return Reflect.set(target, p, newValue, receiver);
        }
    }
    private ProxyHandler(data, engine: IReactive, parent) {
        return new Proxy(data, {
            get: this.createGetter(engine, parent),
            set: this.createSetter(engine, parent),
            deleteProperty(target, p) {
                if (!engine.stoptrigger) {
                    engine.onDelete(engine, {
                        key: p,
                        prop: target,
                        data: target[p],
                        source: 'object'
                    })
                    engine.onTrigger(engine, {
                        key: p,
                        prop: target,
                        type: 'delete',
                        oldData: target,
                        newData: target[p],
                        unique: Symbol()
                    });

                    if (!isNumericKey(p)) {
                        console.error('remove Property', p, isNumericKey(p))
                    }
                }
                return Reflect.deleteProperty(target, p);
            }
        });
    }
    public Generate<T extends Object>(data: T, engine: IReactive, parent): T {

        if (!isObject(data)) {
            return data
        }
        if (isReactive(data)) {
            return data;
        }


        const targetType = getTargetType(data);
        if (targetType === TargetType.SYSTEM || TargetType.INVALID) {
            return data as any
        }
        let existingProxy = ProxyMap.get(data)
        if (existingProxy) {
            return existingProxy as any
        }

        const proxy = this.ProxyHandler(data, engine, parent);
        ProxyMap.set(proxy, data);

        return proxy;

    }

}

