import { Sortable } from '../index'

const horizontalList = <HTMLElement>document.querySelector(
    '.list--horizontal',
)

const horizontalSortable= new Sortable(
    horizontalList,
)
