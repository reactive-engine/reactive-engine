import { defaults } from "../common";
export type DirectiveBindingType = "function" | "expression" | 'model';

export function CheckType(_settings: IStoreBindingSettings<any>) {
    let val: any;
    switch (_settings.type) {
        case "expression":
            if (_settings.Property && _settings.FieldName) {
                _settings.callback = () => {
                    val = (_settings.Property as any)[_settings.FieldName];
                    return val;
                }
                val = _settings.callback();
            }
            break;
        case "function":
            val = _settings.callback();
            break;
        case "model":
            if (_settings.bind) {
                _settings.callback = _settings.bind.get;
            }
            val = _settings.callback();
            break;
        default:
            break;
    }

    if (typeof val === 'function') {
        val = val();
    }

    return val;
}


export class IStoreBindingSettings<OwnerType extends object> {
    public Property!: object;
    public FieldName!: string;
    public callback!: () => any;
    public type: DirectiveBindingType = "function";
    public bind?: {
        get: () => void,
        set: (value) => void
    }
    public owner: OwnerType = null as any;
    references: { prop: object, key: any }[] = [];
}

export interface IStoreBinder<OwnerType extends object> {
    awaiableSetup: boolean;
    disposed: boolean;
    run(): void;
    init(settings: IStoreBindingSettings<OwnerType>): void
    setup(target: any, key: string): void;
    dispose(): void;
    name: string;
    isFirstCall: boolean;

}

export interface IStoreMapper {
    binder: IStoreBinder<any>;
    run(): void;
    dispose(): void;
    ondisposing?: () => void;
    depends: Set<IStoreMapper>;
    parents: Set<IStoreMapper>;
    parent: IStoreMapper | null;
    disposed: boolean;
    activeModel: any;
    activeKey: any;
    models: { model: any, key: any }[]
}

export class DefaultStoreBindingSettings<OwnerType extends object> implements IStoreBindingSettings<OwnerType> {
    public bind?: { get: () => void; set: (value: any) => void; } | undefined;
    public owner!: OwnerType;
    public Property!: object;
    public FieldName!: string;
    public callback!: () => any;
    public type!: DirectiveBindingType;
    public references: { prop: object, key: any }[] = [];
}

export class DefaultStoreMapper implements IStoreMapper {
    constructor() {
        this.run = this.run.bind(this);
        this.dispose = this.dispose.bind(this);
        this.id = Symbol('StoreMapper');
    }
    models: { model: any; key: any; }[] = [];
    disposed: boolean = false;
    binder: IStoreBinder<any> | any = null;
    activeModel: any = null;
    activeKey: any = null;
    id: Symbol;
    run(): void {
        const self = this;
        if (this.binder) {
            let result;
            this.parent = defaults.current;
            defaults.current = self;
            result = this.binder.run();
            this.binder.isFirstCall = false;
            defaults.current = this.parent != this.parent ? this.parent : null;
            return result;
        } else {
            defaults.current = null;
        }
    }
    dispose(): void {
        if (!this) {
            return;
        }
        defaults.engineMaps.forEach(em => {

            this.binder?.settings?.references?.forEach(ref => {
                if (em.targetMap.get(ref.prop)?.has(ref.key)) {
                    em.targetMap.get(ref.prop)?.get(ref.key)?.delete(this);
                    if (em.targetMap.get(ref.prop)?.get(ref.key)?.size == 0) {
                        em.targetMap.get(ref.prop)?.delete(ref.key)
                    }
                }
                if (em.targetMap.get(ref.prop)?.get(ref.key)?.size == 0) {
                    em.targetMap.get(ref.prop)?.delete(ref.key)
                }
                if (em.targetMap.get(ref.prop)?.size == 0) {
                    em.targetMap.delete(ref.prop)
                }
            })

            const existModels = em.targetMap.get(this.binder.settings?.Property);
            if (existModels && existModels.has(this.binder.settings?.FieldName)) {
                existModels.get(this.binder.settings?.FieldName)?.delete(this);
                if (existModels.get(this.binder.settings?.FieldName)?.size == 0) {
                    existModels.delete(this.binder.settings.FieldName)
                }
            }
            if (em.targetMap.get(this.binder.settings?.Property)?.get(this.binder.settings.FieldName)?.size == 0) {
                em.targetMap.get(this.binder.settings?.Property)?.delete(this.binder.settings.FieldName)
            }
            if (em.targetMap.get(this.binder.settings?.Property)?.size == 0) {
                em.targetMap.delete(this.binder.settings?.Property)
            }
        })
        this.disposed = true;
        this.parents.delete(this);
        this.parents = null as any;
        this.depends.clear();
        this.depends = null as any;
        this.parent = null;
        this.models = null as any;
        this.binder = null as any;
        this.activeKey = null;
        this.activeModel = null;
        this.id = null as any;
    }
    ondisposing?: (() => void) | undefined;
    depends: Set<IStoreMapper> = new Set();
    parents: Set<IStoreMapper> = new Set();
    parent: IStoreMapper | null = null;
}

export class EffectStoreBinder implements IStoreBinder<any> {
    name = 'EffectStoreBinder';
    awaiableSetup: boolean = true;
    disposed: boolean = false;
    settings: DefaultStoreBindingSettings<any> | null = null;
    oldvalue: any;
    storeMapper: IStoreMapper = null as any;
    isFirstCall: boolean = true;
    constructor() {
        const t = this;
        t.storeMapper = new DefaultStoreMapper();
        t.storeMapper.binder = t;
    }
    run(): void {
        if (this.settings == null) { return }
        CheckType(this.settings);
    }
    init(settings: DefaultStoreBindingSettings<any>): void {
        this.settings = settings;
        this.storeMapper.run();

    }
    setup(target: any, key: string): void {
        const t = this;
        if (t.settings) {
            t.settings.FieldName = key;
            t.settings.Property = target;
            t.settings.references.push({ key: key, prop: target })
        }
    }
    dispose(): void {
        this.storeMapper.dispose();
        this.disposed = true;
        this.settings = null;
        this.oldvalue = null;
        this.storeMapper = null as any;
        this.isFirstCall = null as any;
    }
} 