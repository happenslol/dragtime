import { Sortable, ListType } from "../src"

window.addEventListener("load", () => {
    new Sortable(document.getElementsByClassName("list--horizontal")[0])

    new Sortable(document.getElementsByClassName("list--vertical")[0], {
        listType: ListType.Vertical,
    })
})
