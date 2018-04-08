import {
    DtimeClass,
    ZIndex,
    Position,
    Size,
    Margins,
    Bounds,
    Displacement,
    Direction,

    emptyBounds,
    emptyMargins,
    emptyPosition,
    emptyDisplacement,
    DisplacementDirection,
} from './types'

export enum DraggableState {
    Idle,
    Dragging,
    Dropping,
}

export interface DraggableStyle {
    position: string
    boxSizing: string
    zIndex: number
    width: number
    height: number
    top: number
    left: number
    margin: number
    pointerEvents: string
    transition: string
    transform: string
}

export interface DisplacementStyle {
    transform: string
}

export class DraggableItem {
    state: DraggableState = DraggableState.Idle

    margins: Margins = emptyMargins()
    bounds: Bounds = emptyBounds()
    marginBounds: Bounds = emptyBounds()
    center: Position = emptyPosition()

    displacement: Displacement = emptyDisplacement()

    constructor(
        public ref: HTMLElement,
        public index: number,

        onMouseDown: (
            item: DraggableItem,
            ev: MouseEvent,
        ) => void,
    ) {
        this.ref.classList.add(DtimeClass.Handle)
        this.ref.addEventListener(
            'mousedown',
            (ev: MouseEvent) => onMouseDown(this, ev),
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
            x: left + (width / 2),
            y: top + (height / 2),
        }

        this.marginBounds = {
            top: top - this.margins.top,
            left: left - this.margins.left,
            width: this.bounds.width + this.margins.left + this.margins.right,
            height: this.bounds.height + this.margins.top + this.margins.bottom,
        }
    }

    setPosition(pos: Position): void {
        this.setStyle(this.getDraggingStyle(pos))
    }

    removeStyle(): void {
        requestAnimationFrame(() => {
            this.ref.removeAttribute('style')
        })
    }

    setDisplacement(displacement: Displacement): void {
        if (this.state !== DraggableState.Idle) {
            // TODO: Handle this in sortable
            // console.error("Tried to set displacement on element not in idle")
            return
        }

        if (
            this.displacement.direction === displacement.direction &&
            this.displacement.offset === displacement.offset
        ) return

        this.displacement = displacement

        if (displacement.direction === DisplacementDirection.None) {
            this.removeStyle()
            return
        }

        this.setStyle(this.getDisplacementStyle(this.displacement))
    }

    resetDisplacement(): void {
        this.ref.removeAttribute("style")
        this.displacement = emptyDisplacement()
    }

    private setStyle(style: DraggableStyle | DisplacementStyle): void {
        Object.assign(this.ref.style, style)
    }

    private getDraggingStyle(pos: Position = { x: 0, y: 0 }): DraggableStyle {
        const result: DraggableStyle = {
            position: 'fixed',
            boxSizing: 'border-box',
            zIndex: ZIndex.Dragging,
            width: 100,
            height: 100,
            top: pos.y,
            left: pos.x,
            margin: 0,
            pointerEvents: 'none',
            transition: 'none',
            transform: '',
        }

        return result
    }

    private getDisplacementStyle({ direction, offset }: Displacement): DisplacementStyle {
        // TODO: Implement this for vertical/grid lists
        const offsetString = direction === DisplacementDirection.Forward
            ? `${offset}`
            : `-${offset}`

        const result: DisplacementStyle = {
            transform: `translateX(${offsetString}px)`,
        }

        return result
    }
}
