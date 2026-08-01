// Shared pointer/drag state for the car — written by window-level listeners,
// read every frame in CarModel's useFrame. No React re-renders.
//
// A drag only STARTS when the pointerdown lands on the canvas drag-surface
// (the fixed <Canvas> wrapper, which is marked [data-drag-surface] and sits at
// z-10). All UI controls sit at z-20 ABOVE the canvas, so their own
// pointerdowns never reach the surface — the configurator, cart, navbar, etc.
// stay fully clickable while empty scene / car areas drive the drag.
// Move + release are tracked on window so a drag can continue off-canvas.

import { useCart } from '../store/useCart'

const cartOpen = () => useCart.getState().isOpen

export const pointer = { x: 0, y: 0 } // normalized -1..1, for parallax
export const drag = {
  active: false,
  targetY: 0, // accumulated Y-rotation offset from dragging
  targetX: 0, // accumulated X-tilt offset from dragging (clamped)
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v))

export function initCarInteraction(): () => void {
  let lastX = 0
  let lastY = 0

  const onDown = (e: PointerEvent) => {
    if (cartOpen()) return // cart open → no drag
    // Only begin a drag when the press lands on the canvas surface (not on UI).
    const t = e.target
    if (!(t instanceof Element) || !t.closest('[data-drag-surface]')) return
    drag.active = true
    lastX = e.clientX
    lastY = e.clientY
  }

  const onMove = (e: PointerEvent) => {
    if (cartOpen()) return // cart open → freeze parallax + drag
    // parallax pointer, always current
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1

    if (!drag.active) return
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY
    drag.targetY += dx * 0.01 // horizontal drag → yaw
    drag.targetX = clamp(drag.targetX + dy * 0.005, -0.28, 0.28) // vertical → slight pitch
  }

  const onUp = () => {
    if (!drag.active) return
    drag.active = false
  }

  window.addEventListener('pointerdown', onDown, { passive: true })
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerup', onUp, { passive: true })
  window.addEventListener('pointercancel', onUp, { passive: true })

  return () => {
    window.removeEventListener('pointerdown', onDown)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
  }
}
