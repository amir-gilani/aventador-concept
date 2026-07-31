import { useEffect, useRef } from 'react'
import { scrollState, N_SLIDES } from '../scene/useScrollProgress'

// Accent-coloured hairline frame around the viewport. Its colour follows the
// active finish (via --accent) and it fades out as we enter the last slide
// (the Outro has its own closing frame). Opacity is driven from the shared
// scroll progress in a rAF — no React re-renders (project rule).
//
// Fade window in slide-position units (Slide 5 sits at N_SLIDES-1 = 4):
const FRAME_FADE_START = 3.2 // still fully on while Slide 4 is settled (sPos 3)
const FRAME_FADE_END = 3.85 // gone by the time the Outro settles

export default function SlideFrame() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const sPos = scrollState.progress * (N_SLIDES - 1)
      const k = Math.min(
        1,
        Math.max(0, (sPos - FRAME_FADE_START) / (FRAME_FADE_END - FRAME_FADE_START)),
      )
      if (ref.current) ref.current.style.opacity = String(1 - k)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div ref={ref} className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {/* An 8px accent band: an inner rounded rectangle whose huge accent
          box-shadow fills OUTWARD to the (square) screen edges. Result — outer
          corners stay flush to the screen, inner corners are rounded. */}
      <div
        className="absolute"
        style={{
          inset: '8px',
          borderRadius: '34px',
          boxShadow: '0 0 0 100vmax var(--accent)',
        }}
      />
    </div>
  )
}
