import { isElementScrollable } from "./scrollable"
import { ScrollableElement } from "./scrollable-element"

export { Scrollable } from "./scrollable"
export { ScrollableElement } from "./scrollable-element"
export { ScrollableWindow } from "./scrollable-window"

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
