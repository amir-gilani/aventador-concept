import { create } from 'zustand'

// In-memory cart (no backend, no localStorage). Mirrors the configurator's
// Finish shape but snapshots it per line item so later colour changes don't
// mutate items already in the cart.
export type CartItem = {
  id: string
  model: string
  finishName: string
  hex: string
  price: string // display string, e.g. "€ 420,000"
}

type CartState = {
  items: CartItem[]
  isOpen: boolean
  add: (item: Omit<CartItem, 'id'>) => void
  remove: (id: string) => void
  open: () => void
  close: () => void
  toggle: () => void
}

export const useCart = create<CartState>()((set) => ({
  items: [],
  isOpen: false,
  add: (item) =>
    set((s) => ({
      items: [
        ...s.items,
        { ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
      ],
    })),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}))

// ── Price helpers (parse the display string → number → formatted subtotal) ──
export function parsePrice(price: string): number {
  const digits = price.replace(/[^\d]/g, '')
  return digits ? parseInt(digits, 10) : 0
}

export function formatPrice(total: number): string {
  return `€ ${total.toLocaleString('en-US')}`
}
