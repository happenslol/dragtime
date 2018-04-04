export enum DtimeClass {
    Handle = "dtime-handle",
    HandleBlockPointer = "dtime-handle--block-pointer",
    SteppingAside = "dtime-stepping-aside",

    Placeholder = "dtime-placeholder",

    BodyDragging = "dtime-dragging",
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

export type WindowEvent = "mousedown" | "mouseup" | "mousemove"

