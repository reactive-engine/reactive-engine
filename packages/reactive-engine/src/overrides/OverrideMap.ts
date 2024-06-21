import { DataStateTypes, IReactive, hasDescVal, toRaw } from "../imports";

export class OverrideMap {

    create(prop: any, name: string | symbol, engine: IReactive, parent, MapType: typeof Map<any, any> | typeof WeakMap<any, any>) {
        const methods = ['set', 'get', 'clear', 'delete', 'has', 'forEach', 'entries', 'values'];
        const unique = Symbol();
        methods.forEach(method => {

            const original = MapType.prototype[method]; 
            if (hasDescVal(prop, method)) { return; }
            Object.defineProperty(prop, method, {
                enumerable: true,
                configurable: true,
                value: function () {

                    const a = Object.create(arguments);
                    let i = a.length
                    const args = new Array(i)
                    while (i--) {
                        args[i] = a[i];
                    }
                    if (args.length > 1 && method == 'set') {
                        args[1] = engine.observe(args[1], parent);
                    }
                    const result = original.apply(prop, args);
                    let typeSelect: DataStateTypes = 'update';
                    let resume = false;
                    switch (method) {
                        case 'set':
                            engine.onInsert(engine, {
                                key: parent ? parent.key : name,
                                prop: parent ? parent.data : prop,
                                data: args,
                                source: 'map'
                            })
                            typeSelect = 'create';
                            resume = true;
                            break;
                        case 'clear':
                            engine.onDelete(engine, {
                                key: parent ? parent.key : name,
                                prop: parent ? parent.data : prop,
                                data: result,
                                index: prop.size - 1,
                                source: 'map'
                            })
                            typeSelect = 'reset';
                            resume = true;
                            break;
                        case 'delete':
                            engine.onDelete(engine, {
                                key: parent ? parent.key : name,
                                prop: parent ? parent.data : prop,
                                data: result,
                                index: prop.size - 1,
                                source: 'map'
                            })
                            typeSelect = 'delete';
                            resume = true;
                            break;
                        case 'get':
                        case 'has':

                            engine.onTrack(engine, { key: name, prop: toRaw(prop), type: 'update', unique: unique });
                            typeSelect = 'update';
                            break;
                    }
                    if (resume) {
                        engine.onChanged(engine, {
                            key: parent ? parent.key : name,
                            prop: parent ? parent.data : prop,
                            type: typeSelect,
                            newData: result
                        })
                        engine.onTrigger(engine, {
                            key: parent ? parent.key : name,
                            prop: parent ? parent.data : prop,
                            type: typeSelect,
                            args: args, unique: unique
                        })
                    }

                    return result;
                }
            });
        })
    }

}