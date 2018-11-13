import {
    Position,
    Direction,
    Bounds,
    emptyPosition,
    emptyBounds,
} from "./types"

const windowScrollAreaSize = 0.1
const elementScrollAreaSize = 0.1

const minWindowScrollSpeed = 5
const maxWindowScrollSpeed = 20

const minElementScrollSpeed = 5
const maxElementScrollSpeed = 20

export function findNextScrollParent(
    element: HTMLElement | null,
): ScrollParent | null {
    if (element === null) return null

    const found = findScrollable(element)
    if (found === null) return null

    return new ScrollParent(found)
}

function findScrollable(element: HTMLElement | null): HTMLElement | null {
    if (element === null) return null

    if (!isElementScrollable(element))
        return findScrollable(element.parentElement)

    return element
}

export interface ScrollArea {
    direction: Direction
    bounds: Bounds
    canScroll: boolean
}

function isScrollable(...values: Array<string | null>): boolean {
    return values.some(it => it === "auto" || it === "scroll")
}

function isElementScrollable(element: HTMLElement): boolean {
    const styles = window.getComputedStyle(element)
    return isScrollable(styles.overflow, styles.overflowX, styles.overflowY)
}

export class ScrollParent {
    originalOffset: Position
    clientBounds: Bounds
    styles: CSSStyleDeclaration

    // This is the offset since the drag started
    offsetDelta: Position = emptyPosition()

    // These are empty on init and calculated every time that scroll
    // areas are redone
    visibleBounds: Bounds = emptyBounds()
    scrollAreas: Array<ScrollArea> = []

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

    findScrollAreas(offset: Position): void {
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
