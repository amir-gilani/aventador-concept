import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useCart } from '../store/useCart'
import { useConfig } from '../store/useConfig'

// Pick black or white for text sitting on `hex`, based on perceived luminance,
// so the badge number stays legible for every finish (dark accent → white,
// light accent → dark).
function readableOn(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  // 0.45 keeps orange/yellow/white on black text, red/blue/grey on white.
  return luminance > 0.45 ? '#0b0b0d' : '#f4f4f2'
}

// Navbar (z-30) — NOT fixed/sticky. It lives in the hero's normal flow and
// scrolls up and away with the hero content; once past the hero it's gone.
// mix-blend-difference so it reads over any paint colour while visible.
export default function Navbar() {
  const count = useCart((s) => s.items.length)
  const openCart = useCart((s) => s.open)
  const accent = useConfig((s) => s.finish.hex)

  // Quick "pop" on the badge whenever the count goes up: scale up larger, then
  // spring back to rest.
  const badgeRef = useRef<HTMLSpanElement>(null)
  const prevCount = useRef(count)
  useEffect(() => {
    if (count > prevCount.current && badgeRef.current) {
      gsap
        .timeline()
        .to(badgeRef.current, { scale: 1.5, duration: 0.16, ease: 'power2.out' })
        .to(badgeRef.current, { scale: 1, duration: 0.4, ease: 'back.out(3)' })
    }
    prevCount.current = count
  }, [count])

  return (
    <nav
      className="relative z-30 flex w-full items-center justify-between px-6 py-5 mix-blend-difference md:px-10"
      style={{ pointerEvents: 'none' }}
    >
      <div className="flex flex-col leading-none" style={{ pointerEvents: 'auto' }}>
        <span className="font-display text-lg tracking-wide">AUTOMOBILI</span>
        <span className="font-mono text-[10px] tracking-data text-lo">
          CONCEPT DIVISION
        </span>
      </div>

      <div
        className="hidden gap-8 font-mono text-xs tracking-data md:flex"
        style={{ pointerEvents: 'auto' }}
      >
        <span>MODEL</span>
        <span>PERFORMANCE</span>
        <span>CONFIGURE</span>
      </div>

      {/* Right side: cart + user. Clean 1.5px line icons in the nav text
          colour (currentColor). Both stay visible on mobile — no hamburger.
          gap-7 ≈ 28px between them. */}
      <div className="flex items-center gap-7" style={{ pointerEvents: 'auto' }}>
        <button
          onClick={openCart}
          className="relative text-hi transition-opacity hover:opacity-60"
          aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="9" cy="20" r="1.25" />
            <circle cx="18" cy="20" r="1.25" />
            <path d="M2.5 3.5h2.2l2.1 11.2a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.3l1.3-7.2H6" />
          </svg>
          {count > 0 && (
            <span
              ref={badgeRef}
              className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[9px] font-bold leading-none"
              style={{ color: readableOn(accent) }}
            >
              {count}
            </span>
          )}
        </button>

        <button className="text-hi transition-opacity hover:opacity-60" aria-label="Account">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="3.75" />
            <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
          </svg>
        </button>
      </div>
    </nav>
  )
}
