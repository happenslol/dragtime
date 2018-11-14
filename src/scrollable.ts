import { Position, Direction, Bounds } from "./types"
import { ScrollableElement } from "./scrollable-element"

export const windowScrollAreaSize = 0.1
export const elementScrollAreaSize = 0.1

export const minWindowScrollSpeed = 5
export const maxWindowScrollSpeed = 20

export const minElementScrollSpeed = 5
export const maxElementScrollSpeed = 20

export interface Scrollable {
    findScrollAreas: () => void
    updateScrolling: (position: Position) => void
    updateOffsetDelta: () => void
    clipToBounds: (outerBounds: Bounds, offset: Position) => Bounds
    shouldScroll: () => boolean
    doScroll: () => void
    getTarget(): HTMLElement | Document

    offsetDelta: Position
    scrollAreas: Array<ScrollArea>
}

export function findNextScrollParent(
    element: HTMLElement | null,
): ScrollableElement | null {
    if (element === null) return null

    const found = findScrollable(element)
    if (found === null) return null

    return new ScrollableElement(found)
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

export function isScrollable(...values: Array<string | null>): boolean {
    return values.some(it => it === "auto" || it === "scroll")
}

export function isElementScrollable(element: HTMLElement): boolean {
    const styles = window.getComputedStyle(element)
    return isScrollable(styles.overflow, styles.overflowX, styles.overflowY)
}
