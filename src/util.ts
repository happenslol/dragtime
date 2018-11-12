import {
    Position,
    Direction,
    Bounds,
    emptyPosition,
    emptyBounds,
} from "./types"

export interface ScrollableParent {
    element: HTMLElement
    originalOffset: Position
    offsetDelta: Position
    scrollAreas: Array<ScrollArea>
    clientBounds: Bounds
    visibleBounds: Bounds
}

export interface ScrollArea {
    direction: Direction
    bounds: Bounds
    canScroll: boolean
}

export const noop = () => {}

const scrollAtPercent = 10 / 100

const isScrollable = (...values: Array<string | null>) =>
    values.some(it => it === "auto" || it === "scroll")

interface IsScrollableWithStyle {
    isScrollable: boolean
    styles: CSSStyleDeclaration
}

const isElementScrollable: (element: HTMLElement) => IsScrollableWithStyle = (
    element: HTMLElement,
) => {
    const styles = window.getComputedStyle(element)

    return {
        isScrollable: isScrollable(
            styles.overflow,
            styles.overflowX,
            styles.overflowY,
        ),
        styles,
    }
}

export const isInBounds: (point: Position, bounds: Bounds) => boolean = (
    point,
    bounds,
) =>
    point.x >= bounds.left &&
    point.x <= bounds.left + bounds.width &&
    point.y >= bounds.top &&
    point.y <= bounds.top + bounds.height

export function getClosestScrollable(
    element: HTMLElement | null,
): ScrollableParent | null {
    if (element === null) return null

    const found = findScrollable(element)
    if (found === null) return null

    const bounds = found.element.getBoundingClientRect()
    const clientBounds = {
        top: bounds.top,
        left: bounds.left,
        width: element.clientWidth,
        height: element.clientHeight,
    }

    return {
        element: found.element,
        originalOffset: {
            x: found.element.scrollLeft,
            y: found.element.scrollTop,
        },
        offsetDelta: emptyPosition(),
        clientBounds,

        // These will be calculated when we find the scroll areas
        visibleBounds: emptyBounds(),
        scrollAreas: [],
    }
}

function elementCanScroll(element: HTMLElement, direction: Direction): boolean {
    switch (direction) {
        case Direction.Up:
            return element.scrollTop > 0
        case Direction.Down:
            return (
                element.scrollTop <
                    element.scrollHeight - element.clientHeight &&
                element.scrollHeight > element.clientHeight
            )
        case Direction.Left:
            return element.scrollLeft > 0
        case Direction.Right:
            return (
                element.scrollLeft <
                    element.scrollWidth - element.clientWidth &&
                element.scrollWidth > element.clientWidth
            )
        default:
            return false
    }
}

function findScrollAreaForElement(
    offset: Position,
    element: HTMLElement,
    visibleBounds: Bounds,
    clientBounds: Bounds,
    direction: Direction,
): ScrollArea {
    const canScroll = elementCanScroll(element, direction)

    // TODO: Remove this
    const top = visibleBounds.top - offset.y
    const bottom = visibleBounds.top + visibleBounds.height - offset.y
    const left = visibleBounds.left - offset.x
    const right = visibleBounds.left + visibleBounds.width - offset.x

    switch (direction) {
        case Direction.Up:
            return {
                bounds: {
                    top,
                    left,
                    width: right - left,
                    height: clientBounds.height * scrollAtPercent,
                },
                canScroll,
                direction,
            }
        case Direction.Down:
            return {
                bounds: {
                    top: bottom - clientBounds.height * scrollAtPercent,
                    left,
                    width: right - left,
                    height: clientBounds.height * scrollAtPercent,
                },
                canScroll,
                direction,
            }
        case Direction.Left:
            return {
                bounds: {
                    top,
                    left,
                    width: clientBounds.width * scrollAtPercent,
                    height: bottom - top,
                },
                canScroll,
                direction,
            }
        case Direction.Right:
            return {
                bounds: {
                    top,
                    left: right - clientBounds.width * scrollAtPercent,
                    width: clientBounds.width * scrollAtPercent,
                    height: bottom - top,
                },
                canScroll,
                direction,
            }
    }

    throw new Error("invalid code path")
}

export function findScrollAreas(
    offset: Position,
    visibleBounds: Bounds,
    clientBounds: Bounds,
    element: HTMLElement,
): Array<ScrollArea> {
    let result: Array<ScrollArea> = []

    // TODO: This shouldn't happen everytime, need to buffer it somewhere
    // since we only use it to find out which directions the element is
    // scrollable in
    const styles = window.getComputedStyle(element)

    if (isScrollable(styles.overflowY)) {
        result.push(
            findScrollAreaForElement(
                offset,
                element,
                visibleBounds,
                clientBounds,
                Direction.Up,
            ),
        )
        result.push(
            findScrollAreaForElement(
                offset,
                element,
                visibleBounds,
                clientBounds,
                Direction.Down,
            ),
        )
    }

    if (isScrollable(styles.overflowX)) {
        result.push(
            findScrollAreaForElement(
                offset,
                element,
                visibleBounds,
                clientBounds,
                Direction.Left,
            ),
        )
        result.push(
            findScrollAreaForElement(
                offset,
                element,
                visibleBounds,
                clientBounds,
                Direction.Right,
            ),
        )
    }

    return result
}

interface FindScrollableResult {
    element: HTMLElement
    styles: CSSStyleDeclaration
}

function findScrollable(
    element: HTMLElement | null,
): FindScrollableResult | null {
    if (element === null) return null

    const result = isElementScrollable(element)
    if (!result.isScrollable) return findScrollable(element.parentElement)

    return {
        element,
        styles: result.styles,
    }
}
