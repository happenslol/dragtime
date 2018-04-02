import { DndClass, ZIndex, Position } from './types'

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
    private state: DraggableState = DraggableState.Idle

    originalPosition: Position

    constructor(
        private ref: HTMLElement,
        private position: number,

        private onMouseDown: (
            item: DraggableItem,
            ev: MouseEvent
        ) => void,
    ) {
        this.ref.classList.add(DndClass.Handle)
        this.ref.addEventListener(
            'mousedown',
            (ev: MouseEvent) => this.onMouseDown(this, ev),
        )

        const { top, left } = this.ref.getBoundingClientRect()

        this.originalPosition = { x: left, y: top }
    }

    setState(state: DraggableState): void {
        switch (state) {
            case DraggableState.Idle: {
                this.removeStyle()
            }
            case DraggableState.Dragging: {
                this.setPosition(this.originalPosition)
            }
            case DraggableState.Dropping: {
            }
        }
    }

    setPosition(pos: Position): void {
        this.setStyle(this.getDraggingStyle(pos))
    }

    private setStyle(style: DraggableStyle): void {
        Object.assign(this.ref.style, style)
    }

    private removeStyle(): void {
        requestAnimationFrame(() => {
            this.ref.removeAttribute('style')
        })
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
