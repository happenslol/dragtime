enum DndClass {
    Handle = "dnd-handle",
    HandleBlockPointer = "dnd-handle--block-pointer",
    SteppingAside = "dnd-stepping-aside",
}

enum ZIndex {
    Dragging = 5000,
    Dropping = 4500,
}

const noop = () => {}

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

export interface DraggableDimensions {
    width: number
    height: number
    top: number
    left: number
}

export class DraggableElement {
    private dimensions: DraggableDimensions | null = null
    private state: DraggableState = DraggableState.Idle

    constructor(
        private ref: HTMLElement,
        private position: number,
        private sortableRef: Sortable,
    ) {
        this.ref.classList.add(DndClass.Handle)
        this.ref.onmousedown = (ev: MouseEvent) => {
            console.log(`sortable ref state is ${this.sortableRef.state}`)
            if (this.sortableRef.state !== SortableState.Idle)
                return

            this.sortableRef.setState(SortableState.Dragging, this)
            this.setState(DraggableState.Dragging)
        }
    }

    setState(state: DraggableState): void {
        switch (state) {
            case DraggableState.Idle: {
                this.removeStyle()
            }
            case DraggableState.Dragging: {
                this.setStyle(this.getDraggingStyle())
            }
            case DraggableState.Dropping: {
            }
        }
    }

    private setStyle(style: DraggableStyle): void {
        Object.assign(this.ref.style, style)
    }

    private removeStyle(): void {
        requestAnimationFrame(() => {
            this.ref.removeAttribute('style')
        })
    }

    private getDraggingStyle(): DraggableStyle {
        const result: DraggableStyle = {
            position: 'fixed',
            boxSizing: 'border-box',
            zIndex: ZIndex.Dragging,
            width: 100,
            height: 100,
            top: 0,
            left: 0,
            margin: 0,
            pointerEvents: 'none',
            transition: 'none',
            transform: '',
        }

        return result
    }
}

export enum SortableState {
    Idle,
    Pending,
    Dragging,
    Dropping,
}

export class Sortable {
    private elements: Array<DraggableElement> = []
    private bodyRef: HTMLElement =
        <HTMLElement>document.querySelector('body')

    state: SortableState = SortableState.Idle
    private draggingElem: DraggableElement | null = null

    constructor(
        elem: HTMLElement,
        childSelector?: string,
    ) {
        console.dir(elem)

        if (childSelector) {
            // TODO: make sure these are all children and don't
            // contain each other
            const children = elem.querySelectorAll(childSelector)

            for (let i = 0; i < children.length; i++) {
                const child = new DraggableElement(
                    <HTMLElement>children[i], i, this,
                )

                this.elements.push(child)
            }
        } else {
            for (let i = 0; i < elem.children.length; i++) {
                const child = new DraggableElement(
                    <HTMLElement>elem.children[i], i, this,
                )

                this.elements.push(child)
            }
        }
    }

    setState(state: SortableState, elem: DraggableElement | null): void {
        this.state = state
        this.draggingElem = elem

        switch (state) {
            case SortableState.Idle: {
                this.bodyRef.onload = noop
            }
            case SortableState.Pending: {
            }
            case SortableState.Dragging: {
                this.bodyRef.onmouseup = (ev: MouseEvent) => {
                    if (this.draggingElem !== null)
                        this.draggingElem.setState(DraggableState.Idle)

                    this.setState(SortableState.Idle, null)
                }
            }
            case SortableState.Dropping: {
            }
        }
    }
}

