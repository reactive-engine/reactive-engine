//https://jsonplaceholder.typicode.com/photos

import { Reactive } from "reactive-engine";
var reactive = new Reactive();
let model = reactive.observe({
    items: <{
        "albumId": number,
        "id": number,
        "title": string,
        "url": string,
        "thumbnailUrl": string
    }[]>[]
})

window["arms"] = reactive;
let loaded = false;
document.addEventListener('click', () => {
    if (loaded) {
        model.items = [];
        loaded = false;
    } else {
        loaded = true;
        fetch("https://jsonplaceholder.typicode.com/photos").then(x => x.json()).then(d => {
            model.items = d;
        })
    }
})

var array_table = document.getElementById('array_table') as HTMLTableElement;

var trElement = document.createElement("tr");
var tdElement = document.createElement("td");
reactive.watch(() => {
    for (let index = array_table.childNodes.length - 1; index > -1; index--) {
         
        array_table.childNodes[index].remove();
    }

    model.items.forEach(item => {
        var c = tdElement.cloneNode(true);
        c.textContent = item.title;
        var r = trElement.cloneNode(true);
        r.appendChild(c);
        array_table.appendChild(r)
    });
})