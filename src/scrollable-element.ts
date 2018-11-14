import {
    Position,
    Direction,
    Bounds,
    emptyPosition,
    emptyBounds,
} from "./types"
import { isInBounds } from "./util"
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

    findScrollAreas(offset: Position): void {
        this.scrolling = emptyPosition()
        this.scrollAreas = []

        if (isScrollable(this.styles.overflowY)) {
            this.findScrollAreaForDirection(offset, Direction.Up)
            this.findScrollAreaForDirection(offset, Direction.Down)
        }

        if (isScrollable(this.styles.overflowX)) {
            this.findScrollAreaForDirection(offset, Direction.Left)
            this.findScrollAreaForDirection(offset, Direction.Right)
        }
    }

    // Returns a copy of the new bounds for this parent
    clipToBounds(outerBounds: Bounds): Bounds {
        const bottom = Math.min(
            this.clientBounds.top + this.clientBounds.height,
            outerBounds.top + outerBounds.height,
        )

        const right = Math.min(
            this.clientBounds.left + this.clientBounds.width,
            outerBounds.left + outerBounds.width,
        )

        this.visibleBounds.top = Math.max(
            this.clientBounds.top,
            outerBounds.top,
        )
        this.visibleBounds.left = Math.max(
            this.clientBounds.left,
            outerBounds.left,
        )

        this.visibleBounds.width = right - this.visibleBounds.left
        this.visibleBounds.height = bottom - this.visibleBounds.top

        return { ...this.visibleBounds }
    }

    private findScrollAreaForDirection(
        offset: Position,
        direction: Direction,
    ): void {
        const canScroll = this.canScrollInDirection(direction)

        // TODO: Simplify these
        const top = this.visibleBounds.top - offset.y
        const bottom =
            this.visibleBounds.top + this.visibleBounds.height - offset.y
        const left = this.visibleBounds.left - offset.x
        const right =
            this.visibleBounds.left + this.visibleBounds.width - offset.x

        switch (direction) {
            case Direction.Up:
                this.scrollAreas.push({
                    bounds: {
                        top,
                        left,
                        width: right - left,
                        height:
                            this.clientBounds.height * elementScrollAreaSize,
                    },
                    canScroll,
                    direction,
                })
                break
            case Direction.Down:
                this.scrollAreas.push({
                    bounds: {
                        top:
                            bottom -
                            this.clientBounds.height * elementScrollAreaSize,
                        left,
                        width: right - left,
                        height:
                            this.clientBounds.height * elementScrollAreaSize,
                    },
                    canScroll,
                    direction,
                })
                break
            case Direction.Left:
                this.scrollAreas.push({
                    bounds: {
                        top,
                        left,
                        width: this.clientBounds.width * elementScrollAreaSize,
                        height: bottom - top,
                    },
                    canScroll,
                    direction,
                })
                break
            case Direction.Right:
                this.scrollAreas.push({
                    bounds: {
                        top,
                        left:
                            right -
                            this.clientBounds.width * elementScrollAreaSize,
                        width: this.clientBounds.width * elementScrollAreaSize,
                        height: bottom - top,
                    },
                    canScroll,
                    direction,
                })
                break
        }
    }

    private canScrollInDirection(direction: Direction): boolean {
        switch (direction) {
            case Direction.Up:
                return this.element.scrollTop > 0
            case Direction.Down:
                return (
                    this.element.scrollTop <
                        this.element.scrollHeight - this.element.clientHeight &&
                    this.element.scrollHeight > this.element.clientHeight
                )
            case Direction.Left:
                return this.element.scrollLeft > 0
            case Direction.Right:
                return (
                    this.element.scrollLeft <
                        this.element.scrollWidth - this.element.clientWidth &&
                    this.element.scrollWidth > this.element.clientWidth
                )
            default:
                return false
        }
    }
}
