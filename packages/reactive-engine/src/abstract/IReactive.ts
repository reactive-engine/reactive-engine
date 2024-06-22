import { OverrideArray, OverrideMap, OverridePropery, OverrideSet } from "../overrides";
export type DataStateTypes = 'create' | 'update' | 'insert' | 'delete' | 'reset';
export type ReactiveStates = 'notset' | 'root' | 'referenced';
export interface onChangedEventArgs {
    prop: any,
    key: string | Symbol,
    type: DataStateTypes,
    oldData?: any,
    newData?: any,
}

interface EventArgsBase {
    prop: any,
    key: string | Symbol,
}

export interface insertEventArgs extends EventArgsBase {
    data?: any,
    index?: number,
    source: 'array' | 'object' | 'map' | 'set'
}

export interface resetEventArgs extends EventArgsBase {
    oldData?: any,
    newData?: any,
}

export interface deletedEventArgs extends EventArgsBase {
    data?: any,
    index?: number,
    source: 'array' | 'object' | 'map' | 'set'
}


export interface updateEventArgs extends EventArgsBase {
    oldData?: any,
    newData?: any,
}


export interface onChangingEventArgs extends onChangedEventArgs {
    next: () => void;
}


export interface onTriggerEventArgs {
    prop: any,
    key: string | Symbol,
    type: DataStateTypes,
    oldData?: any,
    newData?: any,
    args?: any,
    unique: Symbol
}


export interface onTrackEventArgs {
    prop: any,
    key: string | Symbol,
    type: DataStateTypes,
    unique: Symbol
}

export interface IReactiveBase {
    onReset(sender: IReactive, e: resetEventArgs);
    onDelete(sender: IReactive, e: deletedEventArgs);
    onInsert(sender: IReactive, e: insertEventArgs);
    onUpdate(sender: IReactive, e: updateEventArgs);
}
export interface IReactive extends IReactiveBase {
    onChanged(sender: IReactive, e: onChangedEventArgs);
    onChanging(sender: IReactive, e: onChangingEventArgs);
    onTrigger(sender: IReactive, e: onTriggerEventArgs);
    onTrack(sender: IReactive, e: onTrackEventArgs);

    observe<T extends object>(data: T, parent?: any): T;

    watch(callback: () => void);
    watch<DT, KT extends keyof DT>(prop: DT, key: KT, callback: (data: DT[KT] extends (infer U)[] ? U : DT[KT] extends (infer U) ? U : any) => void): void
    options: IReactiveBase | null;
    targetMap: WeakMap<any, WeakMap<any, Set<any>>>;
    ReactiveState: ReactiveStates;
    stoptrigger: boolean;
    overrides: {
        property: OverridePropery,
        array: OverrideArray,
        map: OverrideMap,
        set: OverrideSet,
    }
    dispose();
    clearModel(model: any);
    clearModelAll(model: any);

}
