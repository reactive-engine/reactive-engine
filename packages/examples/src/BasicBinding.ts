import { DefaultStoreBindingSettings, EffectStoreBinder } from "reactive-engine";

export function bindElement<
    ET extends HTMLElement,
    EP extends keyof ET,
    DT,
    KT extends keyof DT
>(
    element: ET,
    elementProp: EP,
    prop: DT,
    key: KT
) {
    var binder = new EffectStoreBinder();
    var s = new DefaultStoreBindingSettings();

    s.callback = () => {
         
        if (element) { 
            element[elementProp as any] = prop[key];
        }
    }
    s.type = 'function';
    binder.init(s);
    return () => binder.dispose();
}


//bindElement(document.createElement('div'), 'textContent', { name: 'Ekrem' }, 'name');