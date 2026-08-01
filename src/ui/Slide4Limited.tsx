import type { ReactNode } from 'react'
import { useReveal } from './useReveal'

// Slide 4 — Limited Edition. Car CENTRED; a giant ghost "350" and a soft accent
// glow sit BEHIND it (z-0, behind the canvas). Four editorial callouts sit
// around it (two per side): an accent index, a light value, a mono label, and a
// hairline connector ending in a node that points toward the car.

function Callout({
  side,
  pos,
  index,
  value,
  label,
}: {
  side: 'left' | 'right'
  pos: string
  index: string
  value: ReactNode
  label: string
}) {
  const isLeft = side === 'left'
  return (
    <div
      data-reveal
      data-reveal-dir={isLeft ? 'left' : 'right'}
      className={`absolute ${pos} flex w-32 flex-col gap-1.5 ${
        isLeft
          ? 'left-4 items-end text-right md:left-[4.5rem]'
          : 'right-6 items-start text-left md:right-24'
      }`}
    >
      <span className="font-mono text-[9px] tracking-data text-accent">{index}</span>
      <span className="-mt-0.5 font-body text-2xl font-light leading-none text-hi md:text-3xl">
        {value}
      </span>
      <span className="whitespace-nowrap font-mono text-[10px] tracking-data text-lo">
        {label}
      </span>
      {/* connector: hairline + node, pointing toward the car */}
      <span className="mt-1.5 flex items-center gap-1.5">
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
      {/* z-0 — behind the car (canvas is z-10): accent glow + ghost number */}
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        <div
          className="absolute"
          style={{
            width: 'min(92vw, 900px)',
            height: 'min(62vh, 540px)',
            background:
              'radial-gradient(closest-side, var(--accent), transparent 72%)',
            opacity: 0.1,
            filter: 'blur(34px)',
          }}
        />
        <span
          className="select-none font-display leading-none"
          style={{
            fontSize: 'clamp(200px, 42vw, 640px)',
            color: 'transparent',
            WebkitTextStroke: '1px rgba(244,244,242,0.05)',
          }}
        >
          350
        </span>
      </div>

      {/* z-20 — foreground UI, above the car */}
      <div ref={ref} className="relative z-20 h-full w-full">
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

        {/* four callouts around the car */}
        <Callout side="left" pos="top-[30%]" index="01" value="001" label="OF 350" />
        <Callout
          side="left"
          pos="bottom-[30%]"
          index="02"
          value="100%"
          label="HANDCRAFTED"
        />
        <Callout
          side="right"
          pos="top-[30%]"
          index="03"
          value="V12"
          label="6.5L · NAT-ASP"
        />
        <Callout
          side="right"
          pos="bottom-[30%]"
          index="04"
          value={<span className="text-accent">✓</span>}
          label="CERTIFIED"
        />
      </div>
    </section>
  )
}
