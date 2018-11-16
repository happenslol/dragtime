export const handle = `
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    touch-action: manipulation;

    cursor: -webkit-grab;
    cursor: grab;
`

export const handleBlockPointer = `
    pointer-events: none;
`

export const steppingAside = `
    transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);
    pointer-events: none;
    cursor: inherit;
`

export const placeholder = `
    flex-shrink: 0;
    flex-grow: 0;
`

export const bodyDragging = `
    cursor: grabbing;
    cursor: -webkit-grabbing;

    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
`
