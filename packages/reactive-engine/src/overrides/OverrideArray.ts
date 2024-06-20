import { DataStateTypes, IReactive, builtInSymbols, def, defaults, hasDescVal, pauseTracking, pauseTrigger, resetTracking, resetTrigger, skipArrayPropNames, toRaw } from "../imports";

export class OverrideArray {

    create(prop: any, name: string | symbol, engine: IReactive, parent) {
        const tracking = ['map', 'forEach', 'filter', 'sort', 'reduce'];
        this.push(prop, engine, parent);
        this.pop(prop, engine, parent);
        this.splice(prop, engine, parent);
        this.shift(prop, engine, parent);
        tracking.forEach(method => {
            var original = Array.prototype[method];
            // var oldDescriptor = Reflect.getOwnPropertyDescriptor(prop, method);
            // if (oldDescriptor && typeof oldDescriptor.value == 'function') {
            //     return;
            // }
            if (hasDescVal(prop, method)) { return; }
            def(prop, method, {
                enumerable: true,
                configurable: true,
                value: function () {
                    defaults.inMethod = true;
                    defaults.inMethodName = method;

                    engine.onUpdate(engine, {
                        key: parent ? parent.key : method,
                        prop: parent ? parent.data : toRaw(prop),
                    })

                    // engine.onTrack(engine, {
                    //     key: parent ? parent.key : method,
                    //     prop: parent ? parent.data : toRaw(prop),
                    //     type: 'update',
                    //     unique: unique
                    // });


                    defaults.inMethod = false;
                    defaults.inMethodName = '';
                    pauseTrigger();
                    var result = original.apply(this, arguments);
                    resetTrigger();

                    // engine.onTrigger(engine, {
                    //     key: parent ? parent.key : method,
                    //     prop: parent ? parent.data : toRaw(prop),
                    //     type: 'update',
                    //     newData: prop,
                    //     unique: unique
                    // });

                    return result;
                }
            });
        })
    }

    push(prop: any, engine: IReactive, parent) {
        const timers = new Map<string, any>();
        const AddItems = <any>[]
        const unique = Symbol();
        var original = Array.prototype['push'];
        // var oldDescriptor = Reflect.getOwnPropertyDescriptor(prop, 'push');
        // if (oldDescriptor && typeof oldDescriptor.value == 'function') {
        //     return;
        // }
        if (hasDescVal(prop, 'push')) { return; }
        var mx = <any[]>[];

        def(prop, 'push', {
            enumerable: true,
            configurable: true,
            value: function () {
                if (timers.has('push')) {
                    clearTimeout(timers.get('push'))
                }
                var a = Object.create(arguments);
                var i = a.length
                var args = new Array(i)
                while (i--) {
                    args[i] = a[i];
                }
                var oldData = Array.from(prop);
                timers.delete('push');
                const timernumber = setTimeout(() => {
                    timers.delete('push');
                    pauseTrigger();
                    pauseTracking();
                    var result = original.apply(this, AddItems);
                    engine.onInsert(engine, {
                        key: parent ? parent.key : 'push',
                        prop: parent ? parent.data : toRaw(prop),
                        data: args,
                        index: prop.length - 1,
                        source: 'array'
                    })
                    engine.onTrigger(engine, {
                        key: parent ? parent.key : 'push',
                        prop: parent ? parent.data : toRaw(prop),
                        type: 'insert',
                        oldData: oldData,
                        newData: prop,
                        args: args, unique: unique
                    });
                    resetTracking();
                    resetTrigger();
                    AddItems.splice(0);
                    return result;
                })
                timers.set('push', timernumber)
                AddItems.push(...args);
            }
        });


    }
    pop(prop: any, engine: IReactive, parent) {
        var method = "pop";

        const unique = Symbol();
        var original = Array.prototype[method];
        // var oldDescriptor = Reflect.getOwnPropertyDescriptor(prop, method);
        // if (oldDescriptor && typeof oldDescriptor.value == 'function') {
        //     return;
        // }
        if (hasDescVal(prop, method)) { return; }
        var mx = <any[]>[];
        def(prop, method, {
            enumerable: true,
            configurable: true,
            value: function () {
                pauseTrigger();
                pauseTracking();
                var result = original.apply(this, arguments);
                if (result) {
                    engine.onDelete(engine, {
                        key: parent ? parent.key : method,
                        prop: parent ? parent.data : toRaw(prop),
                        data: result,
                        index: prop.length - 1,
                        source: 'array'
                    })
                    var oldData = Array.from(prop);
                    engine.onTrigger(engine, {
                        key: parent ? parent.key : method,
                        prop: parent ? parent.data : toRaw(prop),
                        type: 'delete',
                        oldData: oldData,
                        newData: result,
                        args: result, unique: unique
                    });
                }
                resetTracking();
                resetTrigger();
                return result;
            }
        });


    }
    shift(prop: any, engine: IReactive, parent) {
        var method = "shift";

        const unique = Symbol();
        var original = Array.prototype[method];
        // var oldDescriptor = Reflect.getOwnPropertyDescriptor(prop, method);
        // if (oldDescriptor && typeof oldDescriptor.value == 'function') {
        //     return;
        // }
        if (hasDescVal(prop, method)) { return; }

        def(prop, method, {
            enumerable: true,
            configurable: true,
            value: function () {
                pauseTrigger();
                pauseTracking();
                var result = original.apply(this, arguments);
                if (result) {
                    engine.onDelete(engine, {
                        key: parent ? parent.key : method,
                        prop: parent ? parent.data : toRaw(prop),
                        data: result,
                        index: 0,
                        source: 'array'
                    })
                    var oldData = Array.from(prop);
                    engine.onTrigger(engine, {
                        key: parent ? parent.key : method,
                        prop: parent ? parent.data : toRaw(prop),
                        type: 'delete',
                        oldData: oldData,
                        newData: result,
                        args: result, unique: unique
                    });
                }
                resetTracking();
                resetTrigger();
                return result;
            }
        });


    }
    splice(prop: any, engine: IReactive, parent) {
        var method = "splice";

        const unique = Symbol();
        var original = Array.prototype[method];
        // var oldDescriptor = Reflect.getOwnPropertyDescriptor(prop, method);
        // if (oldDescriptor && typeof oldDescriptor.value == 'function') {
        //     return;
        // }
        if (hasDescVal(prop, method)) { return; }
        def(prop, method, {
            enumerable: true,
            configurable: true,
            value: function () {
                var a = Object.create(arguments);
                var i = a.length
                var args = new Array<any>(i)
                while (i--) {
                    args[i] = a[i];
                }
                pauseTrigger();
                pauseTracking();
                var result = original.apply(this, args);
                let type: DataStateTypes = 'delete';
                if (a.length > 2) {
                    engine.onDelete(engine, {
                        key: parent ? parent.key : method,
                        prop: parent ? parent.data : toRaw(prop),
                        data: result,
                        index: args[0],
                        source: 'array'
                    })
                    engine.onInsert(engine, {
                        key: parent ? parent.key : method,
                        prop: parent ? parent.data : toRaw(prop),
                        data: args.slice(2),
                        index: args[0],
                        source: 'array'
                    });


                } else if (a.length == 1) {
                    //remove all items start from start index;
                    engine.onDelete(engine, {
                        key: parent ? parent.key : method,
                        prop: parent ? parent.data : toRaw(prop),
                        data: result,
                        index: args[0],
                        source: 'array'
                    })
                } else {
                    engine.onDelete(engine, {
                        key: parent ? parent.key : method,
                        prop: parent ? parent.data : toRaw(prop),
                        data: result,
                        index: args[0],
                        source: 'array'
                    })
                }

                var oldData = Array.from(prop);
                engine.onChanged(engine, {
                    key: parent ? parent.key : method,
                    prop: parent ? parent.data : toRaw(prop),
                    type: type,
                    oldData: oldData,
                    newData: prop
                })
                engine.onTrigger(engine, {
                    key: parent ? parent.key : method,
                    prop: parent ? parent.data : toRaw(prop),
                    type: type,
                    oldData: oldData,
                    newData: prop,
                    args: args, unique: unique
                });

                resetTracking();
                resetTrigger();
                return result;
            }
        });


    }
}