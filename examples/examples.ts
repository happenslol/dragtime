import { Sortable, ListType } from "../src"

window.addEventListener("load", () => {
    const cols = document.getElementById("drag-columns")
    const colsSortable = new Sortable(cols)

    const todos = document.getElementById("todos")
    const todosSortable = new Sortable(todos, {
        listType: ListType.Vertical,
    })

    const articles = document.getElementById("articles")
    const articlesSortable = new Sortable(articles, {
        listType: ListType.Vertical,
    })
})
