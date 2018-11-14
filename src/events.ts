import { WindowEvent } from "./types"

interface EventBinding {
    target: HTMLElement | string
    event: string
    fn: Function
}

const bindings: Array<EventBinding> = []

export function bindWindowEvent(
    event: WindowEvent,
    fn: (ev: MouseEvent) => void,
): void {
    bindings.push({
        target: "window",
        event,
        fn,
    })

    window.addEventListener(event, fn, { capture: true })
}

export function unbindWindowEvent(event: WindowEvent): void {
    const index = bindings.findIndex(
        it => it.event === event && it.target === "window",
    )

    if (index === -1) return

    const binding = bindings.splice(index, 1)[0]
    window.removeEventListener(event, binding.fn as (ev: MouseEvent) => void, {
        capture: true,
    })
}

export function bindScrollEvent(fn: (ev: UIEvent) => void): void {
    bindings.push({
        target: "document",
        event: "scroll",
        fn,
    })

    document.addEventListener("scroll", fn, true)
}

export function unbindScrollEvent(): void {
    const index = bindings.findIndex(
        it => it.event === "scroll" && it.target === "document",
    )

    if (index === -1) return

    const binding = bindings.splice(index, 1)[0]
    window.removeEventListener(
        "scroll",
        binding.fn as (ev: UIEvent) => void,
        true,
    )
}
