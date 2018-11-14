import { Position, emptyPosition } from "./types"
import { DraggableItem } from "./draggable-item"
import { Placeholder } from "./placeholder"

const threshold: number = 0.5

export class Animation {
    private scheduled: number = 0

    private targetPosition: Position = emptyPosition()
    private originalPosition: Position = emptyPosition()
    private originalOffset: Position = emptyPosition()

    private previous: number = 0
    private elapsed: number = 0

    onDone: () => void = () => {}

    constructor(
        private element: DraggableItem,
        private target: Placeholder,
        private duration: number = 300,
    ) {
        const { left: x, top: y } = this.target.ref.getBoundingClientRect()
        this.targetPosition = { x, y }

        const {
            left: originalX,
            top: originalY,
        } = this.element.ref.getBoundingClientRect()

        const distX = this.targetPosition.x - originalX
        const distY = this.targetPosition.y - originalY

        this.originalOffset = { x: distX, y: distY }
        this.originalPosition = { x: originalX, y: originalY }
    }

    run(onDone: () => void = () => {}) {
        this.onDone = onDone
        this.scheduled = requestAnimationFrame(this.tick.bind(this))
    }

    stop() {
        cancelAnimationFrame(this.scheduled)
        this.scheduled = 0
    }

    private tick(dt: number): void {
        if (this.previous > 0) this.elapsed += dt - this.previous

        this.previous = dt

        const fraction = this.elapsed / this.duration
        const progress = this.makeEaseOut(this.timing)(fraction)

        const nextPosition = emptyPosition()
        nextPosition.x =
            this.originalPosition.x + this.originalOffset.x * progress
        nextPosition.y =
            this.originalPosition.y + this.originalOffset.y * progress

        const reachedX =
            Math.abs(nextPosition.x - this.targetPosition.x) < threshold
        const reachedY =
            Math.abs(nextPosition.y - this.targetPosition.y) < threshold

        const newPosition = emptyPosition()
        newPosition.x = reachedX ? this.targetPosition.x : nextPosition.x
        newPosition.y = reachedY ? this.targetPosition.y : nextPosition.y

        if ((reachedX && reachedY) || this.elapsed > this.duration) {
            this.element.setPosition(this.targetPosition)
            this.onDone()
            return
        } else {
            this.element.setPosition(newPosition)
        }

        // schedule next frame
        this.scheduled = requestAnimationFrame(this.tick.bind(this))
    }

    private timing(fraction: number): number {
        return Math.pow(fraction, 5)
    }

    private makeEaseOut(
        timing: (fr: number) => number,
    ): (fr: number) => number {
        return (fr: number) => 1 - timing(1 - fr)
    }
}
