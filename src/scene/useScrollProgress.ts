// Shared page scroll progress (0..1) — NO React re-renders.
// Written once per Lenis 'scroll' tick (see App.tsx); read every frame
// inside useFrame by the car + camera. This is the single source of the
// continuous progress that keeps the car rotating smoothly through snaps.
export const N_SLIDES = 5

export const scrollState = {
  progress: 0, // 0..1 across the whole 5-slide page
}
