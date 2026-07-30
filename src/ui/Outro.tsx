import type { ReactNode } from 'react'
import Footer from './Footer'
import { useReveal } from './useReveal'

// Slide 5 — Outro. A cinematic closing frame: accent glow + a faint "350" ghost
// wordmark behind, an edition mark, the big title, dual CTAs, circled socials,
// and hairline corner marks. The car has faded out by this point.
function Social({ label, children }: { label: string; children: ReactNode }) {
  return (
    <a
      href="#"
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline text-hi transition-all duration-300 hover:scale-110 hover:border-accent hover:text-accent"
      style={{ pointerEvents: 'auto' }}
    >
      {children}
    </a>
  )
}

export default function Outro() {
  const ref = useReveal<HTMLDivElement>()
  return (
    <section
      id="outro"
      data-snap
      className="relative flex h-screen w-full flex-col overflow-hidden"
      style={{ pointerEvents: 'none' }}
    >
      {/* hairline corner marks (framing) */}
      <span className="pointer-events-none absolute left-6 top-6 h-8 w-8 border-l border-t border-hairline md:left-10 md:top-10" />
      <span className="pointer-events-none absolute right-6 top-6 h-8 w-8 border-r border-t border-hairline md:right-10 md:top-10" />

      <div
        ref={ref}
        className="relative z-20 flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center"
      >
        {/* soft accent glow (colour follows the finish) */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: 'min(95vw, 1000px)',
            height: 'min(60vh, 540px)',
            background: 'radial-gradient(closest-side, var(--accent), transparent 72%)',
            opacity: 0.12,
            filter: 'blur(30px)',
          }}
        />
        {/* faint ghost wordmark behind the title */}
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-display leading-none"
          style={{
            fontSize: 'clamp(160px, 34vw, 520px)',
            color: 'transparent',
            WebkitTextStroke: '1px rgba(244,244,242,0.035)',
          }}
        >
          350
        </span>

        {/* edition mark */}
        <div
          data-reveal
          className="relative flex items-center gap-3 font-mono text-[10px] tracking-data text-lo"
        >
          <span className="h-px w-8 bg-hairline" />
          LIMITED EDITION · 001 / 350
          <span className="h-px w-8 bg-hairline" />
        </div>

        {/* kicker pill */}
        <span
          data-reveal
          className="relative rounded-full border border-hairline bg-surface/40 px-4 py-1.5 font-mono text-[10px] tracking-data text-lo backdrop-blur-sm"
        >
          NEXT-LEVEL PERFORMANCE
        </span>

        {/* huge title */}
        <h2
          data-reveal
          className="relative font-display uppercase leading-[0.82] text-hi"
          style={{ fontSize: 'clamp(56px, 13vw, 200px)', letterSpacing: '-0.02em' }}
        >
          DEFY <span className="text-accent">LIMITS.</span>
        </h2>

        {/* tagline */}
        <p
          data-reveal
          className="relative max-w-md font-body text-sm leading-relaxed text-lo"
        >
          The final expression of the V12 era — hand-assembled, individually
          numbered, and yours to configure.
        </p>

        {/* CTAs */}
        <div
          data-reveal
          className="relative mt-1 flex flex-col items-center gap-4 sm:flex-row"
          style={{ pointerEvents: 'auto' }}
        >
          <button className="clip-cta bg-accent px-9 py-3.5 font-mono text-[11px] font-bold tracking-data text-carbon transition-transform hover:scale-[1.03]">
            SHOP COLLECTION
          </button>
          <a
            href="#"
            className="group flex items-center gap-2 font-mono text-[11px] tracking-data text-hi transition-colors hover:text-accent"
          >
            BOOK A PRIVATE VIEWING
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>
        </div>

        {/* social row (circled) */}
        <div data-reveal className="relative mt-2 flex items-center gap-4">
          <Social label="X">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M4 4l16 16M20 4L4 20" />
            </svg>
          </Social>
          <Social label="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
            </svg>
          </Social>
          <Social label="YouTube">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
              <path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
            </svg>
          </Social>
        </div>
      </div>

      {/* Footer docked at the base of the last slide. */}
      <Footer />
    </section>
  )
}
