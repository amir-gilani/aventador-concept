import { create } from 'zustand'

// Tiny FX bus: lets the DOM "RESERVE" button trigger in-canvas effects
// (headlight flash) and holds the global sound mute state. In-memory only.
type FxState = {
  flashTick: number // incremented on each reserve → CarModel pulses headlights
  muted: boolean
  flash: () => void
  toggleMute: () => void
}

export const useFx = create<FxState>()((set) => ({
  flashTick: 0,
  muted: false,
  flash: () => set((s) => ({ flashTick: s.flashTick + 1 })),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
}))

// Lazy, fail-silent engine-rev playback. Requires a user gesture (called from
// the button click). If /engine.mp3 is missing or blocked, it no-ops.
let engineAudio: HTMLAudioElement | null = null
export function playEngine() {
  try {
    if (!engineAudio) {
      engineAudio = new Audio('/engine.mp3')
      engineAudio.preload = 'auto'
    }
    engineAudio.currentTime = 0
    const p = engineAudio.play()
    if (p && typeof p.catch === 'function') p.catch(() => {})
  } catch {
    /* fail silently */
  }
}
