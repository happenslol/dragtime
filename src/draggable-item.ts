import { DndClass, ZIndex, Position, Size } from './types'

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

export class DraggableItem {
    state: DraggableState = DraggableState.Idle
    originalPosition: Position
    originalSize: Size

    constructor(
        public ref: HTMLElement,
        public index: number,

        onMouseDown: (
            item: DraggableItem,
            ev: MouseEvent,
        ) => void,
    ) {
        this.ref.classList.add(DndClass.Handle)
        this.ref.addEventListener(
            'mousedown',
            (ev: MouseEvent) => onMouseDown(this, ev),
        )

        const { top: y, left: x, width, height } =
            this.ref.getBoundingClientRect()

        this.originalPosition = { x, y }
        this.originalSize = { width, height }
    }

    setPosition(pos: Position): void {
        this.setStyle(this.getDraggingStyle(pos))
    }

    removeStyle(): void {
        requestAnimationFrame(() => {
            this.ref.removeAttribute('style')
        })
    }

    private setStyle(style: DraggableStyle): void {
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
}
