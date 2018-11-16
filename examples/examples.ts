import { Sortable, ListType } from "../src"

window.addEventListener("load", () => {
    const hor = new Sortable(
        document.getElementsByClassName("list--horizontal")[0],
    )

    const vert = new Sortable(
        document.getElementsByClassName("list--vertical")[0],
        {
            listType: ListType.Vertical,
        },
    )

    hor.addEventListener("dtdragstart", ev => console.dir(ev))
    vert.addEventListener("dtenterbounds", ev => console.dir(ev))
})
