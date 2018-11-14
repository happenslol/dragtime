import { Direction, ListType, Position } from "./types"
import { DraggableItem } from "./draggable-item"

export interface Limit {
    direction: Direction
    offset: number
}

export function getLimits(
    listType: ListType,
    next?: DraggableItem,
    previous?: DraggableItem,
): Array<Limit> {
    const result: Array<Limit> = []

    if (next)
        switch (listType) {
            case ListType.Horizontal:
                result.push(limitFromItem(Direction.Right, next))
                break
            case ListType.Vertical:
                result.push(limitFromItem(Direction.Down, next))
                break
            default:
                // TODO: grid list styles
                break
        }

    if (previous)
        switch (listType) {
            case ListType.Horizontal:
                result.push(limitFromItem(Direction.Left, previous))
                break
            case ListType.Vertical:
                result.push(limitFromItem(Direction.Up, previous))
                break
            default:
                // TODO: grid list styles
                break
        }

    return result
}

function limitFromItem(direction: Direction, item: DraggableItem): Limit {
    const { marginBounds } = item
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

export function isLimitExceeded(limit: Limit, pos: Position): boolean {
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
