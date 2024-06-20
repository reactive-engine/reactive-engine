import { DataStateTypes, IReactive, hasDescVal, toRaw } from "../imports";

export class OverrideMap {

    create(prop: any, name: string | symbol, engine: IReactive, parent, MapType: typeof Map<any, any> | typeof WeakMap<any, any>) {
        const methods = ['set', 'get', 'clear', 'delete', 'has', 'forEach', 'entries', 'values'];
        const unique = Symbol();
        methods.forEach(method => {

            var original = MapType.prototype[method];
            // var oldDescriptor = Reflect.getOwnPropertyDescriptor(prop, method);
            // if (oldDescriptor && typeof oldDescriptor.value == 'function') {
            //     return;
            // }
            if (hasDescVal(prop, method)) { return; }
            Object.defineProperty(prop, method, {
                enumerable: true,
                configurable: true,
                value: function () {

                    var a = Object.create(arguments);
                    var i = a.length
                    var args = new Array(i)
                    while (i--) {
                        args[i] = a[i];
                    }
                    if (args.length > 1 && method == 'set') {
                        args[1] = engine.observe(args[1], parent);
                    }
                    var result = original.apply(prop, args);
                    var typeSelect: DataStateTypes = 'update';
                    var resume = false;
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