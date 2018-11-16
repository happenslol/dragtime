import { DraggableItem } from "./draggable-item"
import { Size, Margins, Bounds } from "./types"
import * as styles from "./styles"

export class Placeholder {
    ref: HTMLElement

    bounds: Bounds
    margins: Margins

    constructor({ ref, bounds, margins }: DraggableItem) {
        const elem = document.createElement("div")
        const parentNode = ref.parentNode

        this.bounds = bounds
        this.margins = margins

        // NOTE: This should never happen. (theoretically)
        if (!parentNode) throw new Error("No parent node for draggable item!")

        const { width, height } = bounds
        this.ref = parentNode.insertBefore(elem, ref.nextElementSibling)
        this.setStyle(this.getPlaceholderStyle({ width, height }, margins))
        this.ref.setAttribute("data-placeholder", "")
    }

    destroy(): void {
        this.ref.remove()
    }

    private setStyle(style: string): void {
        this.ref.setAttribute("style", [styles.placeholder, style].join("\n"))
    }

    private getPlaceholderStyle(
        { width, height }: Size,
        margins: Margins,
    ): string {
        return `
            width: ${width}px;
            height: ${height}px;
            margin:
                ${margins.top}px
                ${margins.right}px
                ${margins.bottom}px
                ${margins.left}px;
        `
    }
}
