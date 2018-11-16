import {
    ZIndex,
    Position,
    Margins,
    Bounds,
    Displacement,
    emptyBounds,
    emptyMargins,
    emptyPosition,
    emptyDisplacement,
    DisplacementDirection,
    ListType,
} from "./types"

import * as styles from "./styles"

export enum DraggableState {
    Idle,
    Dragging,
    Dropping,
}

export class DraggableItem {
    id: string
    originalIndex: number
    state: DraggableState = DraggableState.Idle

    margins: Margins = emptyMargins()
    bounds: Bounds = emptyBounds()
    marginBounds: Bounds = emptyBounds()
    center: Position = emptyPosition()

    displacement: Displacement = emptyDisplacement()

    constructor(
        public ref: HTMLElement,
        public index: number,
        public listType: ListType,
        onMouseDown: (item: DraggableItem, ev: MouseEvent) => void,
    ) {
        this.originalIndex = index

        this.id =
            this.ref.getAttribute("data-id") ||
            [...Array(10)]
                .map(_ => (~~(Math.random() * 36)).toString(36))
                .join("")

        this.ref.setAttribute("style", styles.handle)
        this.ref.addEventListener("mousedown", (ev: MouseEvent) =>
            onMouseDown(this, ev),
        )

        this.calculateDimensions()
    }

    calculateDimensions(): void {
        const style = window.getComputedStyle(this.ref)
        this.margins = {
            top: parseInt(style.marginTop || "0", 10),
            bottom: parseInt(style.marginBottom || "0", 10),
            left: parseInt(style.marginLeft || "0", 10),
            right: parseInt(style.marginRight || "0", 10) || 0,
        }

        const { top, left, width, height } = this.ref.getBoundingClientRect()
        this.bounds = { top, left, width, height }

        this.center = {
            x: left + width / 2,
            y: top + height / 2,
        }

        this.marginBounds = {
            top: top - this.margins.top,
            left: left - this.margins.left,
            width: this.bounds.width + this.margins.left + this.margins.right,
            height: this.bounds.height + this.margins.top + this.margins.bottom,
        }
    }

    setSteppingAsideStyle(): void {
        this.ref.setAttribute(
            "style",
            [styles.handle, styles.steppingAside].join(""),
        )
    }

    setPosition(pos: Position): void {
        this.setDraggingStyle(pos)
    }

    removeStyle(): void {
        this.ref.setAttribute("style", styles.handle)
    }

    removeStyleAndDisplacement(): void {
        this.displacement = emptyDisplacement()
        this.ref.setAttribute("style", styles.handle)
    }

    setDisplacement(displacement: Displacement): void {
        if (this.state !== DraggableState.Idle) return
        if (!this.displacementChanged(displacement)) return

        this.displacement = displacement
        this.setDisplacementStyle()
    }

    resetDisplacement(): void {
        this.ref.setAttribute(
            "style",
            [styles.handle, styles.steppingAside].join(""),
        )
        this.displacement = emptyDisplacement()
    }

    private setDraggingStyle(pos: Position = { x: 0, y: 0 }): void {
        this.ref.setAttribute(
            "style",
            [
                styles.handle,
                `
                    position: fixed;
                    boxSizing: border-box;
                    zIndex: ${ZIndex.Dragging};
                    width: ${this.bounds.width}px;
                    height: ${this.bounds.height}px;
                    top: ${pos.y}px;
                    left: ${pos.x}px;
                    margin: 0;
                    pointerEvents: none;
                    transition: none;
                `,
            ].join(""),
        )
    }

    private displacementChanged(displacement: Displacement): boolean {
        return (
            this.displacement.direction !== displacement.direction ||
            this.displacement.offset !== displacement.offset
        )
    }

    private setDisplacementStyle(): void {
        const { direction, offset } = this.displacement
        let offsetString = ""
        switch (direction) {
            case DisplacementDirection.Forward:
                offsetString = `${offset}`
                break
            case DisplacementDirection.Backward:
                offsetString = `-${offset}`
                break
            default:
                offsetString = "0"
        }

        switch (this.listType) {
            case ListType.Horizontal:
                this.ref.setAttribute(
                    "style",
                    [
                        styles.handle,
                        styles.steppingAside,
                        `transform: translateX(${offsetString}px);`,
                    ].join("\n"),
                )
                break
            case ListType.Vertical:
                this.ref.setAttribute(
                    "style",
                    [
                        styles.handle,
                        styles.steppingAside,
                        `transform: translateY(${offsetString}px);`,
                    ].join("\n"),
                )
                break
            // TODO: Grid list transforms
            case ListType.GridHorizontal:
            case ListType.GridVertical:
        }
    }
}
