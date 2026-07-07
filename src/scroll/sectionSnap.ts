import type Lenis from 'lenis'

// ─── FULL-PAGE SECTION SNAPPING ─────────────────────────────────
// One scroll gesture = one 100vh section (hero → specs → outro).
// Driven entirely through Lenis: we own the wheel/touch/key intent
// and animate to the next section with an eased `lenis.scrollTo`,
// so it never jumps and the car's continuous scroll progress keeps
// flowing smoothly through the transition.
//
// Tune here: SNAP_DURATION (transition length) and TAIL_MS (cooldown
// that swallows trackpad momentum after a snap settles).
// ────────────────────────────────────────────────────────────────
const SNAP_DURATION = 1.1 // seconds per section transition
const TAIL_MS = 140 // ignore momentum for this long after a snap

// expo.out — matches the project easing.
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))

export function initSectionSnap(lenis: Lenis): () => void {
  // Reduced motion: no hijack — fall back to normal free scroll.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {}
  }

  let locked = false
  let touchStartY = 0

  const snapTargets = () =>
    Array.from(document.querySelectorAll<HTMLElement>('[data-snap]')).map(
      (el) => el.offsetTop,
    )

  const nearestIndex = (targets: number[], y: number) => {
    let best = 0
    let bestDist = Infinity
    targets.forEach((top, i) => {
      const d = Math.abs(top - y)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    return best
  }

  const go = (dir: number) => {
    if (locked) return
    const targets = snapTargets()
    if (targets.length === 0) return

    const from = window.scrollY
    const i = Math.max(
      0,
      Math.min(nearestIndex(targets, from) + dir, targets.length - 1),
    )
    const target = targets[i]
    if (Math.abs(target - from) < 2) return // already there

    locked = true
    lenis.scrollTo(target, {
      duration: SNAP_DURATION,
      easing: easeOutExpo,
      lock: true, // ignore user input during the transition
      onComplete: () => {
        window.setTimeout(() => {
          locked = false
        }, TAIL_MS)
      },
    })
  }

  // Capture phase + stopImmediatePropagation so Lenis' own wheel/touch
  // handling never runs — we are the single source of scroll intent.
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    e.stopImmediatePropagation()
    if (Math.abs(e.deltaY) < 4) return
    go(e.deltaY > 0 ? 1 : -1)
  }

  const onTouchStart = (e: TouchEvent) => {
    touchStartY = e.touches[0]?.clientY ?? 0
  }
  const onTouchMove = (e: TouchEvent) => {
    e.preventDefault() // block free drag between sections
  }
  const onTouchEnd = (e: TouchEvent) => {
    const dy = touchStartY - (e.changedTouches[0]?.clientY ?? touchStartY)
    if (Math.abs(dy) < 40) return
    go(dy > 0 ? 1 : -1)
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault()
      go(1)
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault()
      go(-1)
    }
  }

  const opts = { passive: false, capture: true } as const
  window.addEventListener('wheel', onWheel, opts)
  window.addEventListener('touchstart', onTouchStart, { capture: true })
  window.addEventListener('touchmove', onTouchMove, opts)
  window.addEventListener('touchend', onTouchEnd, { capture: true })
  window.addEventListener('keydown', onKey)

  return () => {
    window.removeEventListener('wheel', onWheel, opts)
    window.removeEventListener('touchstart', onTouchStart, { capture: true })
    window.removeEventListener('touchmove', onTouchMove, opts)
    window.removeEventListener('touchend', onTouchEnd, { capture: true })
    window.removeEventListener('keydown', onKey)
  }
}
