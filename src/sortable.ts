import { DraggableItem, DraggableState } from './draggable-item'
import { Placeholder } from './placeholder'
import { noop } from './util'
import {
    WindowEvent,
    DtimeClass,
    Limit,
    Direction,
    Position,
    Bounds,
    Margins,

    emptyBounds,
    emptyMargins,
    DisplacementDirection,
    Displacement,
    emptyDisplacement,
} from './types'

export enum SortableState {
    Idle,
    Pending,
    Dragging,
    Dropping,
}

export class Sortable {
    private elements: Array<DraggableItem> = []
    private bodyRef: HTMLElement = <HTMLElement>document.querySelector('body')

    state: SortableState = SortableState.Idle

    private draggingItem?: DraggableItem
    private clickOffset: Position = { x: 0, y: 0 }
    private draggingIndexOffset: number = 0
    private draggingLimits: Array<Limit> = []
    private placeholder?: Placeholder

    private bounds: Bounds = emptyBounds()
    private margins: Margins = emptyMargins()
    private wasOutOfBounds: boolean = false

    onMouseDownBinding: (ev: MouseEvent) => void
    onMouseUpBinding: (ev: MouseEvent) => void
    onMouseMoveBinding: (ev: MouseEvent) => void

    constructor(
        private ref: HTMLElement,
        childSelector?: string,
    ) {
        this.onMouseDownBinding = this.onMouseDown.bind(this)
        this.onMouseUpBinding = this.onMouseUp.bind(this)
        this.onMouseMoveBinding = this.onMouseMove.bind(this)

        if (childSelector) {
            // TODO: make sure these are all children and don't
            // contain each other
            const children = ref.querySelectorAll(childSelector)

            for (let i = 0; i < children.length; i++) {
                const child = new DraggableItem(
                    <HTMLElement>children[i], i,
                    this.onChildMouseDown.bind(this),
                )

                this.elements.push(child)
            }
        } else {
            for (let i = 0; i < ref.children.length; i++) {
                const child = new DraggableItem(
                    <HTMLElement>ref.children[i], i,
                    this.onChildMouseDown.bind(this),
                )

                this.elements.push(child)
            }
        }

        this.calculateDimensions()
    }

    calculateDimensions(): void {
        const { top, left, width, height } = this.ref.getBoundingClientRect()
        this.bounds = { top, left, width, height }

        const style = window.getComputedStyle(this.ref)
        this.margins = {
            top: parseInt(style.marginTop || "0", 10),
            bottom: parseInt(style.marginBottom || "0", 10),
            left: parseInt(style.marginLeft || "0", 10),
            right: parseInt(style.marginRight || "0", 10) || 0,
        }
    }

    onChildMouseDown(item: DraggableItem, ev: MouseEvent): void {
        // TODO: can we start dragging, sloppy click detection etc.
        const { clientX: x, clientY: y } = ev
        const pos: Position = { x, y }

        this.startDragging(item, pos)
    }

    startDragging(item: DraggableItem, pos: Position): void {
        this.state = SortableState.Dragging
        this.bindWindowEvents()
        this.bodyRef.classList.add(DtimeClass.BodyDragging)

        this.draggingItem = item
        item.setPosition({ x: item.bounds.left, y: item.bounds.top })
        item.state = DraggableState.Dragging

        this.placeholder = new Placeholder(item)
        this.draggingIndexOffset = 0

        this.wasOutOfBounds = false

        const diffX = pos.x - item.bounds.left
        const diffY = pos.y - item.bounds.top

        this.clickOffset = { x: diffX, y: diffY }
        this.calculateNewLimits(pos)
    }

    stopDragging(): void {
        if (!this.draggingItem) {
            console.error("No dragging item on stop dragging")
            return
        }

        this.draggingItem.state = DraggableState.Idle
        this.draggingItem = undefined

        this.state = SortableState.Idle
        this.unbindWindowEvents()
        this.bodyRef.classList.remove(DtimeClass.BodyDragging)

        this.draggingIndexOffset = 0

        if (!this.placeholder) {
            console.error("No placeholder on stop dragging")
            return
        }

        this.placeholder.destroy()
        this.placeholder = undefined

        this.resetElements()
    }

    continueDragging(pos: Position): void {
        if (!this.draggingItem) {
            console.log("No dragging item on continue dragging")
            return
        }

        const itemPos: Position = {
            x: pos.x - this.clickOffset.x,
            y: pos.y - this.clickOffset.y,
        }
        this.draggingItem.setPosition(itemPos)

        const itemCenter: Position = {
            x: itemPos.x + (this.draggingItem.bounds.width / 2),
            y: itemPos.y + (this.draggingItem.bounds.height / 2),
        }

        if (!this.isInSortableBounds(itemCenter)) {
            if (!this.wasOutOfBounds) {
                // NOTE: Left bounds
                this.wasOutOfBounds = true

                // Reset limits. Might want to keep limits intact
                // in some form if recalculating them on reenter
                // incurs some sort of performance penalty.
                this.draggingLimits = []
                this.draggingIndexOffset = 0
                this.resetElements()
            }

            return
        }

        let newOffset = 0

        // If we were out of bounds before, we need to recalculate
        // our limits
        if (this.wasOutOfBounds) {
            // NOTE: Entered bounds
            this.wasOutOfBounds = false

            newOffset = this.findNewDraggingIndex(itemCenter)

            this.draggingIndexOffset = newOffset
            this.calculateNewLimits(itemCenter)
            this.displaceItems(0, newOffset)

            return
        }

        this.draggingLimits.forEach(it => {
            if (this.isLimitExceeded(it, itemCenter)) {
                newOffset = this.findNewDraggingIndex(itemCenter)
                const oldOffset = this.draggingIndexOffset

                this.draggingIndexOffset = newOffset
                this.calculateNewLimits(itemCenter)
                this.displaceItems(oldOffset, newOffset)
            }
        })
    }

    displaceItems(oldOffset: number, newOffset: number): void {
        if (!this.draggingItem) {
            console.error("Tried to displace items without dragging item")
            return
        }

        const oldIndex = this.draggingItem.index + oldOffset
        const newIndex = this.draggingItem.index + newOffset

        if (newOffset > 0) {
            // Moving right of 0
            if (oldOffset < newOffset) {
                // fowards
                for (let i = oldIndex + 1; i <= newIndex; i++)
                    this.elements[i].setDisplacement({
                        direction: DisplacementDirection.Backward,
                        offset: this.draggingItem.marginBounds.width,
                    })

            } else if (oldOffset > newOffset) {
                //backwards
                for (let i = oldIndex; i > newIndex; i--)
                    this.elements[i].setDisplacement(emptyDisplacement())
            }

        } else if (newOffset < 0) {
            // Moving left of 0
            if (oldOffset < newOffset) {
                // fowards
                for (let i = oldIndex; i < newIndex; i++)
                    this.elements[i].setDisplacement(emptyDisplacement())

            } else if (oldOffset > newOffset) {
                //backwards
                for (let i = oldIndex - 1; i >= newIndex; i--)
                    this.elements[i].setDisplacement({
                        direction: DisplacementDirection.Forward,
                        offset: this.draggingItem.marginBounds.width,
                    })
            }

        } else {
            this.resetElements()
        }
    }

    onMouseDown(ev: MouseEvent): void {}

    onMouseUp(ev: MouseEvent): void {
        this.stopDragging()
    }

    onMouseMove(ev: MouseEvent): void {
        ev.preventDefault()

        const { clientX: x, clientY: y } = ev
        const pos: Position = { x, y }

        this.continueDragging(pos)
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

    calculateNewLimits(pos: Position): void {
        if (!this.draggingItem) {
            console.error("No dragging item on limit calculation")
            return
        }

        this.draggingLimits = []

        // TODO: Implement this for vertical and grid lists
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

    findNewDraggingIndex(pos: Position): number {
        if (!this.draggingItem) {
            console.error("No dragging item on find new index")
            return 0
        }

        // NOTE: If no new index is found, the old one is returned
        // TODO: Implement this for vertical/grid lists
        let result = 0

        for (let i = 0; i < this.elements.length; i++) {
            const it = this.elements[i]

            const x1 = it.marginBounds.left
            const x2 = it.marginBounds.left + it.marginBounds.width

            if (pos.x >= x1 && pos.x <= x2) {
                // Found element!
                const draggingIndex = this.draggingItem.index
                result = it.index - draggingIndex
                break
            }
        }

        return result
    }

    // NOTE: This NEVER resets the dragging item!
    resetElements(): void {
        this.elements
            .filter(it => it != this.draggingItem)
            .forEach(it => it.resetDisplacement())
    }

    private isInSortableBounds(pos: Position): boolean {
        if (!this.draggingItem) {
            console.error("No dragging item on is in sortable bounds")
            return true
        }

        const x1 = this.bounds.left
        const x2 = this.bounds.left + this.bounds.width

        const y1 = this.bounds.top
        const y2 = this.bounds.top + this.bounds.height

        return (
            (pos.x >= x1 && pos.x <= x2) &&
            (pos.y >= y1 && pos.y <= y2)
        ) 
    }

    private isLimitExceeded(limit: Limit, pos: Position): boolean {
        if (!this.draggingItem) {
            console.error("No dragging item on is limit exceeded")
            return false
        }

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

        return false
    }

    private limitFromElement(direction: Direction, element: DraggableItem): Limit {
        const { marginBounds } = element
        switch (direction) {
            case Direction.Up: return {
                direction,
                offset: marginBounds.top + marginBounds.height,
            }
            case Direction.Down: return {
                direction,
                offset: marginBounds.top,
            }
            case Direction.Left: return {
                direction,
                offset: marginBounds.left + marginBounds.width,
            }
            case Direction.Right: return {
                direction,
                offset: marginBounds.left,
            }
            case Direction.None: {
                console.error('Cant get limit with no direction')
                return { direction, offset: 0 }
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
