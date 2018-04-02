import { DraggableItem } from './draggable-item'
import { Size, DndClass } from './types'

export interface PlaceholderStyle {
    width: number
    height: number
}

export class Placeholder {
    ref: HTMLElement

    constructor(item: DraggableItem) {
        const elem = document.createElement("div")
        const parentNode = item.ref.parentNode
        if (!parentNode) {
            // NOTE: This should never happen. (theoretically)
            console.error("No parent node for draggable item!")
            this.ref = elem
            return
        }

        this.ref = parentNode.insertBefore(elem, item.ref)
        elem.classList.add(DndClass.Placeholder)
        this.setStyle(this.getPlaceholderStyle(item.originalSize))
    }

    destroy(): void {
        this.ref.remove()
    }

    private setStyle(style: PlaceholderStyle): void {
        Object.assign(this.ref.style, style)
    }

    private getPlaceholderStyle({ width, height }: Size): PlaceholderStyle {
        const result: PlaceholderStyle = { width, height }
        return result
    }
}
