import { Position, emptyPosition } from "./types"
import { DraggableItem } from "./draggable-item"
import { Placeholder } from "./placeholder"

export class Animation {
    private scheduled: number = 0

    private targetPosition: Position = emptyPosition()
    private currentPosition: Position = emptyPosition()

    constructor(
        private element: DraggableItem,
        private target: Placeholder,
        private onDone: () => void,
    ) {
        this.targetPosition = {
            x: this.target.ref.clientLeft,
            y: this.target.ref.clientTop,
        }
    }

    run() { requestAnimationFrame(this.tick.bind(this)) }

    stop() {}

    private tick(_dt: number): void {
        this.currentPosition = {
            x: this.element.ref.clientLeft,
            y: this.element.ref.clientTop,
        }

        const distX = this.targetPosition.x - this.currentPosition.x
        const distY = this.targetPosition.y - this.currentPosition.y

        console.log(`distance was ${distX}, ${distY}`)
        this.onDone()
        return

        // schedule next frame
        this.scheduled = requestAnimationFrame(this.tick)
    }
}
