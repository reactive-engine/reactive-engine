import { DataStateTypes, IReactive, builtInSymbols, def, defaults, hasDescVal, pauseTracking, pauseTrigger, resetTracking, resetTrigger, skipArrayPropNames, toRaw } from "../imports";

export class OverrideArray {

    constructor() {
        this.create = this.create.bind(this);
        this.push = this.push.bind(this);
        this.pop = this.pop.bind(this);
        this.shift = this.shift.bind(this);
        this.splice = this.splice.bind(this);
    }
    create(prop: any, name: string | symbol, engine: IReactive, parent) {
        const tracking = ['map', 'forEach', 'filter', 'sort', 'reduce'];
        this.push(prop, engine, parent);
        this.pop(prop, engine, parent);
        this.splice(prop, engine, parent);
        this.shift(prop, engine, parent);
        tracking.forEach(method => {
            const original = Array.prototype[method];

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

                    defaults.inMethod = false;
                    defaults.inMethodName = '';
                    pauseTrigger();
                    const result = original.apply(this, arguments);
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
        let original = Array.prototype['push'];

        if (hasDescVal(prop, 'push')) { return; }
        def(prop, 'push', {
            enumerable: true,
            configurable: true,
            value: function () {
                if (timers.has('push')) {
                    clearTimeout(timers.get('push'))
                }
                const a = Object.create(arguments);
                let i = a.length
                const args = new Array(i)
                while (i--) {
                    args[i] = a[i];
                }
                const oldData = Array.from(prop);
                timers.delete('push');
                const timernumber = setTimeout(() => {
                    timers.delete('push');
                    pauseTrigger();
                    pauseTracking();
                    const result = original.apply(this, AddItems);
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
                    if (timers.has('push')) {
                        clearTimeout(timers.get('push'))
                    }
                    return result;
                })
                timers.set('push', timernumber)
                AddItems.push(...args);
            }
        });


    }
    pop(prop: any, engine: IReactive, parent) {
        const method = "pop" as any;

        const unique = Symbol();
        let original = Array.prototype[method];

        if (hasDescVal(prop, method)) { return; }
        def(prop, method, {
            enumerable: true,
            configurable: true,
            value: function () {
                pauseTrigger();
                pauseTracking();
                let result = original.apply(this, arguments);
                if (result) {
                    engine.onDelete(engine, {
                        key: parent ? parent.key : method,
                        prop: parent ? parent.data : toRaw(prop),
                        data: result,
                        index: prop.length - 1,
                        source: 'array'
                    })
                    const oldData = Array.from(prop);
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
        const method = "shift" as any;

        const unique = Symbol();
        let original = Array.prototype[method];

        if (hasDescVal(prop, method)) { return; }

        def(prop, method, {
            enumerable: true,
            configurable: true,
            value: function () {
                pauseTrigger();
                pauseTracking();
                let result = original.apply(this, arguments);
                if (result) {
                    engine.onDelete(engine, {
                        key: parent ? parent.key : method,
                        prop: parent ? parent.data : toRaw(prop),
                        data: result,
                        index: 0,
                        source: 'array'
                    })
                    const oldData = Array.from(prop);
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
        let method = "splice";
        const unique = Symbol();
        let original = Array.prototype[method];
        if (hasDescVal(prop, method)) { return; }
        def(prop, method, {
            enumerable: true,
            configurable: true,
            value: function () {
                const a = Object.create(arguments);
                let i = a.length
                let args = new Array<any>(i)
                while (i--) {
                    args[i] = a[i];
                }
                pauseTrigger();
                pauseTracking();
                const result = original.apply(this, arguments);
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

                const oldData = Array.from(prop);
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