import { DraggableItem, DraggableState } from './draggable-item'
import { noop } from './util'

export enum SortableState {
    Idle,
    Pending,
    Dragging,
    Dropping,
}

export class Sortable {
    private elements: Array<DraggableItem> = []
    private bodyRef: HTMLElement =
        <HTMLElement>document.querySelector('body')

    state: SortableState = SortableState.Idle
    private draggingItem: DraggableItem | null = null

    onMouseDownBinding: (ev: MouseEvent) => void
    onMouseUpBinding: (ev: MouseEvent) => void
    onMouseMoveBinding: (ev: MouseEvent) => void

    constructor(
        elem: HTMLElement,
        childSelector?: string,
    ) {
        this.onMouseDownBinding = this.onMouseDown.bind(this)
        this.onMouseUpBinding = this.onMouseUp.bind(this)
        this.onMouseMoveBinding = this.onMouseMove.bind(this)

        if (childSelector) {
            // TODO: make sure these are all children and don't
            // contain each other
            const children = elem.querySelectorAll(childSelector)

            for (let i = 0; i < children.length; i++) {
                const child = new DraggableItem(
                    <HTMLElement>children[i], i,
                    this.onChildMouseDown.bind(this),
                )

                this.elements.push(child)
            }
        } else {
            for (let i = 0; i < elem.children.length; i++) {
                const child = new DraggableItem(
                    <HTMLElement>elem.children[i], i,
                    this.onChildMouseDown.bind(this),
                )

                this.elements.push(child)
            }
        }
    }

    onChildMouseDown(item: DraggableItem, ev: MouseEvent) {
        this.state = SortableState.Dragging
        this.bindBodyListeners()

        this.draggingItem = item
        item.setState(DraggableState.Dragging)
    }

    onMouseDown(ev: MouseEvent) {}

    onMouseUp(ev: MouseEvent) {
        if (this.draggingItem !== null)
            this.draggingItem.setState(DraggableState.Idle)

        this.state = SortableState.Idle
        this.draggingItem = null
        this.unbindBodyListeners()
    }

    onMouseMove(ev: MouseEvent) {
        const { clientX, clientY } = ev

        if (this.draggingItem === null) {
            console.log('invalid state')
            return
        }

        this.draggingItem.setPosition({ x: clientX, y: clientY })
    }

    bindBodyListeners() {
        this.bodyRef.addEventListener('mousedown', this.onMouseDownBinding)
        this.bodyRef.addEventListener('mouseup', this.onMouseUpBinding)
        this.bodyRef.addEventListener('mousemove', this.onMouseMoveBinding)
    }

    unbindBodyListeners() {
        this.bodyRef.removeEventListener('mousedown', this.onMouseDownBinding)
        this.bodyRef.removeEventListener('mouseup', this.onMouseUpBinding)
        this.bodyRef.removeEventListener('mousemove', this.onMouseMoveBinding)
    }
}
