import { Sortable } from '../index'

window.addEventListener('load', () => {
    const horizontalList = <HTMLCollection>document.getElementsByClassName(
        'list--horizontal',
    )

    let item = horizontalList.item(0)
    if (item !== null) {
        const horizontalSortable = new Sortable(item as HTMLElement)
    }
})
