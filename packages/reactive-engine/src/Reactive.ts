
import { DefaultStoreBindingSettings, DefaultStoreMapper, EffectStoreBinder, IStoreMapper } from "./abstract/IStoreBinder";
import { defaults, IReactive, IReactiveBase, OverrideArray, OverrideMap, OverridePropery, OverrideSet, ProxyMap, Proxyable, builtInSymbols, isNonTrackableKeys, isSymbol, onChangedEventArgs, onChangingEventArgs, onTrackEventArgs, onTriggerEventArgs, toRaw, ReactiveStates, isReactive, deletedEventArgs, insertEventArgs, resetEventArgs, updateEventArgs, GUID } from "./imports";
const defaultProxyable = new Proxyable();

export class Reactive implements IReactive {
    constructor(options?: IReactiveBase) {
        if (options) this.options = options;
        if (!defaults.engineMaps) {
            defaults.engineMaps = new Set();
        }
        if (!defaults.engineMaps.has(this)) {
            defaults.engineMaps.add(this);
        }
        this.onReset = this.onReset.bind(this);
        this.watch = this.watch.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onInsert = this.onInsert.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.observe = this.observe.bind(this);
        this.onChanged = this.onChanged.bind(this);
        this.onChanging = this.onChanging.bind(this);
        this.onTrigger = this.onTrigger.bind(this);
        this.adddepends = this.adddepends.bind(this);
        this.triggerEffects = this.triggerEffects.bind(this);
        this.triggerEffect = this.triggerEffect.bind(this);
        this.onTrack = this.onTrack.bind(this);
        this.trackComplete = this.trackComplete.bind(this);
        this.clearModel = this.clearModel.bind(this);
        this.clearModelAll = this.clearModelAll.bind(this);
        this.dispose = this.dispose.bind(this);
    }

    watch(callback: () => void);
    watch<DT, KT extends keyof DT>(prop: DT, key: KT, callback: (data: DT[KT] extends (infer U)[] ? U : DT[KT] extends infer U ? U : any) => void): void;
    watch(prop: unknown, key?: unknown, callback?: unknown): any {

        const binder = new EffectStoreBinder();
        const s = new DefaultStoreBindingSettings();
        if (arguments.length == 1) {
            s.callback = arguments[0];
            s.type = 'function';
        } else {
            s.callback = () => arguments[2](arguments[0][arguments[1]]);
        }
        s.type = 'function';
        binder.init(s);
        return () => binder.dispose();
    }


    onReset(sender: IReactive, e: resetEventArgs) {
        if (typeof this.options?.onReset == 'function') {
            typeof this.options.onReset(sender, e);
        }
        debugger;
    }
    onDelete(sender: IReactive, e: deletedEventArgs) {
        if (typeof this.options?.onDelete == 'function') {
            typeof this.options.onDelete(sender, e);
        }
    }
    onInsert(sender: IReactive, e: insertEventArgs) {
        if (typeof this.options?.onInsert == 'function') {
            typeof this.options.onInsert(sender, e);
        }

    }
    onUpdate(sender: IReactive, e: updateEventArgs) {
        if (typeof this.options?.onUpdate == 'function') {
            typeof this.options.onUpdate(sender, e);
        }
    }
    disposed: boolean = false;
    options: IReactiveBase | null = null;
    targetMap = new WeakMap<any, WeakMap<any, Set<any>>>;
    ReactiveState: ReactiveStates = 'notset';
    stoptrigger: boolean = false;
    public overrides = {
        property: new OverridePropery(),
        array: new OverrideArray(),
        map: new OverrideMap(),
        set: new OverrideSet(),
    }
    observe<T extends object>(data: T, parent?: any): T {
        const t = this;
        if (t.disposed) {
            defaults.engineMaps.delete(t);
            return data;
        }
        if (typeof data !== 'object') {
            return data;
        }
        if (isReactive(data) && t.ReactiveState == 'notset') {
            t.ReactiveState = 'referenced';
        } else if (t.ReactiveState == 'notset') {
            t.ReactiveState = 'root';
        }
        //const l = t._model.push(defaultProxyable.Generate<T>(data, t, parent));
        return defaultProxyable.Generate<T>(data, t, parent);//t._model[l - 1];
    }
    onChanged(sender: IReactive, e: onChangedEventArgs) {

    }
    onChanging(sender: IReactive, e: onChangingEventArgs) {
        e.next();
    }
    onTrigger(sender: IReactive, e: onTriggerEventArgs) {

        if (this.disposed) { return; }
        const effects: IStoreMapper[] = [];
        const items = this.targetMap.get(e.prop)?.get(e.key);
        const exist = this.targetMap.get(e.prop);
        if (exist) {
            if (Array.isArray(e.prop)) {
                if (exist) {
                    exist.get(e.key)?.forEach(x => {
                        if (!this.cacheFx.has(x)) effects.push(x)
                    })
                }
            }
        }
        if (items) {
            items.forEach(f => {
                if (!this.cacheFx.has(f)) effects.push(f);
            })
        }
        if (effects.length > 0) {
            this.triggerEffects(effects, e)
        }
    }
    cacheFx = new Map<IStoreMapper, Set<any>>();
    cacheTimer = null as any;

    adddepends = (de, e) => {
        [...de.depends].filter(x => !this.cacheFx.has(x)).forEach(depEffect => {
            if (this.cacheFx && !this.cacheFx.has(depEffect)) {
                this.cacheFx.set(depEffect, e.key as any);
            }
            this.adddepends(depEffect, e);
        })
    }

    triggerEffects(dep: IStoreMapper[], e: onTriggerEventArgs) {
        const effects = Array.isArray(dep) ? dep : [...dep]
        for (const effect of effects) {
            if (!this.cacheFx.has(effect)) {
                this.cacheFx.set(effect, e.key as any);
                this.adddepends(effect, e);
            }
        }
        clearTimeout(this.cacheTimer)
        this.cacheTimer = setTimeout(() => {
            Promise.resolve().then(() => {
                this && this.cacheFx && this.cacheFx.forEach((v, k) => {
                    if (k.binder && !k.binder.disposed) {
                        this.triggerEffect(k, e);
                    }
                })
                this && this.cacheFx && this.cacheFx.clear();
                clearTimeout(this.cacheTimer)
            });
        }, 0)
    }
    triggerEffect(
        effect: IStoreMapper, e: onTriggerEventArgs) {
        const resume = effect !== defaults.current && (effect.binder && !effect.binder.disposed);
        if (resume && e.type == 'reset') {
            effect.run();
        } else if (resume) {
            effect.binder.run();
        }
    }
    onTrack(sender: IReactive, e: onTrackEventArgs) {

        const t = this;
        if (t.disposed) { return; }
        if (defaults.followTracking == undefined) { defaults.followTracking = true };
        if (defaults.current && defaults.followTracking && (isSymbol(e.key) ? !builtInSymbols.has(e.key) : !isNonTrackableKeys(e.key as string))) {
            let depsMap = t.targetMap.get(e.prop);
            if (!depsMap) {
                try {
                    t.targetMap.set(e.prop, (depsMap = new Map()))
                } catch (error) {
                    t.targetMap.set(e.prop, (depsMap = new Map()))
                }
            }
            let dep = depsMap.get(e.key)
            if (!dep) {
                depsMap.set(e.key, (dep = new Set<IStoreMapper>()))
            }
            t.trackComplete(dep, e.prop, e.key);
        }
    }
    private trackComplete(dep: Set<IStoreMapper>, model: any, key: any) {
        let shouldTrack = !dep.has(defaults.current!);
        if (defaults.current && shouldTrack && !dep.has(defaults.current)) {
            defaults.current.binder && defaults.current.binder.setup && defaults.current.binder.setup(model, key);
            dep.add(defaults.current);
            if (defaults.current.parent && !defaults.current.parent.depends.has(defaults.current)) {
                defaults.current.parent.depends.add(defaults.current);
            }
        }
    }
    clearModel(model: any) {
        const t = this;
        const p = ProxyMap;
        if (model != null && model != undefined) {
            Object.keys(model).forEach((key) => {
                if (typeof model[key] === 'object') {
                    if (t.targetMap.has(toRaw(model[key])) || t.targetMap.has(model[key]) || p.has(model[key]) || p.has(toRaw(model[key]))) {
                        t.clearModel(model[key])
                    }
                } else if (model[key] && Array.isArray(model[key])) {
                    model[key].forEach(item => {
                        this.clearModel(item);
                    })
                }
                p.delete(toRaw(model[key]));
                p.delete(model[key]);
                t.targetMap.delete(model[key])
                t.targetMap.delete(toRaw(model[key]));
                Reflect.deleteProperty(model, key);
            })
            p.delete(toRaw(model));
            p.delete(model);
            t.targetMap.delete(model);
            t.targetMap.delete(toRaw(model));
            ProxyMap.delete(toRaw(model));
        }

    }
    clearModelAll(model: any) {

        const p = ProxyMap;
        if (model != null && model != undefined) {

            defaults.engineMaps.forEach(x => {
                Object.keys(model).forEach((key) => {
                    if (typeof model[key] === 'object') {
                        if (x.targetMap.has(toRaw(model[key])) || x.targetMap.has(model[key]) || p.has(model[key]) || p.has(toRaw(model[key]))) {
                            x.clearModelAll(model[key])
                        }
                    }
                    p.delete(toRaw(model[key]));
                    p.delete(model[key]);
                    x.targetMap.delete(model[key])
                    x.targetMap.delete(toRaw(model[key]));
                    Reflect.deleteProperty(model, key);

                })
                p.delete(toRaw(model));
                p.delete(model);
                x.targetMap.delete(model);
                x.targetMap.delete(toRaw(model));
                ProxyMap.delete(toRaw(model));
                // if (x.targetMap.size == 0) {
                //     defaults.engineMaps.delete(x);
                // }
                // Object.keys(model).forEach((key) => {
                //     var tm = x.targetMap.get(toRaw(model[key]));
                //     if (!tm || tm.size == 0) {
                //         defaults.engineMaps.delete(x);
                //     } else {
                //         x.targetMap.delete(toRaw(model[key]));
                //     }
                // })
            })

        }
    }
    dispose() {

        defaults.engineMaps.delete(this);
        this.targetMap = null as unknown as Map<any, any>;
        this.overrides = null as any;
        this.cacheFx = null as any;
        this.disposed = true;
    }
}
