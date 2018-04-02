import { DraggableItem, DraggableState } from './draggable-item'
import { Placeholder } from './placeholder'
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
    private draggingItem?: DraggableItem
    private placeholder?: Placeholder

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

    onChildMouseDown(item: DraggableItem, ev: MouseEvent): void {
        this.state = SortableState.Dragging
        this.bindWindowEvents()

        this.draggingItem = item
        item.setPosition(item.originalPosition)
        item.state = DraggableState.Dragging
        this.placeholder = new Placeholder(item)
    }

    onMouseDown(ev: MouseEvent): void {}

    onMouseUp(ev: MouseEvent): void {
        if (this.draggingItem) {
            this.draggingItem.removeStyle()
            this.draggingItem.state = DraggableState.Idle
        }

        this.state = SortableState.Idle
        this.draggingItem = undefined

        this.unbindWindowEvents()

        if (!this.placeholder) {
            console.error("No placeholder present during drag!")
            return
        }

        this.placeholder.destroy()
        this.placeholder = undefined
    }

    onMouseMove(ev: MouseEvent): void {
        if (!this.draggingItem) {
            console.log('invalid state')
            return
        }

        ev.preventDefault()

        const { clientX, clientY } = ev
        this.draggingItem.setPosition({ x: clientX, y: clientY })
    }

    bindWindowEvents(): void {
        window.addEventListener('mousedown', this.onMouseDownBinding)
        window.addEventListener('mouseup', this.onMouseUpBinding)
        window.addEventListener('mousemove', this.onMouseMoveBinding)
    }

    unbindWindowEvents(): void {
        window.removeEventListener('mousedown', this.onMouseDownBinding)
        window.removeEventListener('mouseup', this.onMouseUpBinding)
        window.removeEventListener('mousemove', this.onMouseMoveBinding)
    }
}
