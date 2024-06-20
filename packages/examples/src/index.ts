import { Reactive } from "reactive-engine";
import { bindElement } from "./BasicBinding";
import { bindModel } from "./TwoWayModelBinding";
var reactive = new Reactive();
let model = reactive.observe({
    intValue: 1,
    stringValue: 'Item',
    dateValue: new Date(),
    objectValue: {
        prop1: 'Property One',
        prop2: 'Property Two',
    },
    array: [{ text: 'Item 1' }, { text: 'Item 2' }, { text: 'Item 3' }],
    mapValues: new Map(),
    setValues: new Set(),
})

var ivei = document.getElementById('int_value_input') as HTMLInputElement;
var ive = document.getElementById('int_values') as HTMLSpanElement;

reactive.watch(model, 'intValue', (s) => {
    if (ive) ive.textContent = s.toString();
    if (ivei) ivei.value = s.toString()
})



if (ivei) {
    ivei.addEventListener('input', () => {
        model.intValue = Number.parseInt(ivei.value);
    })
}

var sd = document.getElementById('string_values') as HTMLSpanElement;
var si = document.getElementById('string_values_input') as HTMLInputElement;

if (si) {
    si.value = model.stringValue;
    si.addEventListener('input', () => {
        model.stringValue = si.value;
    })
}

reactive.watch(model, 'stringValue', (s) => {
    if (sd) sd.textContent = s;
    if (si) si.value = s
})



reactive.watch(() => {
    var date_d = document.getElementById('date_d') as HTMLSpanElement;
    if (date_d) date_d.textContent = model.dateValue as any;

    var date_i = document.getElementById('date_i') as HTMLInputElement;
    if (date_i) {
        date_i.value = model.dateValue as any
        date_i.addEventListener('input', () => {
            model.dateValue = date_i.value as any;
        })
    }
})

var array_table = document.getElementById('array_table') as HTMLTableElement;
var add_item_array = document.getElementById('add_item_array') as HTMLInputElement;

var item_id = 1;
add_item_array.addEventListener('click', () => {
    item_id++;
    model.array.push({ text: 'Item ' + item_id })
})


reactive.watch(() => {
    array_table.innerHTML = `${model.array.filter(x => x.text.startsWith(model.stringValue)).map(item => {
        return `<tr><td>${item.text}</td></tr>`
    }).join('')}`;

})

var map_table = document.getElementById('map_table') as HTMLTableElement;
var add_item_map = document.getElementById('add_item_map') as HTMLInputElement;

var item_id = 1;
add_item_map.addEventListener('click', () => {
    item_id++;
    model.mapValues.set(item_id, { text: 'Item ' + item_id })
})
reactive.watch(() => {
    var str = "";
    model.mapValues.forEach(item => {
        str = str + `<tr><td>${item.text}</td></tr>`
    });
    map_table.innerHTML = str;

})


var autoBind = document.getElementById('autobind');
var select_input = document.getElementById("select_input") as HTMLSelectElement;
bindModel(select_input, model, 'stringValue');
autoBind && bindElement(autoBind, 'innerHTML', model, 'stringValue');