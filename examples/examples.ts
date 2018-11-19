import { Sortable, ListType } from "../src"

window.addEventListener("load", () => {
    const cols = document.getElementById("drag-columns")
    const colsSortable = new Sortable(cols, {
        customClasses: {
            draggingItem: "dragging-column",
        },
    })

    const todos = document.getElementById("todos")
    const todosSortable = new Sortable(todos, {
        listType: ListType.Vertical,
        customClasses: {
            draggingItem: "dragging",
            draggingContainer: "dragging-bg",
        },
    })

    const articles = document.getElementById("articles")
    const articlesSortable = new Sortable(articles, {
        listType: ListType.Vertical,
        customClasses: {
            draggingItem: "dragging",
            draggingContainer: "dragging-bg",
        },
    })
})
