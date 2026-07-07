import { useCart, parsePrice, formatPrice } from '../store/useCart'

// Cart drawer (z-[60]) — slides in from the right over everything. Dark
// premium theme. Lists each configured car (finish swatch + name + price),
// a subtotal, and a CHECKOUT button. Items are removable. All in-memory.
export default function CartDrawer() {
  const items = useCart((s) => s.items)
  const isOpen = useCart((s) => s.isOpen)
  const close = useCart((s) => s.close)
  const remove = useCart((s) => s.remove)

  const subtotal = items.reduce((sum, i) => sum + parsePrice(i.price), 0)

  return (
    <div
      className="fixed inset-0 z-[60]"
      style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      aria-hidden={!isOpen}
    >
      {/* backdrop */}
      <div
        onClick={close}
        className="absolute inset-0 bg-black/60 transition-opacity duration-300"
        style={{ opacity: isOpen ? 1 : 0 }}
      />

      {/* panel */}
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-[400px] flex-col bg-surface shadow-2xl transition-transform duration-300 ease-out"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
        role="dialog"
        aria-label="Cart"
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-hairline px-6 py-5">
          <span className="font-mono text-xs tracking-data text-hi">
            YOUR CART ({items.length})
          </span>
          <button
            onClick={close}
            aria-label="Close cart"
            className="text-lo transition-colors hover:text-hi"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>

        {/* items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <p className="mt-8 text-center font-mono text-[11px] tracking-data text-lo">
              YOUR CART IS EMPTY
            </p>
          ) : (
            <ul className="flex flex-col">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-4 border-b border-hairline py-4"
                >
                  <span
                    className="h-8 w-8 shrink-0 rounded-full"
                    style={{
                      backgroundColor: item.hex,
                      boxShadow: '0 0 0 1px rgba(255,255,255,0.15)',
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-lg leading-none text-hi">
                      {item.model}
                    </div>
                    <div className="mt-1 font-mono text-[10px] tracking-data text-lo">
                      {item.finishName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs text-hi">{item.price}</div>
                    <button
                      onClick={() => remove(item.id)}
                      className="mt-1 font-mono text-[9px] tracking-data text-lo underline-offset-2 transition-colors hover:text-accent hover:underline"
                    >
                      REMOVE
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* footer: subtotal + checkout */}
        <div className="border-t border-hairline px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-data text-lo">
              SUBTOTAL
            </span>
            <span className="font-display text-2xl leading-none text-hi">
              {formatPrice(subtotal)}
            </span>
          </div>
          <button
            disabled={items.length === 0}
            className="clip-cta w-full bg-accent py-3 font-mono text-[11px] font-bold tracking-data text-carbon transition-transform enabled:hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
          >
            CHECKOUT
          </button>
        </div>
      </aside>
    </div>
  )
}
