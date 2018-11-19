import {
    Position,
    Direction,
    Bounds,
    emptyPosition,
    emptyBounds,
} from "../types"
import { isInBounds } from "../util"
import {
    Scrollable,
    ScrollArea,
    isScrollable,
    elementScrollAreaSize,
} from "./scrollable"

export class ScrollableElement implements Scrollable {
    originalOffset: Position
    clientBounds: Bounds
    styles: CSSStyleDeclaration

    // This is the offset since the drag started
    offsetDelta: Position = emptyPosition()

    // These are empty on init and calculated every time that scroll
    // areas are redone
    visibleBounds: Bounds = emptyBounds()
    scrollAreas: Array<ScrollArea> = []

    scrolling = emptyPosition()

    constructor(public element: HTMLElement) {
        this.styles = window.getComputedStyle(this.element)
        const bounds = this.element.getBoundingClientRect()

        this.clientBounds = {
            top: bounds.top,
            left: bounds.left,
            width: this.element.clientWidth,
            height: this.element.clientHeight,
        }

        this.originalOffset = {
            x: this.element.scrollLeft,
            y: this.element.scrollTop,
        }
    }

    updateScrolling(position: Position): void {
        this.scrolling = emptyPosition()

        if (
            this.scrollAreas.length === 0 ||
            !isInBounds(position, this.visibleBounds) ||
            !this.scrollAreas.some(it => it.canScroll)
        )
            return

        this.scrollAreas
            .filter(it => it.canScroll && isInBounds(position, it.bounds))
            .forEach(it => {
                switch (it.direction) {
                    case Direction.Up:
                        this.scrolling.y -= 10
                        break
                    case Direction.Down:
                        this.scrolling.y += 10
                        break
                    case Direction.Left:
                        this.scrolling.x -= 10
                        break
                    case Direction.Right:
                        this.scrolling.x += 10
                        break
                }
            })
    }

    shouldScroll(): boolean {
        return this.scrolling.x !== 0 || this.scrolling.y !== 0
    }

    doScroll(): void {
        this.element.scrollLeft += this.scrolling.x
        this.element.scrollTop += this.scrolling.y

        this.scrollAreas.forEach(it => {
            it.canScroll = this.canScrollInDirection(it.direction)
        })
    }

    getTarget(): HTMLElement | Document {
        return this.element
    }

    updateOffsetDelta(): void {
        this.offsetDelta = {
            x: this.element.scrollLeft - this.originalOffset.x,
            y: this.element.scrollTop - this.originalOffset.y,
        }
    }

    findScrollAreas(): void {
        this.scrolling = emptyPosition()
        this.scrollAreas = []

        if (isScrollable(this.styles.overflowY)) {
            this.findScrollAreaForDirection(Direction.Up)
            this.findScrollAreaForDirection(Direction.Down)
        }

        if (isScrollable(this.styles.overflowX)) {
            this.findScrollAreaForDirection(Direction.Left)
            this.findScrollAreaForDirection(Direction.Right)
        }
    }

    // Returns a copy of the new bounds for this parent
    clipToBounds(outerBounds: Bounds, offset: Position): Bounds {
        const top = Math.max(this.clientBounds.top - offset.y, outerBounds.top)
        const left = Math.max(
            this.clientBounds.left - offset.x,
            outerBounds.left,
        )
        const bottom = Math.min(
            this.clientBounds.top + this.clientBounds.height - offset.y,
            outerBounds.top + outerBounds.height,
        )
        const right = Math.min(
            this.clientBounds.left + this.clientBounds.width - offset.x,
            outerBounds.left + outerBounds.width,
        )

        this.visibleBounds = {
            top,
            left,
            width: right - left,
            height: bottom - top,
        }

        return { ...this.visibleBounds }
    }

    private findScrollAreaForDirection(direction: Direction): void {
        const canScroll = this.canScrollInDirection(direction)

        switch (direction) {
            case Direction.Up:
                this.scrollAreas.push({
                    bounds: {
                        top: this.visibleBounds.top,
                        left: this.visibleBounds.left,
                        width: this.visibleBounds.width,
                        height:
                            this.visibleBounds.height * elementScrollAreaSize,
                    },
                    canScroll,
                    direction,
                })
                break
            case Direction.Down:
                this.scrollAreas.push({
                    bounds: {
                        top:
                            this.visibleBounds.top +
                            this.visibleBounds.height -
                            this.visibleBounds.height * elementScrollAreaSize,
                        left: this.visibleBounds.left,
                        width: this.visibleBounds.width,
                        height:
                            this.visibleBounds.height * elementScrollAreaSize,
                    },
                    canScroll,
                    direction,
                })
                break
            case Direction.Left:
                this.scrollAreas.push({
                    bounds: {
                        top: this.visibleBounds.top,
                        left: this.visibleBounds.left,
                        width: this.visibleBounds.width * elementScrollAreaSize,
                        height: this.visibleBounds.height,
                    },
                    canScroll,
                    direction,
                })
                break
            case Direction.Right:
                this.scrollAreas.push({
                    bounds: {
                        top: this.visibleBounds.top,
                        left:
                            this.visibleBounds.left +
                            this.visibleBounds.width -
                            this.visibleBounds.width * elementScrollAreaSize,
                        width: this.clientBounds.width * elementScrollAreaSize,
                        height: this.visibleBounds.height,
                    },
                    canScroll,
                    direction,
                })
                break
        }
    }

    private canScrollInDirection(direction: Direction): boolean {
        // TODO: Figure out why the Down and Right formula doesn't always work
        // without a small offset
        switch (direction) {
            case Direction.Up:
                return this.element.scrollTop > 0
            case Direction.Down:
                return (
                    this.element.scrollTop + 15 <=
                        this.element.scrollHeight - this.element.clientHeight &&
                    this.element.scrollHeight >= this.element.clientHeight
                )
            case Direction.Left:
                return this.element.scrollLeft > 0
            case Direction.Right:
                return (
                    this.element.scrollLeft + 15 <=
                        this.element.scrollWidth - this.element.clientWidth &&
                    this.element.scrollWidth >= this.element.clientWidth
                )
            default:
                return false
        }
    }
}
