import { Sortable } from '../index'

console.log('hello world2!')

const horizontalList = <HTMLElement>document.querySelector(
    '.list--horizontal',
)

const horizontalSortable= new Sortable(
    horizontalList,
)
