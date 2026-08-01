import { create } from 'zustand'
import gsap from 'gsap'

// ─── FINISHES (edit here to add / adjust paint options) ──────────
export type Finish = { name: string; hex: string; price: string }

export const FINISHES: Finish[] = [
  { name: 'VERDE ERMES', hex: '#1f7a50', price: '€ 433,000' },
  { name: 'ARANCIO BOREALIS', hex: '#FF5B04', price: '€ 428,000' },
  { name: 'VERDE MANTIS', hex: '#6FBF3A', price: '€ 431,000' },
  { name: 'ROSSO MARS', hex: '#C41E1E', price: '€ 425,000' },
  { name: 'BLU CEPHEUS', hex: '#1E4FD6', price: '€ 424,000' },
  { name: 'GRIGIO TELESTO', hex: '#3A3D42', price: '€ 419,000' },
  { name: 'ACQUA CERAUNIA', hex: '#17B6C4', price: '€ 430,000' },
]

type ConfigState = {
  index: number
  finish: Finish
  next: () => void
  prev: () => void
  set: (i: number) => void
}

// ── Live UI accent (--accent) ────────────────────────────────────
// The accent var feeds the frame, price, swatch ring, CTA, etc. TWEEN it toward
// the finish colour (instead of snapping) so all the accent UI changes in step
// with the car's paint sweep / rim light — otherwise the surrounds jump while
// the car eases.
function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

const accentRGB = hexToRgb(FINISHES[0].hex)
let accentTween: gsap.core.Tween | null = null

function writeAccent() {
  document.documentElement.style.setProperty(
    '--accent',
    `rgb(${Math.round(accentRGB.r)}, ${Math.round(accentRGB.g)}, ${Math.round(accentRGB.b)})`,
  )
}

function applyAccent(hex: string, immediate = false) {
  const to = hexToRgb(hex)
  accentTween?.kill()
  if (immediate) {
    Object.assign(accentRGB, to)
    writeAccent()
    return
  }
  accentTween = gsap.to(accentRGB, {
    ...to,
    duration: 0.7,
    ease: 'power2.inOut',
    onUpdate: writeAccent,
  })
}

export const useConfig = create<ConfigState>()((set, get) => {
  applyAccent(FINISHES[0].hex, true) // initialise accent to the first finish
  return {
    index: 0,
    finish: FINISHES[0],
    next: () => get().set(get().index + 1),
    prev: () => get().set(get().index - 1),
    set: (i) => {
      const n = FINISHES.length
      const index = ((i % n) + n) % n // wrap both directions
      const finish = FINISHES[index]
      applyAccent(finish.hex)
      set({ index, finish })
    },
  }
})
