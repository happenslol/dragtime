import { DraggableItem, DraggableState } from './draggable-item'
import { Placeholder } from './placeholder'
import { noop } from './util'
import { WindowEvent, DtimeClass, Limit, Direction, Position } from './types'

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
    private lastIndexOffset: number = 0
    private draggingIndexOffset: number = 0
    private draggingLimits: Array<Limit> = []
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
        this.bodyRef.classList.add(DtimeClass.BodyDragging)

        this.draggingItem = item
        item.setPosition(item.originalPosition)
        item.state = DraggableState.Dragging

        this.placeholder = new Placeholder(item)
        this.draggingIndexOffset = 0
        this.lastIndexOffset = 0

        this.calculateNewLimits()
    }

    onMouseDown(ev: MouseEvent): void {}

    onMouseUp(ev: MouseEvent): void {
        if (this.draggingItem) {
            this.draggingItem.removeStyle()
            this.draggingItem.state = DraggableState.Idle
        }

        this.state = SortableState.Idle
        this.unbindWindowEvents()
        this.bodyRef.classList.remove(DtimeClass.BodyDragging)

        this.draggingItem = undefined
        this.draggingIndexOffset = 0
        this.lastIndexOffset = 0

        if (!this.placeholder) {
            console.error("No placeholder present during drag!")
            return
        }

        this.placeholder.destroy()
        this.placeholder = undefined

        this.resetElements()
    }

    onMouseMove(ev: MouseEvent): void {
        if (!this.draggingItem) {
            console.log('no dragging item on mouse move')
            return
        }

        ev.preventDefault()

        const { clientX: x, clientY: y } = ev
        this.draggingItem.setPosition({ x, y })

        this.draggingLimits.forEach(it => {
            if (this.isLimitExceeded(it, { x, y })) {
                this.draggingLimits = []
                switch (it.direction) {
                    case Direction.Left:
                        this.draggingIndexOffset -= 1
                        break
                    case Direction.Right:
                        this.draggingIndexOffset += 1
                        break
                }

                this.moveElements()
                this.calculateNewLimits()
            }
        })
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

    calculateNewLimits(): void {
        if (!this.draggingItem) {
            console.error("No dragging item on limit calculation")
            return
        }

        const currentIndex = this.draggingItem.index + this.draggingIndexOffset

        const previousElementIndex = currentIndex - 1
        const previousElement = this.elements[previousElementIndex]

        const nextElementIndex = currentIndex + 1
        const nextElement = this.elements[nextElementIndex]

        if (nextElement) this.draggingLimits.push(
            this.limitFromElement(Direction.Right, nextElement),
        )

        if (previousElement) this.draggingLimits.push(
            this.limitFromElement(Direction.Left, previousElement),
        )
    }

    moveElements(): void {
        this.resetElements()

        if (this.draggingIndexOffset === 0) {
            return
        }

        if (!this.draggingItem) return

        if (this.draggingIndexOffset < 0) {
            for (let i = this.draggingItem.index + this.draggingIndexOffset; i < this.draggingItem.index; i++) {
                console.log(`moving element ${this.elements[i].index} to the right`)
                const style = { transform: "translateX(100px)"}
                Object.assign(this.elements[i].ref.style, style)
            }
        } else {
            for (let i = this.draggingItem.index + 1; i <= this.draggingItem.index + this.draggingIndexOffset; i++) {
                console.log(`moving element ${this.elements[i].index} to the left`)
                const style = { transform: "translateX(-100px)"}
                Object.assign(this.elements[i].ref.style, style)
            }
        }
    }

    resetElements(): void {
        this.elements.forEach(it => it.ref.removeAttribute("style"))
    }

    private isLimitExceeded(limit: Limit, pos: Position): boolean {
        switch (limit.direction) {
            case Direction.Up:
                return pos.y > limit.offset
            case Direction.Down:
                return pos.y < limit.offset
            case Direction.Left:
                return pos.x < limit.offset
            case Direction.Right:
                return pos.x > limit.offset
        }
    }

    private limitFromElement(direction: Direction, element: DraggableItem): Limit {
        const bounds = element.originalBounds
        switch (direction) {
            case Direction.Up: return {
                direction,
                offset: bounds.top + bounds.height,
            }
            case Direction.Down: return {
                direction,
                offset: bounds.top,
            }
            case Direction.Left: return {
                direction,
                offset: bounds.left + bounds.width,
            }
            case Direction.Right: return {
                direction,
                offset: bounds.left,
            }
        }
    }

    private bindEvent(ev: WindowEvent, fn: (ev: MouseEvent) => void): void {
        window.addEventListener(ev, fn, { capture: true })
    }

    private unbindEvent(ev: WindowEvent, fn: (ev: MouseEvent) => void): void {
        window.removeEventListener(ev, fn, { capture: true })
    }
}
