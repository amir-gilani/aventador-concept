import type { ReactNode } from 'react'
import { useReveal } from './useReveal'

// Slide 4 — Limited Edition. Car CENTRED; a giant ghost "350" behind it. Four
// editorial callouts: absolute AROUND the car on desktop, a 2×2 grid under the
// car on mobile. Each has an accent index, a light value, a mono label, and (on
// desktop) a hairline connector with a node that points toward the car.

function Callout({
  side,
  pos,
  index,
  value,
  label,
}: {
  side: 'left' | 'right'
  pos: string // desktop-only positioning classes (lg: prefixed)
  index: string
  value: ReactNode
  label: string
}) {
  const isLeft = side === 'left'
  return (
    <div
      data-reveal
      data-reveal-dir={isLeft ? 'left' : 'right'}
      className={`flex flex-col items-start gap-1.5 text-left lg:absolute lg:w-32 ${pos} ${
        isLeft ? 'lg:left-[4.5rem] lg:items-end lg:text-right' : 'lg:right-24'
      }`}
    >
      <span className="font-mono text-[9px] tracking-data text-accent">{index}</span>
      <span className="-mt-0.5 font-body text-2xl font-light leading-none text-hi [font-variant-numeric:tabular-nums] lg:text-3xl">
        {value}
      </span>
      <span className="whitespace-nowrap font-mono text-[10px] tracking-data text-lo">
        {label}
      </span>
      {/* connector: hairline + node pointing toward the car — desktop only */}
      <span className="mt-1.5 hidden items-center gap-1.5 lg:flex">
        {isLeft ? (
          <>
            <span className="h-px w-14 bg-gradient-to-r from-transparent to-accent" />
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          </>
        ) : (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="h-px w-14 bg-gradient-to-r from-accent to-transparent" />
          </>
        )}
      </span>
    </div>
  )
}

export default function Slide4Limited() {
  const ref = useReveal<HTMLDivElement>()
  return (
    <section
      id="limited"
      data-snap
      className="relative h-screen w-full overflow-hidden"
      style={{ pointerEvents: 'none' }}
    >
      {/* z-0 — behind the car (canvas is z-10): ghost number */}
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        <span
          className="select-none font-display leading-none"
          style={{
            fontSize: 'clamp(160px, 42vw, 640px)',
            color: 'transparent',
            WebkitTextStroke: '1px rgba(244,244,242,0.05)',
          }}
        >
          350
        </span>
      </div>

      {/* z-20 — foreground UI, above the car */}
      <div ref={ref} className="relative z-20 h-full w-full">
        {/* mobile: bottom scrim under the stacked callouts (above the car) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-carbon via-carbon/55 to-transparent lg:hidden" />
        {/* top-centre kicker with rules — centring lives on the wrapper so the
            reveal's transform (on the inner element) never clobbers it */}
        <div className="absolute left-1/2 top-16 -translate-x-1/2">
          <div
            data-reveal
            className="flex items-center gap-3 font-mono text-[11px] tracking-data text-lo"
          >
            <span className="h-px w-10 bg-hairline" />
            LIMITED EDITION
            <span className="h-px w-10 bg-hairline" />
          </div>
        </div>

        {/* callouts — 2×2 grid at the bottom on mobile; the wrapper becomes
            display:contents on desktop so each callout positions absolutely */}
        <div className="absolute inset-x-0 bottom-16 grid grid-cols-2 gap-x-6 gap-y-7 px-8 lg:contents">
          <Callout side="left" pos="lg:top-[30%]" index="01" value="001" label="OF 350" />
          <Callout side="right" pos="lg:top-[30%]" index="03" value="V12" label="6.5L · NAT-ASP" />
          <Callout side="left" pos="lg:bottom-[30%]" index="02" value="100%" label="HANDCRAFTED" />
          <Callout
            side="right"
            pos="lg:bottom-[30%]"
            index="04"
            value={<span className="text-accent">✓</span>}
            label="CERTIFIED"
          />
        </div>
      </div>
    </section>
  )
}
