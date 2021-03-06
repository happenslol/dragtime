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
import { generateId } from "./util"

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

    originalStyle: string

    displacement: Displacement = emptyDisplacement()

    constructor(
        public ref: HTMLElement,
        public index: number,
        public listType: ListType,
        private parentId: string,
        onMouseDown: (item: DraggableItem, ev: MouseEvent) => void,
    ) {
        this.originalIndex = index

        this.id = this.ref.getAttribute("data-dt-id") || generateId()

        let handle: HTMLElement
        const handleCandidates = this.ref.querySelectorAll("*[data-dt-handle]")

        if (handleCandidates.length > 0)
            handle = <HTMLElement>handleCandidates[0]
        else handle = this.ref

        handle.setAttribute("style", styles.handle)
        handle.setAttribute("data-dt-is-handle", `${this.parentId}-${this.id}`)
        handle.addEventListener("mousedown", (ev: MouseEvent) =>
            onMouseDown(this, ev),
        )

        this.originalStyle = this.ref.getAttribute("style") || ""

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
            [this.originalStyle, styles.steppingAside].join(""),
        )
    }

    setPosition(pos: Position): void {
        this.setDraggingStyle(pos)
    }

    removeStyle(): void {
        this.ref.setAttribute("style", this.originalStyle)
    }

    removeStyleAndDisplacement(): void {
        this.displacement = emptyDisplacement()
        this.ref.setAttribute("style", this.originalStyle)
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
            [this.originalStyle, styles.steppingAside].join(""),
        )
        this.displacement = emptyDisplacement()
    }

    private setDraggingStyle(pos: Position = { x: 0, y: 0 }): void {
        this.ref.setAttribute(
            "style",
            [
                this.originalStyle,
                `
                    position: fixed;
                    box-sizing: border-box;
                    z-index: ${ZIndex.Dragging};
                    width: ${this.bounds.width}px;
                    height: ${this.bounds.height}px;
                    top: ${pos.y}px;
                    left: ${pos.x}px;
                    margin: 0;
                    pointer-events: none;
                    transition: none;
                    cursor: grabbing!important;
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
                        this.originalStyle,
                        styles.steppingAside,
                        `transform: translateX(${offsetString}px);`,
                    ].join("\n"),
                )
                break
            case ListType.Vertical:
                this.ref.setAttribute(
                    "style",
                    [
                        this.originalStyle,
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
