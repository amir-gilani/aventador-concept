// Shared page scroll progress (0..1) — NO React re-renders.
// Written once per Lenis 'scroll' tick (see App.tsx); read every frame
// inside useFrame by the car + camera. This is the single source of the
// continuous progress that keeps the car rotating smoothly through snaps.
export const N_SLIDES = 5

export const scrollState = {
  progress: 0, // 0..1 across the whole 5-slide page
}

// ── SLIDE-5 CLEAR-OUT ──────────────────────────────────────────
// The car AND its stage (reflective floor + contact shadow) fade out as we
// leave Slide 4, so the outro sits on plain --carbon with nothing behind the
// text. Window is in slide-position units (Slide 5 sits at 4).
export const FADE_START = 3.4 // begin fading as we leave Slide 4
export const FADE_END = 3.95 // fully invisible just before Slide 5 settles

const smoothstep = (f: number) => f * f * (3 - 2 * f)

/** 1 = fully visible, 0 = gone. Shared by CarModel and Stage. */
export function stageOpacity(progress: number) {
  const sPos = progress * (N_SLIDES - 1)
  const k = Math.min(1, Math.max(0, (sPos - FADE_START) / (FADE_END - FADE_START)))
  return 1 - smoothstep(k)
}
