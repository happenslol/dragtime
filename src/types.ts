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

export interface Margins {
    top: number
    bottom: number
    left: number
    right: number
}

export type WindowEvent = "mousedown" | "mouseup" | "mousemove"

export enum Direction {
    Up,
    Down,
    Left,
    Right,
}

export interface Limit {
    direction: Direction
    offset: number
}

export interface Bounds {
    top: number
    bottom: number
    left: number
    right: number
    width: number
    height: number
}

