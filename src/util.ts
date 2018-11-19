import { Position, Bounds } from "./types"
import { DraggableItem } from "./draggable-item"

export function isInBounds(point: Position, bounds: Bounds): boolean {
    return (
        point.x >= bounds.left &&
        point.x <= bounds.left + bounds.width &&
        point.y >= bounds.top &&
        point.y <= bounds.top + bounds.height
    )
}

export function sortByIndex(
    { index: a }: DraggableItem,
    { index: b }: DraggableItem,
): number {
    if (a > b) return 1
    if (a < b) return -1

    throw new Error("Found same index twice")
}

export function generateId(): string {
    return [...Array(10)]
        .map(_ => (~~(Math.random() * 36)).toString(36))
        .join("")
}
