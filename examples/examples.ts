import { Sortable, ListType } from "../src"

window.addEventListener("load", () => {
    const tableEl = document.getElementsByClassName("sortable-table")[0]!
    const tableSortable = new Sortable(tableEl, {
        listType: ListType.Vertical,
        customClasses: {
            "draggingItem": "table-dragging",
        }
    })
})
