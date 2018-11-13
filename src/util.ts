import { Position, Bounds } from "./types"

export function isInBounds(point: Position, bounds: Bounds): boolean {
    return (
        point.x >= bounds.left &&
        point.x <= bounds.left + bounds.width &&
        point.y >= bounds.top &&
        point.y <= bounds.top + bounds.height
    )
}
