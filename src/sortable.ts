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
    emptyPosition,
} from "./types"

import { Animation } from "./animate"
import {
    getClosestScrollable,
    ScrollableParent,
    isInBounds,
    findScrollAreas,
    ScrollArea,
} from "./util"

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

interface ScrollParentToScroll {
    parent: ScrollableParent
    direction: Direction
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
    private padding: Margins = emptyMargins()
    private wasOutOfBounds: boolean = false

    private currentMousePos = emptyPosition()

    private windowScroll = emptyPosition()
    private originalWindowScroll = emptyPosition()
    private windowScrollAreas: Array<ScrollArea> = []
    private windowDirectionToScroll?: Direction

    private scrollParents: Array<ScrollableParent> = []
    private parentsToScroll: Array<ScrollParentToScroll> = []
    private autoScrollTimer?: number
    private doScrollBinding = this.doScroll.bind(this)

    private listType: ListType

    onMouseDownBinding = this.onMouseDown.bind(this)
    onMouseUpBinding = this.onMouseUp.bind(this)
    onMouseMoveBinding = this.onMouseMove.bind(this)
    onScrollBinding = (ev: UIEvent) => {
        // Target here will be either HTMLDocument or HTMLElement,
        // but we can't cast it as such correctly (or can we?)
        if (ev.target) this.onScroll(ev.target as any)
    }

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
            right: parseInt(style.marginRight || "0", 10),
        }

        this.padding = {
            top: parseInt(style.paddingTop || "0", 10),
            bottom: parseInt(style.paddingBottom || "0", 10),
            left: parseInt(style.paddingLeft || "0", 10),
            right: parseInt(style.paddingRight || "0", 10),
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

        this.currentMousePos = pos

        // reset all scroll offsets
        let nextParent = this.ref.parentElement
        while (nextParent) {
            const next = getClosestScrollable(nextParent)

            if (next) {
                this.scrollParents.push(next)
                nextParent = next.element.parentElement
            } else break
        }

        this.calculateScrollAreas()

        this.originalWindowScroll = {
            x: window.pageXOffset,
            y: window.pageYOffset,
        }

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

    private calculateScrollAreas(): void {
        const visibleBounds: Bounds = {
            top: window.pageYOffset,
            left: window.pageXOffset,
            height: window.innerHeight,
            width: window.innerWidth,
        }

        // TODO: These should only be calced once on startDragging,
        // after that we only need to update their canScroll value
        this.windowScrollAreas = []
        this.windowScrollAreas.push(
            {
                bounds: {
                    top: 0,
                    left: 0,
                    width: visibleBounds.width,
                    height: visibleBounds.height * 0.1,
                },
                canScroll: window.pageYOffset > 0,
                direction: Direction.Up,
            },
            {
                bounds: {
                    top: visibleBounds.height - visibleBounds.height * 0.1,
                    left: 0,
                    width: visibleBounds.width,
                    height: visibleBounds.height * 0.1,
                },
                // TODO
                canScroll: true,
                direction: Direction.Down,
            },
            {
                bounds: {
                    top: 0,
                    left: 0,
                    width: visibleBounds.width * 0.1,
                    height: visibleBounds.height,
                },
                canScroll: window.pageXOffset > 0,
                direction: Direction.Left,
            },
            {
                bounds: {
                    top: 0,
                    left: visibleBounds.width - visibleBounds.width * 0.1,
                    width: visibleBounds.width * 0.1,
                    height: visibleBounds.height,
                },
                // TODO
                canScroll: true,
                direction: Direction.Right,
            },
        )

        const offset: Position = { ...this.windowScroll }

        // DEBUG
        // Array.from(document.getElementsByClassName("test-el")).forEach(it =>
        //     it.remove(),
        // )
        // /DEBUG

        // DEBUG
        // this.windowScrollAreas.forEach(it => {
        //     const el = document.createElement("div")
        //     el.classList.add("test-el")
        //     el.style.position = "fixed"
        //     el.style.backgroundColor = "#F00"
        //     el.style.opacity = "0.3"

        //     el.style.width = `${it.bounds.width}px`
        //     el.style.height = `${it.bounds.height}px`
        //     el.style.left = `${it.bounds.left}px`
        //     el.style.top = `${it.bounds.top}px`

        //     document.body.appendChild(el)
        // })
        // /DEBUG

        // Go through the scroll parents in reverse order, so we can pass
        // down the visible bounds
        for (let i = this.scrollParents.length - 1; i >= 0; i--) {
            const it = this.scrollParents[i]

            const bottom = Math.min(
                it.clientBounds.top + it.clientBounds.height,
                visibleBounds.top + visibleBounds.height,
            )

            const right = Math.min(
                it.clientBounds.left + it.clientBounds.width,
                visibleBounds.left + visibleBounds.width,
            )

            // Set the visible bounds for this element first thing,
            // so that the scroll areas won't ever exceed these
            visibleBounds.top = Math.max(it.clientBounds.top, visibleBounds.top)
            visibleBounds.left = Math.max(
                it.clientBounds.left,
                visibleBounds.left,
            )

            visibleBounds.width = right - visibleBounds.left
            visibleBounds.height = bottom - visibleBounds.top

            it.visibleBounds = { ...visibleBounds }
            it.scrollAreas = findScrollAreas(
                offset,
                it.visibleBounds,
                it.clientBounds,
                it.element,
            )
        }
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

        this.currentMousePos = emptyPosition()

        this.windowScroll = emptyPosition()
        this.originalWindowScroll = emptyPosition()
        this.windowScrollAreas = []
        this.windowDirectionToScroll = undefined

        this.scrollParents = []
        this.parentsToScroll = []

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

    private continueDragging(): void {
        if (!this.draggingItem)
            throw new Error("No dragging item on continue dragging")

        const itemPos: Position = {
            x: this.currentMousePos.x - this.clickOffset.x,
            y: this.currentMousePos.y - this.clickOffset.y,
        }

        this.draggingItem.setPosition(itemPos)

        const itemCenter: Position = {
            x: itemPos.x + this.draggingItem.bounds.width / 2,
            y: itemPos.y + this.draggingItem.bounds.height / 2,
        }

        const scrollParentOffset: Position = { x: 0, y: 0 }
        this.scrollParents.forEach(it => {
            scrollParentOffset.x += it.offsetDelta.x
            scrollParentOffset.y += it.offsetDelta.y
        })

        const absItemCenter: Position = {
            x: itemCenter.x + this.windowScroll.x + scrollParentOffset.x,
            y: itemCenter.y + this.windowScroll.y + scrollParentOffset.y,
        }

        let newOffset = 0

        // edge scroll detection
        const scrollParentsToCheck: Array<ScrollableParent> = []
        // TODO: Do we use the item center or the mouse pos here?
        // Maybe provide an option for the user to choose?
        for (let i = 0; i < this.scrollParents.length; i++) {
            const it = this.scrollParents[i]

            // if there are no scroll areas or none of them can scroll,
            // we can skip this
            if (
                it.scrollAreas.length === 0 ||
                !it.scrollAreas.some(it => it.canScroll)
            )
                continue

            // check if we are moving in the parent
            if (isInBounds(this.currentMousePos, it.visibleBounds))
                scrollParentsToCheck.push(it)
        }

        // TODO: Does this cause a lot of garbage collection? Might have
        // to do something about it if it does
        this.parentsToScroll = []
        for (let i = 0; i < scrollParentsToCheck.length; i++) {
            const it = scrollParentsToCheck[i]
            const areas = it.scrollAreas.filter(
                area =>
                    area.canScroll &&
                    isInBounds(this.currentMousePos, area.bounds),
            )

            if (areas.length > 0)
                areas.forEach(area =>
                    this.parentsToScroll.push({
                        parent: it,
                        direction: area.direction,
                    }),
                )
        }

        const foundWindowDirection = this.windowScrollAreas.find(
            it => it.canScroll && isInBounds(this.currentMousePos, it.bounds),
        )

        if (foundWindowDirection)
            this.windowDirectionToScroll = foundWindowDirection.direction
        else this.windowDirectionToScroll = undefined

        // Check if we need to start the autoscroll timer
        if (
            !this.autoScrollTimer &&
            (this.parentsToScroll.length > 0 ||
                this.windowDirectionToScroll !== undefined)
        )
            this.autoScrollTimer = requestAnimationFrame(this.doScrollBinding)

        if (!this.isInSortableBounds(itemCenter)) {
            if (!this.wasOutOfBounds) {
                // Left bounds
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

        // If we were out of bounds before, we need to recalculate
        // our limits
        if (this.wasOutOfBounds) {
            requestAnimationFrame(() => {
                // NOTE: Entered bounds
                this.wasOutOfBounds = false

                newOffset = this.findNewDraggingIndex(absItemCenter)

                this.draggingIndexOffset = newOffset
                this.calculateNewLimits()
                this.displaceItems(0, newOffset)
            })

            return
        }

        this.draggingLimits.forEach(it => {
            if (this.isLimitExceeded(it, absItemCenter)) {
                newOffset = this.findNewDraggingIndex(absItemCenter)
                const oldOffset = this.draggingIndexOffset

                this.draggingIndexOffset = newOffset
                this.calculateNewLimits()
                this.displaceItems(oldOffset, newOffset)
            }
        })
    }

    private scrollElement(direction: Direction, element: HTMLElement): void {
        switch (direction) {
            case Direction.Up:
                element.scrollTop -= 10
                break

            case Direction.Down:
                element.scrollTop += 10
                break

            case Direction.Left:
                element.scrollLeft -= 10
                break

            case Direction.Right:
                element.scrollLeft += 10
                break
        }

        this.onScroll(element)
    }

    private scrollWindow(direction: Direction): void {
        switch (direction) {
            case Direction.Up:
                window.scrollBy(0, -10)
                break

            case Direction.Down:
                window.scrollBy(0, 10)
                break

            case Direction.Left:
                window.scrollBy(-10, 0)
                break

            case Direction.Right:
                window.scrollBy(10, 0)
                break
        }

        this.onScroll(document)
    }

    private doScroll(): void {
        if (this.parentsToScroll.length !== 0) {
            const elementToScroll = this.parentsToScroll[0]
            this.scrollElement(
                elementToScroll.direction,
                elementToScroll.parent.element,
            )
            this.autoScrollTimer = requestAnimationFrame(this.doScrollBinding)
            return
        }

        if (this.windowDirectionToScroll !== undefined) {
            this.scrollWindow(this.windowDirectionToScroll)
            this.autoScrollTimer = requestAnimationFrame(this.doScrollBinding)
            return
        }

        this.autoScrollTimer = undefined
    }

    private displaceItems(_oldOffset: number, newOffset: number): void {
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
        this.currentMousePos = pos

        this.continueDragging()
    }

    onScroll(target: HTMLElement | Document): void {
        if (target instanceof HTMLDocument) {
            this.windowScroll = {
                x: window.pageXOffset - this.originalWindowScroll.x,
                y: window.pageYOffset - this.originalWindowScroll.y,
            }

            this.calculateScrollAreas()
            this.continueDragging()
        } else {
            const foundIndex = this.scrollParents.findIndex(
                it => it.element == target,
            )
            if (foundIndex !== -1) {
                const found = this.scrollParents[foundIndex]
                found.offsetDelta = {
                    x: found.element.scrollLeft - found.originalOffset.x,
                    y: found.element.scrollTop - found.originalOffset.y,
                }

                // If only the innermost element is scrolled, the scroll
                // areas do not change
                // if (foundIndex > 0)
                this.calculateScrollAreas()

                this.continueDragging()
            }
        }
    }

    private bindWindowEvents(): void {
        this.bindEvent("mousedown", this.onMouseDownBinding)
        this.bindEvent("mouseup", this.onMouseUpBinding)
        this.bindEvent("mousemove", this.onMouseMoveBinding)

        document.addEventListener("scroll", this.onScrollBinding, true)
    }

    private unbindWindowEvents(): void {
        this.unbindEvent("mousedown", this.onMouseDownBinding)
        this.unbindEvent("mouseup", this.onMouseUpBinding)
        this.unbindEvent("mousemove", this.onMouseMoveBinding)

        document.removeEventListener("scroll", this.onScrollBinding, true)
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
