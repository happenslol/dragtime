import { Scrollable, ScrollArea, windowScrollAreaSize } from "./scrollable"
import { emptyPosition, Bounds, Direction, Position } from "./types"
import { isInBounds } from "./util"

export class ScrollableWindow implements Scrollable {
    originalOffset: Position
    offsetDelta: Position

    scrolling = emptyPosition()
    scrollAreas: Array<ScrollArea> = []

    visibleBounds: Bounds

    constructor() {
        this.offsetDelta = emptyPosition()
        this.originalOffset = {
            x: window.pageXOffset,
            y: window.pageYOffset,
        }

        this.visibleBounds = {
            top: 0,
            left: 0,
            height: window.innerHeight,
            width: window.innerWidth,
        }
    }

    findScrollAreas(): void {
        const documentScrollDimensions = this.getDocumentScrollDimensions()

        this.scrollAreas = [
            {
                bounds: {
                    top: 0,
                    left: 0,
                    width: this.visibleBounds.width,
                    height: this.visibleBounds.height * windowScrollAreaSize,
                },
                canScroll: window.pageYOffset > 0,
                direction: Direction.Up,
            },
            {
                bounds: {
                    top:
                        this.visibleBounds.height -
                        this.visibleBounds.height * windowScrollAreaSize,
                    left: 0,
                    width: this.visibleBounds.width,
                    height: this.visibleBounds.height * windowScrollAreaSize,
                },
                canScroll:
                    document.documentElement!.scrollTop + window.innerHeight <
                    documentScrollDimensions.y,
                direction: Direction.Down,
            },
            {
                bounds: {
                    top: 0,
                    left: 0,
                    width: this.visibleBounds.width * windowScrollAreaSize,
                    height: this.visibleBounds.height,
                },
                canScroll: window.pageXOffset > 0,
                direction: Direction.Left,
            },
            {
                bounds: {
                    top: 0,
                    left:
                        this.visibleBounds.width -
                        this.visibleBounds.width * windowScrollAreaSize,
                    width: this.visibleBounds.width * windowScrollAreaSize,
                    height: this.visibleBounds.height,
                },
                canScroll:
                    document.documentElement!.scrollLeft + window.innerWidth <
                    documentScrollDimensions.x,
                direction: Direction.Right,
            },
        ]
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

    updateOffsetDelta(): void {
        this.offsetDelta = {
            x: window.pageXOffset - this.originalOffset.x,
            y: window.pageYOffset - this.originalOffset.y,
        }
    }

    clipToBounds(_outerBounds: Bounds, _offset: Position): Bounds {
        // The window is always the outer bound, so we return
        // our bounds regardless of what was passed in
        return this.visibleBounds
    }

    shouldScroll(): boolean {
        return this.scrolling.x !== 0 || this.scrolling.y !== 0
    }

    doScroll(): void {
        window.scrollBy(this.scrolling.x, this.scrolling.y)
    }

    getTarget(): HTMLElement | Document {
        return document
    }

    private getDocumentScrollDimensions(): Position {
        const height = Math.max(
            document.body.scrollHeight,
            document.documentElement!.scrollHeight,
            document.body.offsetHeight,
            document.documentElement!.offsetHeight,
            document.body.clientHeight,
            document.documentElement!.clientHeight,
        )

        const width = Math.max(
            document.body.scrollWidth,
            document.documentElement!.scrollWidth,
            document.body.offsetWidth,
            document.documentElement!.offsetWidth,
            document.body.clientWidth,
            document.documentElement!.clientWidth,
        )

        return { x: width, y: height }
    }
}
