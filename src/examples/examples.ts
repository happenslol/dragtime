import { Sortable, ListType } from '../index'

window.addEventListener('load', () => {
    const horizontalList = <HTMLCollection>document.getElementsByClassName(
        'list--horizontal',
    )

    const horizontalItem = horizontalList.item(0)
    if (horizontalItem !== null) {
        const horizontalSortable = new Sortable(
            horizontalItem as HTMLElement,
        )
    }

    const verticalList = <HTMLCollection>document.getElementsByClassName(
        'list--vertical',
    )

    let verticalItem = verticalList.item(0)
    if (verticalItem !== null) {
        const verticalSortable = new Sortable(
            verticalItem as HTMLElement,
            { listType: ListType.Vertical },
        )
    }
})
