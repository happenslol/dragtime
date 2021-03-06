export enum ListType {
    Vertical = "vertical",
    Horizontal = "horizontal",
    GridVertical = "grid-vertical",
    GridHorizontal = "grid-horizontal",
}

export enum ZIndex {
    Dragging = 5000,
    Dropping = 4500,
}

export interface Position {
    x: number
    y: number
}

export const emptyPosition: () => Position = () => ({
    x: 0,
    y: 0,
})

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

export const emptyMargins: () => Margins = () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
})

export type WindowEvent = "mousedown" | "mouseup" | "mousemove"

export enum Direction {
    Up,
    Down,
    Left,
    Right,
    None,
}

export interface Bounds {
    top: number
    left: number
    width: number
    height: number
}

export const emptyBounds: () => Bounds = () => ({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
})

export enum DisplacementDirection {
    Forward = 1,
    Backward = -1,
    None = 0,
}

export interface Displacement {
    direction: DisplacementDirection
    offset: number
}

export const emptyDisplacement: () => Displacement = () => ({
    direction: DisplacementDirection.None,
    offset: 0,
})
