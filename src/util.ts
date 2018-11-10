export const noop = () => {}

const isScrollable = (...values: Array<string | null>) =>
    values.some(it => it === "auto" || it === "scroll")

const isElementScrollable = (element: HTMLElement) => {
    const style = window.getComputedStyle(element)
    return isScrollable(style.overflow, style.overflowX, style.overflowY)
}

export const getClosestScrollable: (
    element: HTMLElement | null,
) => HTMLElement | null = element => {
    if (element === null) return null

    if (!isElementScrollable(element))
        return getClosestScrollable(element.parentElement)

    return element
}
