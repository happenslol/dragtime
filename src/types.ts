export enum DndClass {
    Handle = "dnd-handle",
    HandleBlockPointer = "dnd-handle--block-pointer",
    SteppingAside = "dnd-stepping-aside",

    Placeholder = "dnd-placeholder",
}

export enum ZIndex {
    Dragging = 5000,
    Dropping = 4500,
}

export interface Position {
    x: number
    y: number
}

export interface Size {
    width: number
    height: number
}

