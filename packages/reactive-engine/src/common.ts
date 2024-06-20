import { IStoreMapper } from "./abstract/IStoreBinder";
import { IReactive } from "./imports";



export const enum TargetType {
    SYSTEM = 0,
    INVALID = 0,
    COMMON = 1,
    COLLECTION = 2
}

export const Flags = {
    Raw: Symbol('r'),
    ReceiverRaw: Symbol('rr'),
    isReactive: Symbol('ir'),
    Skip: Symbol('s'),
    Parent: Symbol('p')
}

export function toRaw(data: any) {
    return data ? data[Flags.Raw] ? data[Flags.Raw] : data : data;
}
export function toReceiverRaw(data: any) {
    return data ? data[Flags.ReceiverRaw] ? data[Flags.ReceiverRaw] : data : data;
}
export function isReactive(data: any) {
    return data ? data[Flags.isReactive] ? data[Flags.isReactive] : false : false;
}

const SystemReservedNames = <string[]>[];//['Control', 'RouteManager', 'ServiceManager', 'moviComponent', 'MoviComponent', 'Component', 'IControl'];

export function targetTypeMap(rawType: string) {
    switch (rawType) {
        case 'Object':
        case 'Array':
            return TargetType.COMMON
        case 'Map':
        case 'Set':
        case 'WeakMap':
        case 'WeakSet':
            return TargetType.COLLECTION
        default:
            return TargetType.INVALID
    }
}

export const objectToString = Object.prototype.toString
export function toTypeString(value: unknown): string { return objectToString.call(value) }
export function toRawType(value: unknown): string {
    return toTypeString(value).slice(8, -1)
}
export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol';
export const isObject = (val: unknown): val is Record<any, any> => val !== null && typeof val === 'object';

export function mapCreator(str: string, expectsLowerCase?: boolean): (key: string) => boolean {
    const map: Record<string, boolean> = Object.create(null)
    const list: Array<string> = str.split(',')
    for (let i = 0; i < list.length; i++) {
        map[list[i]] = true
    }
    return expectsLowerCase ? val => !!map[val.toLowerCase()] : val => !!map[val]
}

export const isNonTrackableKeys = mapCreator(`__proto__`)

export function getTargetType(value: any): TargetType {
    var isSys = false;
    var proto = Object.getPrototypeOf(value);
    var cname = "";
    if (proto && proto.constructor) {
        cname = proto.constructor.name;
    }
    var isSystem = false;
    defaults.SystemTypes?.forEach(x => {
        var protos = Object.getPrototypeOf(x);
        var cnamex = "";
        if (protos && protos.constructor) {
            cnamex = protos.constructor.name;
        }
        try {
            if (typeof value == 'object' && value instanceof x) {
                isSystem = true;
            }
        } catch (error) {
            console.error('error', typeof Object.getPrototypeOf(value).constructor, value, error)
        }

    })
    if (isSystem) {
        return TargetType.SYSTEM;
    }

    if (SystemReservedNames.includes(cname)) {
        return TargetType.SYSTEM;
    }
    return !Object.isExtensible(value)
        ? TargetType.INVALID
        : targetTypeMap(toRawType(value))
}


export const builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol)
    .filter(key => key !== 'arguments' && key !== 'caller')
    .map(key => (Symbol as any)[key])
    .filter(isSymbol))

export const skipArrayPropNames = (value, key) => Array.isArray(value) ? ['filter', 'forEach', 'map'].includes(key) : false
export const isString = (val: unknown): val is string => typeof val === 'string';
export const isNumericKey = (key: unknown) => isString(key) && key !== 'NaN' && key[0] !== '-' && '' + parseInt(key, 10) === key;
export const defaults = <{
    current: IStoreMapper | null,
    inMethod: boolean,
    inMethodName: string,
    engineMaps: Set<IReactive>,
    followTracking: boolean,
    stoptrigger: boolean,
    SystemTypes: Set<any>
}>{}


let trackStack: boolean[] = []
let triggerStack: boolean[] = [];
export function pauseTracking() {
    trackStack.push(defaults.followTracking)
    defaults.followTracking = false;
}

export function enableTracking() {
    trackStack.push(defaults.followTracking)
    defaults.followTracking = true;
}

export function resetTracking() {
    const last = trackStack.pop();
    defaults.followTracking = last === undefined ? true : last;
}

export function pauseTrigger() {
    triggerStack.push(defaults.stoptrigger)
    defaults.stoptrigger = true;
}

export function enableTrigger() {
    triggerStack.push(defaults.stoptrigger)
    defaults.stoptrigger = false;
}

export function resetTrigger() {
    const last = triggerStack.pop();
    defaults.stoptrigger = last === undefined ? false : last;
}


export function GUID() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
}

export function def(prop, key, value) {
    Object.defineProperty(prop, key, value);
}

export function hasDescVal(prop, name) {
    var oldDescriptor = Reflect.getOwnPropertyDescriptor(prop, name);
    if (oldDescriptor && typeof oldDescriptor.value == 'function') {
        return true;
    }
    return false;
}