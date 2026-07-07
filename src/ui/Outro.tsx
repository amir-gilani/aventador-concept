import Footer from './Footer'
import { useReveal } from './useReveal'

// Slide 5 — Outro (car centred / fading back). Final CTA + social + link strip.
// Structure mirrors the reference; Amir edits exact text/links later.
function Social({ label, path }: { label: string; path: string }) {
  return (
    <a
      href="#"
      aria-label={label}
      className="text-hi transition-colors hover:text-accent"
      style={{ pointerEvents: 'auto' }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={path} />
      </svg>
    </a>
  )
}

export default function Outro() {
  const ref = useReveal<HTMLDivElement>()
  return (
    <section
      id="outro"
      data-snap
      className="relative flex h-screen w-full flex-col"
      style={{ pointerEvents: 'none' }}
    >
      <div
        ref={ref}
        className="relative z-20 flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center"
      >
        {/* kicker pill */}
        <span
          data-reveal
          className="rounded-full border border-hairline px-4 py-1 font-mono text-[10px] tracking-data text-lo"
        >
          NEXT-LEVEL PERFORMANCE
        </span>

        {/* huge title */}
        <h2
          data-reveal
          className="font-display uppercase leading-[0.85] text-hi"
          style={{ fontSize: 'clamp(56px, 12vw, 180px)' }}
        >
          DEFY <span className="text-accent">LIMITS.</span>
        </h2>

        {/* social row */}
        <div data-reveal className="flex items-center gap-6">
          {/* X */}
          <Social label="X" path="M4 4l16 16M20 4L4 20" />
          {/* Instagram */}
          <a
            href="#"
            aria-label="Instagram"
            className="text-hi transition-colors hover:text-accent"
            style={{ pointerEvents: 'auto' }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
            </svg>
          </a>
          {/* YouTube */}
          <a
            href="#"
            aria-label="YouTube"
            className="text-hi transition-colors hover:text-accent"
            style={{ pointerEvents: 'auto' }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
              <path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>

        {/* primary CTA */}
        <button
          data-reveal
          className="clip-cta bg-accent px-8 py-3 font-mono text-[11px] font-bold tracking-data text-carbon transition-transform hover:scale-[1.03]"
          style={{ pointerEvents: 'auto' }}
        >
          SHOP COLLECTION
        </button>

        {/* bottom link strip */}
        <div
          data-reveal
          className="mt-2 font-mono text-[10px] tracking-data text-lo"
        >
          OFFICIAL STORE · GLOBAL SHIPPING · SECURE CHECKOUT
        </div>
      </div>

      {/* Footer docked at the base of the last slide. */}
      <Footer />
    </section>
  )
}
