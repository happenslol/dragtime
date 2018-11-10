import { DraggableItem, DraggableState } from "./draggable-item"
import { Placeholder } from "./placeholder"
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
    emptyDisplacement,
    ListType,
} from "./types"
import { Animation } from "./animate"

export enum SortableState {
    Idle,
    Pending,
    Dragging,
    Dropping,
}

export interface SortableOptions {
    listType?: ListType
    childSelector?: string
}

const DefaultOptions: SortableOptions = {
    listType: ListType.Horizontal,
    childSelector: undefined,
}

export class Sortable {
    private elements: Array<DraggableItem> = []
    private bodyRef: HTMLElement = <HTMLElement>document.querySelector("body")

    state: SortableState = SortableState.Idle

    private draggingItem?: DraggableItem
    private clickOffset: Position = { x: 0, y: 0 }
    private draggingIndexOffset: number = 0
    private draggingLimits: Array<Limit> = []
    private placeholder?: Placeholder

    private bounds: Bounds = emptyBounds()
    private margins: Margins = emptyMargins()
    private wasOutOfBounds: boolean = false

    private listType: ListType

    onMouseDownBinding = this.onMouseDown.bind(this)
    onMouseUpBinding = this.onMouseUp.bind(this)
    onMouseMoveBinding = this.onMouseMove.bind(this)

    constructor(
        private ref: HTMLElement,
        options: SortableOptions = DefaultOptions,
    ) {
        this.listType =
            options.listType !== undefined && options.listType !== null
                ? options.listType
                : DefaultOptions.listType!

        const children = Array.from(
            options.childSelector
                ? ref.querySelectorAll(options.childSelector)
                : ref.children,
        )

        this.elements = children.map(
            (it, index) =>
                new DraggableItem(
                    it as HTMLElement,
                    index,
                    this.listType,
                    this.onChildMouseDown.bind(this),
                ),
        )

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
        if (this.state !== SortableState.Idle) return

        const { clientX: x, clientY: y } = ev
        const pos: Position = { x, y }

        this.startDragging(item, pos)
    }

    startDragging(item: DraggableItem, pos: Position): void {
        if (this.state !== SortableState.Idle)
            throw new Error("Tried to drag while in idle")

        requestAnimationFrame(() => {
            this.elements.forEach(it => it.calculateDimensions())

            this.state = SortableState.Dragging
            this.bindWindowEvents()
            this.bodyRef.classList.add(DtimeClass.BodyDragging)

            this.draggingItem = item
            item.setPosition({ x: item.bounds.left, y: item.bounds.top })
            item.state = DraggableState.Dragging

            this.elements.forEach(it => {
                if (it == this.draggingItem) return
                it.ref.classList.add(DtimeClass.SteppingAside)
            })

            this.placeholder = new Placeholder(item)
            this.draggingIndexOffset = 0

            this.wasOutOfBounds = false

            const diffX = pos.x - item.bounds.left
            const diffY = pos.y - item.bounds.top

            this.clickOffset = { x: diffX, y: diffY }
            this.calculateNewLimits()
        })
    }

    private moveItemsAfterDrag(): void {
        if (!this.draggingItem)
            throw new Error("No dragging item on stop dragging")

        if (!this.placeholder)
            throw new Error("No placeholder on stop dragging")

        this.elements.forEach(it => {
            it.ref.classList.remove(DtimeClass.SteppingAside)
        })

        if (this.draggingIndexOffset !== 0) {
            const insertParent = this.draggingItem.ref.parentNode
            if (!insertParent)
                throw new Error("No parent node on stop dragging")

            const draggedToIndex =
                this.draggingItem.index + this.draggingIndexOffset
            const draggedToElement = this.elements[draggedToIndex]
            if (!draggedToElement)
                throw new Error("Dragged to element not found on stop dragging")

            if (this.draggingIndexOffset > 0) {
                insertParent.insertBefore(
                    this.draggingItem.ref,
                    draggedToElement.ref.nextSibling,
                )
            } else if (this.draggingIndexOffset < 0) {
                insertParent.insertBefore(
                    this.draggingItem.ref,
                    draggedToElement.ref,
                )
            }

            insertParent.insertBefore(
                this.placeholder.ref,
                this.draggingItem.ref,
            )

            const allElements = Array.from(
                this.draggingItem.ref.parentElement!.children,
            ).filter(it => !it.classList.contains(DtimeClass.Placeholder))

            this.elements.forEach(it => {
                it.index = allElements.indexOf(it.ref)
            })

            if (this.elements.some(it => it.index === -1))
                throw new Error("Element not found in parent")

            this.elements.sort(({ index: a }, { index: b }) => {
                if (a > b) return 1
                if (a < b) return -1

                throw new Error("Found same index twice")
            })
        }

        this.resetElements()
    }

    private stopDragging(): void {
        this.unbindWindowEvents()
        this.moveItemsAfterDrag()

        this.bodyRef.classList.remove(DtimeClass.BodyDragging)
        this.draggingIndexOffset = 0

        requestAnimationFrame(() => {
            const snapAnimation = new Animation(
                this.draggingItem!,
                this.placeholder!,
                () => {
                    this.draggingItem!.state = DraggableState.Idle
                    this.draggingItem!.removeStyle()
                    this.draggingItem = undefined

                    requestAnimationFrame(() => {
                        this.placeholder!.destroy()
                        this.placeholder = undefined

                        this.state = SortableState.Idle
                    })
                },
            )

            snapAnimation.run()
        })
    }

    private continueDragging(pos: Position): void {
        if (!this.draggingItem)
            throw new Error("No dragging item on continue dragging")

        const itemPos: Position = {
            x: pos.x - this.clickOffset.x,
            y: pos.y - this.clickOffset.y,
        }

        this.draggingItem.setPosition(itemPos)

        const itemCenter: Position = {
            x: itemPos.x + this.draggingItem.bounds.width / 2,
            y: itemPos.y + this.draggingItem.bounds.height / 2,
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
            this.calculateNewLimits()
            this.displaceItems(0, newOffset)

            return
        }

        this.draggingLimits.forEach(it => {
            if (this.isLimitExceeded(it, itemCenter)) {
                newOffset = this.findNewDraggingIndex(itemCenter)
                const oldOffset = this.draggingIndexOffset

                this.draggingIndexOffset = newOffset
                this.calculateNewLimits()
                this.displaceItems(oldOffset, newOffset)
            }
        })
    }

    displaceItems(_oldOffset: number, newOffset: number): void {
        if (!this.draggingItem)
            throw new Error("Tried to displace items without dragging item")

        const newIndex = this.draggingItem.index + newOffset

        this.elements.forEach(it => {
            if (it.index === this.draggingItem!.index) return

            if (it.index < this.draggingItem!.index && newIndex <= it.index)
                it.setDisplacement({
                    direction: DisplacementDirection.Forward,
                    offset: this.draggingItem!.marginBounds.width,
                })
            else if (
                it.index > this.draggingItem!.index &&
                newIndex >= it.index
            )
                it.setDisplacement({
                    direction: DisplacementDirection.Backward,
                    offset: this.draggingItem!.marginBounds.width,
                })
            else it.setDisplacement(emptyDisplacement())
        })
    }

    onMouseDown(_ev: MouseEvent): void {}

    onMouseUp(_ev: MouseEvent): void {
        this.stopDragging()
    }

    onMouseMove(ev: MouseEvent): void {
        ev.preventDefault()

        const { clientX: x, clientY: y } = ev
        const pos: Position = { x, y }

        this.continueDragging(pos)
    }

    private bindWindowEvents(): void {
        this.bindEvent("mousedown", this.onMouseDownBinding)
        this.bindEvent("mouseup", this.onMouseUpBinding)
        this.bindEvent("mousemove", this.onMouseMoveBinding)
    }

    private unbindWindowEvents(): void {
        this.unbindEvent("mousedown", this.onMouseDownBinding)
        this.unbindEvent("mouseup", this.onMouseUpBinding)
        this.unbindEvent("mousemove", this.onMouseMoveBinding)
    }

    private calculateNewLimits(): void {
        if (!this.draggingItem)
            throw new Error("No dragging item on limit calculation")

        this.draggingLimits = []

        const currentIndex = this.draggingItem.index + this.draggingIndexOffset
        const previousElement = this.elements[currentIndex - 1]
        const nextElement = this.elements[currentIndex + 1]

        if (nextElement)
            switch (this.listType) {
                case ListType.Horizontal:
                    this.draggingLimits.push(
                        this.limitFromElement(Direction.Right, nextElement),
                    )
                    break
                case ListType.Vertical:
                    this.draggingLimits.push(
                        this.limitFromElement(Direction.Down, nextElement),
                    )
                    break
                default:
                    // TODO: grid list styles
                    break
            }

        if (previousElement)
            switch (this.listType) {
                case ListType.Horizontal:
                    this.draggingLimits.push(
                        this.limitFromElement(Direction.Left, previousElement),
                    )
                    break
                case ListType.Vertical:
                    this.draggingLimits.push(
                        this.limitFromElement(Direction.Up, previousElement),
                    )
                    break
                default:
                    // TODO: grid list styles
                    break
            }
    }

    private findNewDraggingIndex(pos: Position): number {
        if (!this.draggingItem)
            throw new Error("No dragging item on find new index")

        // NOTE: If no new index is found, the old one is returned
        // TODO: Implement this for vertical/grid lists
        let result = 0

        for (let i = 0; i < this.elements.length; i++) {
            const it = this.elements[i]

            switch (this.listType) {
                case ListType.Horizontal: {
                    const x1 = it.marginBounds.left
                    const x2 = it.marginBounds.left + it.marginBounds.width

                    if (pos.x >= x1 && pos.x <= x2) {
                        // Found element!
                        const draggingIndex = this.draggingItem.index
                        result = it.index - draggingIndex
                        break
                    }
                    break
                }
                case ListType.Vertical: {
                    const y1 = it.marginBounds.top
                    const y2 = it.marginBounds.top + it.marginBounds.height

                    if (pos.y >= y1 && pos.y <= y2) {
                        // Found element!
                        const draggingIndex = this.draggingItem.index
                        result = it.index - draggingIndex
                        break
                    }
                    break
                }
                default:
                    // TODO: grid list styles
                    break
            }
        }

        return result
    }

    private resetElements(): void {
        this.elements
            .filter(it => it != this.draggingItem)
            .forEach(it => it.resetDisplacement())
    }

    private isInSortableBounds(pos: Position): boolean {
        const x1 = this.bounds.left
        const x2 = this.bounds.left + this.bounds.width

        const y1 = this.bounds.top
        const y2 = this.bounds.top + this.bounds.height

        return pos.x >= x1 && pos.x <= x2 && (pos.y >= y1 && pos.y <= y2)
    }

    private isLimitExceeded(limit: Limit, pos: Position): boolean {
        if (!this.draggingItem)
            throw new Error("No dragging item on is limit exceeded")

        switch (limit.direction) {
            case Direction.Up:
                return pos.y < limit.offset
            case Direction.Down:
                return pos.y > limit.offset
            case Direction.Left:
                return pos.x < limit.offset
            case Direction.Right:
                return pos.x > limit.offset
        }

        return false
    }

    private limitFromElement(
        direction: Direction,
        element: DraggableItem,
    ): Limit {
        const { marginBounds } = element
        switch (direction) {
            case Direction.Up:
                return {
                    direction,
                    offset: marginBounds.top + marginBounds.height,
                }
            case Direction.Down:
                return {
                    direction,
                    offset: marginBounds.top,
                }
            case Direction.Left:
                return {
                    direction,
                    offset: marginBounds.left + marginBounds.width,
                }
            case Direction.Right:
                return {
                    direction,
                    offset: marginBounds.left,
                }
            case Direction.None:
                throw new Error("Cant get limit with no direction")
        }
    }

    private bindEvent(ev: WindowEvent, fn: (ev: MouseEvent) => void): void {
        window.addEventListener(ev, fn, { capture: true })
    }

    private unbindEvent(ev: WindowEvent, fn: (ev: MouseEvent) => void): void {
        window.removeEventListener(ev, fn, { capture: true })
    }
}
