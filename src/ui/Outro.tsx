import type { ReactNode } from 'react'
import Footer from './Footer'
import { useReveal } from './useReveal'

// Slide 5 — Outro. Cinematic closing frame: a faint "AVENTADOR" ghost wordmark
// and soft accent glow behind, a rule-flanked kicker, the big title, one primary
// CTA plus a quiet secondary link, minimal line socials, and a bottom link strip
// above the footer. The car has faded out by this point.
function Social({ label, children }: { label: string; children: ReactNode }) {
  return (
    <a
      href="#"
      aria-label={label}
      className="text-lo transition-colors duration-300 hover:text-accent"
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
      {/* z-0 — ghost wordmark behind everything */}
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        <span
          className="select-none whitespace-nowrap font-display uppercase leading-none"
          style={{
            fontSize: 'clamp(120px, 24vw, 400px)',
            letterSpacing: '-0.02em',
            color: 'transparent',
            WebkitTextStroke: '1px rgba(244,244,242,0.04)',
          }}
        >
          AVENTADOR
        </span>
      </div>

      {/* hairline corner marks (all four) */}
      <span className="pointer-events-none absolute left-6 top-6 h-8 w-8 border-l border-t border-hairline md:left-10 md:top-10" />
      <span className="pointer-events-none absolute right-6 top-6 h-8 w-8 border-r border-t border-hairline md:right-10 md:top-10" />
      <span className="pointer-events-none absolute bottom-24 left-6 h-8 w-8 border-b border-l border-hairline md:bottom-24 md:left-10" />
      <span className="pointer-events-none absolute bottom-24 right-6 h-8 w-8 border-b border-r border-hairline md:bottom-24 md:right-10" />

      <div
        ref={ref}
        className="relative z-20 flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center"
      >
        {/* rule-flanked kicker */}
        <div
          data-reveal
          className="flex items-center gap-3 font-mono text-[10px] tracking-data text-lo"
        >
          <span className="h-px w-10 bg-hairline" />
          THE FINAL V12 · 001 / 350
          <span className="h-px w-10 bg-hairline" />
        </div>

        {/* huge title */}
        <h2
          data-reveal
          className="font-display uppercase leading-[0.82] text-hi"
          style={{ fontSize: 'clamp(60px, 14vw, 220px)', letterSpacing: '-0.02em' }}
        >
          DEFY <span className="text-accent">LIMITS.</span>
        </h2>

        {/* tagline */}
        <p
          data-reveal
          className="max-w-md font-body text-sm leading-relaxed text-lo"
        >
          The final expression of the V12 era — hand-assembled, individually
          numbered, and yours to configure.
        </p>

        {/* CTA: one primary + a quiet secondary link */}
        <div
          data-reveal
          className="mt-2 flex flex-col items-center gap-5 sm:flex-row"
          style={{ pointerEvents: 'auto' }}
        >
          <button className="clip-cta bg-accent px-10 py-3.5 font-mono text-[11px] font-bold tracking-data text-carbon transition-transform hover:scale-[1.03]">
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

        {/* minimal line socials */}
        <div data-reveal className="mt-3 flex items-center gap-6">
          <Social label="X">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M4 4l16 16M20 4L4 20" />
            </svg>
          </Social>
          <Social label="Instagram">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
            </svg>
          </Social>
          <Social label="YouTube">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
              <path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
            </svg>
          </Social>
        </div>
      </div>

      {/* bottom link strip (above the footer) */}
      <div
        data-reveal
        className="relative z-20 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 pb-4 font-mono text-[10px] tracking-data text-lo"
        style={{ pointerEvents: 'auto' }}
      >
        <a href="#" className="transition-colors hover:text-hi">OFFICIAL STORE</a>
        <span className="text-lo/40">·</span>
        <a href="#" className="transition-colors hover:text-hi">GLOBAL SHIPPING</a>
        <span className="text-lo/40">·</span>
        <a href="#" className="transition-colors hover:text-hi">SECURE CHECKOUT</a>
      </div>

      {/* Footer docked at the base of the last slide. */}
      <Footer />
    </section>
  )
}
