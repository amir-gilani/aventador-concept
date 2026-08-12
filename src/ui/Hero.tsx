import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Navbar from './Navbar'
import { useConfig, FINISHES } from '../store/useConfig'
import { useCart } from '../store/useCart'
import { useFx, playEngine } from '../store/useFx'

// Slide 1 — Hero (car CENTRED). The giant wordmark sits on z-0 BEHIND the
// fixed canvas (z-10); all controls sit on z-20 ABOVE it. Configurator is
// fully wired: swatches / arrows / pagination drive the zustand store, which
// live-updates paint, rim light, --accent, price and finish name.
const WORDMARK = 'AVENTADOR'

// Background wordmark treatment lives per-letter as responsive arbitrary classes
// on the spans below: a soft grey fill + hairline stroke that reads a touch
// stronger on mobile and near-invisible on desktop, so it stays a quiet depth
// layer that never fights the car.

export default function Hero() {
  const finish = useConfig((s) => s.finish)
  const index = useConfig((s) => s.index)
  const set = useConfig((s) => s.set)
  const next = useConfig((s) => s.next)
  const prev = useConfig((s) => s.prev)
  const addToCart = useCart((s) => s.add)
  const flash = useFx((s) => s.flash)
  const muted = useFx((s) => s.muted)
  const toggleMute = useFx((s) => s.toggleMute)

  // Brief "RESERVED ✓" confirmation state on the button.
  const [reserved, setReserved] = useState(false)
  const reservedTimer = useRef<number | undefined>(undefined)

  // Reserve: add the configured car to the cart, flash the headlights, rev the
  // engine (unless muted / missing), and confirm on the button briefly.
  const reserve = () => {
    addToCart({
      model: WORDMARK,
      finishName: finish.name,
      hex: finish.hex,
      price: finish.price,
    })
    flash()
    if (!muted) playEngine()
    setReserved(true)
    window.clearTimeout(reservedTimer.current)
    reservedTimer.current = window.setTimeout(() => setReserved(false), 1400)
  }

  useEffect(() => () => window.clearTimeout(reservedTimer.current), [])

  // Price roll: on every finish change the price ticks over — the old value
  // rolls UP and out, the new value rolls in from below (synced with the paint
  // colour change). shownPrice lags finish.price by the out-phase so the swap
  // lands while the text is hidden.
  const [shownPrice, setShownPrice] = useState(finish.price)
  const priceRef = useRef<HTMLDivElement>(null)
  const firstPrice = useRef(true)
  useEffect(() => {
    if (firstPrice.current) {
      firstPrice.current = false
      return
    }
    const el = priceRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShownPrice(finish.price)
      return
    }
    // Timings mirror the car's paint sweep (~0.9s) so the new price lands with
    // the colour: old rolls out over the first third, new rolls in to settle as
    // the sweep finishes.
    const tl = gsap.timeline()
    tl.to(el, {
      yPercent: -120,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => setShownPrice(finish.price),
    })
      .set(el, { yPercent: 120 })
      .to(el, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out' })
    return () => {
      tl.kill()
    }
  }, [finish.price])

  // Reserve button label rolls the same way when it toggles to / from
  // "RESERVED ✓" (old rolls up and out, new rolls in from below).
  const label = reserved ? 'RESERVED ✓' : 'RESERVE YOURS'
  const [shownLabel, setShownLabel] = useState(label)
  const labelRef = useRef<HTMLSpanElement>(null)
  const firstLabel = useRef(true)
  useEffect(() => {
    if (firstLabel.current) {
      firstLabel.current = false
      return
    }
    const el = labelRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShownLabel(label)
      return
    }
    const tl = gsap.timeline()
    tl.to(el, {
      yPercent: -120,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => setShownLabel(label),
    })
      .set(el, { yPercent: 120 })
      .to(el, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out' })
    return () => {
      tl.kill()
    }
  }, [label])

  // On every COLOUR change the button label rolls in place too (same text,
  // same timing as the price) so it reads as part of the reconfigure.
  const firstLabelColor = useRef(true)
  useEffect(() => {
    if (firstLabelColor.current) {
      firstLabelColor.current = false
      return
    }
    const el = labelRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const tl = gsap.timeline()
    tl.to(el, { yPercent: -120, opacity: 0, duration: 0.3, ease: 'power2.in' })
      .set(el, { yPercent: 120 })
      .to(el, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out' })
    return () => {
      tl.kill()
    }
  }, [finish.hex])

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
        {/* Wordmark behind the car. Mobile/tablet: smaller + more faded (minimal),
            overlapping the car's lower part. Desktop: full-size. */}
        <h1
          ref={wordmarkRef}
          className="-translate-y-[3vh] select-none whitespace-nowrap font-display uppercase leading-[0.8] tracking-[0.04em] blur-[0.7px] lg:translate-y-0 lg:blur-none lg:tracking-[-0.02em]"
          style={{ fontSize: 'clamp(46px, 14vw, 260px)' }}
        >
          {WORDMARK.split('').map((c, i) => (
            <span
              key={i}
              data-letter
              className="inline-block text-transparent [-webkit-text-fill-color:#f4f4f259] lg:[-webkit-text-fill-color:#f4f4f206] lg:[-webkit-text-stroke:1px_#f4f4f216]"
            >
              {c}
            </span>
          ))}
        </h1>
      </div>

      {/* z-20 — everything interactive/visible, above the car (canvas z-10).
          Depth order: wordmark (z-0) ← car (z-10) ← this UI (z-20). */}
      <div className="relative z-20 flex h-full flex-col">
        {/* cinematic vignette — darkens the edges so the eye lands on the car.
            First in the z-20 layer so all text/controls sit above it. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 46%, transparent 52%, rgba(11,11,13,0.5) 100%)',
          }}
        />
        {/* Contrast scrims (behind this layer's text, above the car) so the
            foreground UI never sinks into a bright car body. pointer-events
            none so they never block the canvas or the controls. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-carbon/85 via-carbon/30 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-carbon/70 to-transparent" />

        <Navbar />

        <div className="relative flex-1">
          {/* mobile/tablet: prev/next stacked on the right (← top, → bottom) */}
          <div
            className="absolute right-4 top-[43%] flex -translate-y-1/2 flex-col gap-2 lg:hidden"
            style={{ pointerEvents: 'auto' }}
          >
            <button
              onClick={prev}
              aria-label="Previous finish"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-lg leading-none text-hi transition-colors hover:text-accent"
            >
              ‹
            </button>
            <button
              onClick={next}
              aria-label="Next finish"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-lg leading-none text-hi transition-colors hover:text-accent"
            >
              ›
            </button>
          </div>
          {/* top-left badge (desktop only) */}
          <span
            data-hero-fade
            className="absolute left-6 top-4 hidden font-mono text-[10px] tracking-data text-lo lg:left-10 lg:block"
          >
            LIMITED <span className="text-lo/40">—</span> 001 / 350
          </span>

          {/* bottom-left: price + meta (centred above the CTA on mobile/tablet) */}
          <div
            data-hero-fade
            className="absolute inset-x-0 bottom-[6.75rem] px-4 text-center lg:inset-x-auto lg:bottom-8 lg:left-10 lg:px-0 lg:text-left"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="overflow-hidden py-[0.06em]">
              <div
                ref={priceRef}
                className="font-body font-light leading-none tracking-[-0.03em] text-accent [font-variant-numeric:tabular-nums] lg:font-display lg:font-normal lg:tracking-normal"
                style={{ fontSize: 'clamp(56px, 9vw, 60px)' }}
              >
                {shownPrice}
              </div>
            </div>
            <div className="mt-2 font-mono text-[8px] tracking-[0.2em] text-lo lg:mt-2.5 lg:text-[10px] lg:tracking-data">
              <span className="hidden lg:inline">DRIVETRAIN: </span>AWD{' '}
              <span className="text-lo/40">·</span> V12{' '}
              <span className="text-lo/40">·</span> {finish.name}
            </div>
            {/* mute toggle for the engine-rev sound */}
            <button
              onClick={toggleMute}
              aria-label={muted ? 'Unmute sound' : 'Mute sound'}
              aria-pressed={muted}
              className="mt-3 hidden items-center justify-center gap-2 font-mono text-[10px] tracking-data text-lo transition-colors hover:text-hi lg:flex lg:justify-start"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 9v6h4l5 4V5L8 9H4z" />
                {muted ? (
                  <path d="M17 9l4 6M21 9l-4 6" />
                ) : (
                  <path d="M16.5 8.5a5 5 0 0 1 0 7" />
                )}
              </svg>
              {muted ? 'SOUND OFF' : 'SOUND ON'}
            </button>
          </div>

          {/* CTA + swatches. Mobile/tablet: full-width CTA pinned near the bottom
              with the swatch row directly ABOVE it (reachable, never covered).
              Desktop: centred, CTA above swatches. */}
          <div
            data-hero-fade
            className="absolute inset-x-0 bottom-6 flex flex-col-reverse items-center gap-4 px-5 lg:inset-x-auto lg:bottom-8 lg:left-1/2 lg:-translate-x-1/2 lg:flex-col lg:px-0"
            style={{ pointerEvents: 'auto' }}
          >
            <button
              onClick={reserve}
              className="clip-cta w-full bg-accent px-7 py-4 font-mono text-[11px] font-bold tracking-[0.2em] text-carbon transition-transform hover:scale-[1.03] lg:w-auto lg:min-w-[168px] lg:py-3 lg:tracking-data"
            >
              <span className="block overflow-hidden py-[0.15em]">
                <span ref={labelRef} className="block">
                  {shownLabel}
                </span>
              </span>
            </button>
            <div className="hidden items-center gap-3 lg:flex">
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

          {/* bottom-right: arrows + vertical pagination (desktop only) */}
          <div
            data-hero-fade
            className="absolute bottom-8 right-6 hidden items-center gap-5 lg:flex lg:right-10"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="flex gap-2">
              <button
                onClick={prev}
                aria-label="Previous finish"
                className="flex h-9 w-9 items-center justify-center border border-hairline text-hi transition-colors hover:border-accent"
              >
                ←
              </button>
              <button
                onClick={next}
                aria-label="Next finish"
                className="flex h-9 w-9 items-center justify-center border border-hairline text-hi transition-colors hover:border-accent"
              >
                →
              </button>
            </div>
            <span
              className="font-mono text-[10px] tracking-data text-lo [font-variant-numeric:tabular-nums]"
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
