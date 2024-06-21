import { DefaultStoreMapper, IBindingSettingsBase, IStoreBinder } from "reactive-engine";

export class TWBindingSettings implements IBindingSettingsBase<HTMLInputElement | HTMLSelectElement> {
    Property: object;
    FieldName: string;
    owner: HTMLInputElement | HTMLSelectElement;
    references: { prop: object; key: any; }[];

}



export class TwoWayModelBinding implements IStoreBinder<HTMLInputElement | HTMLSelectElement> {
    name = 'TwoWayModelBinding';
    awaiableSetup: boolean = true;
    disposed: boolean = false;
    settings: TWBindingSettings | null = null;
    oldvalue: any;
    setupCompleted: boolean = false;
    public bind: { get: () => any, set: (val) => void } | null = null
    storeMapper: DefaultStoreMapper;
    isFirstCall: boolean = true;
    constructor() {
        this.storeMapper = new DefaultStoreMapper();
        this.storeMapper.binder = this;
    }
    run(): void {
        if (this.settings == null) { return }

        var nValue = this.settings.Property[this.settings.FieldName];
        if (this.oldvalue === nValue) {
            return;
        }
        this.oldvalue = nValue;
        if (this.settings.owner instanceof HTMLSelectElement) {
            var select = <HTMLSelectElement>this.settings.owner;

            if (this.oldvalue !== undefined || this.oldvalue !== null) {
                select.value = this.oldvalue;
            }

            !this.setupCompleted && this.settings.owner.addEventListener("change", (e) => {
                if (!this.settings) { return }

                if (this.oldvalue != select.value) {
                    this.oldvalue = select.value;
                    this.settings.Property[this.settings.FieldName] = select.value as unknown as any;
                }


            });
        }
        switch (this.settings.owner) {

            default:
                var ut = 'input';
                var ii = (this.settings.owner as unknown as HTMLInputElement);
                var self = this;
                if (ii.type == 'checkbox' || ii.type == 'radio') {

                    var Select = (this.settings.owner as unknown as HTMLInputElement);

                    if (this.oldvalue !== undefined || this.oldvalue !== null) {
                        Select.checked = this.oldvalue;
                    } else {
                        Select.checked = false;
                    }

                    !this.setupCompleted && this.settings.owner.addEventListener('change', (e: Event) => {
                        if (!this.settings) { return };
                        var nval = (e as any).target.checked;
                        this.oldvalue = nval;
                        this.settings.Property[this.settings.FieldName] = nval;
                        this.oldvalue = nval;

                    })
                } else {
                    if (this.oldvalue !== undefined || this.oldvalue !== null) {
                        (this.settings.owner as unknown as HTMLInputElement).value = this.oldvalue;
                    }
                    if (ut === 'changed') { ut = 'keydown' }
                    !this.setupCompleted && this.settings.owner.addEventListener(ut, (e: Event) => {
                        if (!this.settings) { return }
                        if (e instanceof KeyboardEvent) {
                            if (e.key == 'Enter') {
                                var nval = (e.target as HTMLInputElement).value as any;

                                if (self.oldvalue != nval) {
                                    if (typeof self.oldvalue === 'number' || typeof nval === 'number') {
                                        nval = parseFloat(nval);
                                    }
                                    self.oldvalue = nval;

                                    if (self.settings) { self.settings.Property[self.settings.FieldName] = nval; }

                                }
                            }
                        } else {
                            var nval = (e.target as HTMLInputElement).value as any;
                            if (self.oldvalue != nval) {

                                if (typeof self.oldvalue === 'number' || typeof nval === 'number') {
                                    nval = parseFloat(nval);
                                }
                                self.oldvalue = nval;
                                this.settings.Property[this.settings.FieldName] = nval;


                            }
                        }
                    })
                }
                break;
        }
        this.setupCompleted = true;
    }
    init(settings: TWBindingSettings): void {

        this.settings = settings;
        this.storeMapper.run();
    }
    setup(target: any, key: string): void {
        if (this.settings) {
            this.settings.FieldName = key;
            this.settings.Property = target;
        }
    }
    dispose(): void {
        this.storeMapper.dispose();
        this.disposed = true;
    }
}


export function bindModel<
    ET extends HTMLInputElement | HTMLSelectElement,
    DT extends object,
    KT extends keyof DT
>(
    element: ET,
    prop: DT,
    key: KT
) {
    var binder = new TwoWayModelBinding();
    var s = new TWBindingSettings();
    s.owner = element;
    s.Property = prop;
    s.FieldName = key.toString();
    binder.init(s);
    return () => binder.dispose();
}
