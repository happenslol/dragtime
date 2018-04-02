import { DraggableItem, DraggableState } from './draggable-item'
import { Placeholder } from './placeholder'
import { noop } from './util'
import { WindowEvent, DndClass } from './types'

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
        this.bodyRef.classList.add(DndClass.BodyDragging)

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
        this.unbindWindowEvents()
        this.bodyRef.classList.remove(DndClass.BodyDragging)

        this.draggingItem = undefined

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
        this.bindEvent('mousedown', this.onMouseDownBinding)
        this.bindEvent('mouseup', this.onMouseUpBinding)
        this.bindEvent('mousemove', this.onMouseMoveBinding)
    }

    unbindWindowEvents(): void {
        this.unbindEvent('mousedown', this.onMouseDownBinding)
        this.unbindEvent('mouseup', this.onMouseUpBinding)
        this.unbindEvent('mousemove', this.onMouseMoveBinding)
    }

    private bindEvent(ev: WindowEvent, fn: (ev: MouseEvent) => void): void {
        window.addEventListener(ev, fn, { capture: true })
    }

    private unbindEvent(ev: WindowEvent, fn: (ev: MouseEvent) => void): void {
        window.removeEventListener(ev, fn, { capture: true })
    }
}
