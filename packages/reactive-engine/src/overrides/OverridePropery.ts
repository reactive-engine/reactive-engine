import { IReactive, isObject, skipArrayPropNames, toRaw } from "../imports";

export class OverridePropery {
    create(prop: any, name: string | symbol, engine: IReactive) {
        if (skipArrayPropNames(prop, name)) {
            return;
        }
        if (typeof prop != 'object') {
            return prop;
        }
        const oldDescriptor = Reflect.getOwnPropertyDescriptor(prop, name);
        if (oldDescriptor && typeof oldDescriptor.get == 'function' && oldDescriptor.configurable) {
            return;
        }
        const unique = Symbol();
        let originalValue = engine.observe(prop[name], { data: prop, key: name }); 
        Reflect.defineProperty(prop, name, {
            get() {
                if (oldDescriptor?.get) {
                    return oldDescriptor.get.call(prop);
                }
                engine.onTrack(engine, { key: name, prop: toRaw(prop), type: 'update', unique: unique });
                return originalValue;
            },
            set(v) {
                if (originalValue != v) {
                    const oldData = originalValue;
                    if (oldDescriptor?.set) {
                        oldDescriptor.set.call(prop, v);
                    }
                    originalValue = v;
                    engine.onUpdate(engine, {
                        key: name,
                        prop: toRaw(prop),
                    })
                    if (!engine.stoptrigger) {
                        if (Array.isArray(originalValue) || isObject(originalValue)) {
                            originalValue = engine.observe(v, { data: prop, key: name });
                            engine.onChanged(engine, { key: name, prop: toRaw(prop), type: 'reset', oldData: oldData, newData: v });
                            engine.onTrigger(engine, { key: name, prop: toRaw(prop), type: 'reset', oldData: oldData, newData: v, unique: unique });
                        } else {

                            engine.onChanged(engine, { key: name, prop: toRaw(prop), type: 'update', oldData: oldData, newData: v });
                            engine.onTrigger(engine, { key: name, prop: toRaw(prop), type: 'update', oldData: oldData, newData: v, unique: unique });
                        }
                    } else if (isObject(originalValue)) {
                        engine.onChanged(engine, { key: name, prop: toRaw(prop), type: 'update', oldData: oldData, newData: v });
                        originalValue = engine.observe(v, { data: prop, key: name });
                    } else {
                        engine.onChanged(engine, { key: name, prop: toRaw(prop), type: 'update', oldData: oldData, newData: v });
                    }


                    return originalValue;
                }
            },
        });
    }
}