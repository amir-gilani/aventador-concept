import { create } from 'zustand'

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

// Live-update the UI accent CSS var on every colour change.
function applyAccent(hex: string) {
  document.documentElement.style.setProperty('--accent', hex)
}

export const useConfig = create<ConfigState>()((set, get) => {
  applyAccent(FINISHES[0].hex) // initialise accent to the first finish
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
