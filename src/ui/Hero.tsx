import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import Navbar from './Navbar'
import { useConfig, FINISHES } from '../store/useConfig'

// Slide 1 — Hero (car CENTRED). The giant wordmark sits on z-0 BEHIND the
// fixed canvas (z-10); all controls sit on z-20 ABOVE it. Configurator is
// fully wired: swatches / arrows / pagination drive the zustand store, which
// live-updates paint, rim light, --accent, price and finish name.
const WORDMARK = 'AVENTADOR'

// Filled background wordmark: a dark grey only slightly lighter than --carbon
// (#0b0b0d), with a soft vertical fade — more visible at the top, melting into
// the background toward the bottom. Quiet depth layer, never fights the car.
// (Clipped per-letter so background-clip:text works reliably on the spans.)
const WORDMARK_STYLE: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(to bottom, #2e2e34 0%, #1c1c21 55%, #0d0d10 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
}

export default function Hero() {
  const finish = useConfig((s) => s.finish)
  const index = useConfig((s) => s.index)
  const set = useConfig((s) => s.set)
  const next = useConfig((s) => s.next)
  const prev = useConfig((s) => s.prev)

  // Load sequence (skipped under reduced motion via gsap matchMedia guard).
  const wordmarkRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()
      tl.from('[data-letter]', {
        yPercent: 120,
        opacity: 0,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.04,
      })
      tl.from(
        '[data-hero-fade]',
        { y: 24, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08 },
        '-=0.4',
      )
    })
    return () => ctx.revert()
  }, [])

  return (
    <section
      id="hero"
      data-snap
      className="relative h-screen w-full"
      style={{ pointerEvents: 'none' }}
    >
      {/* z-0 — wordmark BEHIND the car (canvas is z-10, transparent). */}
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        <h1
          ref={wordmarkRef}
          className="select-none whitespace-nowrap font-display uppercase leading-[0.8]"
          style={{
            fontSize: 'clamp(64px, 18vw, 260px)',
            letterSpacing: '-0.02em',
          }}
        >
          {WORDMARK.split('').map((c, i) => (
            <span key={i} data-letter className="inline-block" style={WORDMARK_STYLE}>
              {c}
            </span>
          ))}
        </h1>
      </div>

      {/* z-20 — everything interactive/visible, above the car (canvas z-10).
          Depth order: wordmark (z-0) ← car (z-10) ← this UI (z-20). */}
      <div className="relative z-20 flex h-full flex-col">
        {/* Contrast scrims (behind this layer's text, above the car) so the
            foreground UI never sinks into a bright car body. pointer-events
            none so they never block the canvas or the controls. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-carbon/85 via-carbon/30 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-carbon/70 to-transparent" />

        <Navbar />

        <div className="relative flex-1">
          {/* top-left badge */}
          <span
            data-hero-fade
            className="absolute left-6 top-4 font-mono text-[10px] tracking-data text-lo md:left-10"
          >
            LIMITED — 001 / 350
          </span>

          {/* bottom-left: price + meta */}
          <div
            data-hero-fade
            className="absolute bottom-8 left-6 md:left-10"
            style={{ pointerEvents: 'auto' }}
          >
            <div
              className="font-display leading-none text-accent"
              style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}
            >
              {finish.price}
            </div>
            <div className="mt-2 font-mono text-[10px] tracking-data text-lo">
              DRIVETRAIN: AWD · V12 · {finish.name}
            </div>
          </div>

          {/* bottom-centre: CTA + swatches */}
          <div
            data-hero-fade
            className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-4"
            style={{ pointerEvents: 'auto' }}
          >
            <button className="clip-cta bg-accent px-7 py-3 font-mono text-[11px] font-bold tracking-data text-carbon transition-transform hover:scale-[1.03]">
              RESERVE YOURS
            </button>
            <div className="flex items-center gap-3">
              {FINISHES.map((f, i) => (
                <button
                  key={f.hex}
                  onClick={() => set(i)}
                  aria-label={f.name}
                  className="h-5 w-5 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: f.hex,
                    boxShadow:
                      i === index
                        ? '0 0 0 2px var(--carbon), 0 0 0 3px var(--accent)'
                        : '0 0 0 1px rgba(255,255,255,0.15)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* bottom-right: arrows + vertical pagination */}
          <div
            data-hero-fade
            className="absolute bottom-8 right-6 hidden items-center gap-5 md:flex md:right-10"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="flex gap-2">
              <button
                onClick={prev}
                aria-label="Previous finish"
                className="flex h-9 w-9 items-center justify-center border border-hairline text-hi transition-colors hover:border-accent hover:text-accent"
              >
                ←
              </button>
              <button
                onClick={next}
                aria-label="Next finish"
                className="flex h-9 w-9 items-center justify-center border border-hairline text-hi transition-colors hover:border-accent hover:text-accent"
              >
                →
              </button>
            </div>
            <span
              className="font-mono text-[10px] tracking-data text-lo"
              style={{ writingMode: 'vertical-rl' }}
            >
              0{index + 1} / 0{FINISHES.length}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
