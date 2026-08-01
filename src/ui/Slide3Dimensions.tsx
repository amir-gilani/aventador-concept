import StatRow from './StatRow'
import { useReveal } from './useReveal'

// Slide 2 (Dimensions). Car animates to the LEFT; specs stack on the RIGHT.
// (Placeholder numbers — Amir swaps in real values later.)
export default function Slide3Dimensions() {
  const ref = useReveal<HTMLDivElement>('right')
  return (
    <section
      id="dimensions"
      data-snap
      className="relative h-screen w-full overflow-hidden"
      style={{ pointerEvents: 'none' }}
    >
      {/* z-20 so DOM content renders ABOVE the fixed canvas (z-10). */}
      <div className="relative z-20 flex h-full items-center justify-end px-6 md:px-16">
        {/* subtle contrast backing (mirrored to the right) */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-full bg-gradient-to-l from-carbon via-carbon/70 to-transparent md:w-[62%]" />
        <div ref={ref} className="relative w-full md:w-[46%] md:text-right">
          <span
            data-reveal
            className="mb-8 block font-mono text-[11px] tracking-data text-lo"
          >
            002 — PROPORTIONS
          </span>
          <div className="flex flex-col gap-6">
            <StatRow value="4780" unit="MM" label="LENGTH" align="right" />
            <StatRow value="2030" unit="MM" label="WIDTH" align="right" />
            <StatRow value="1136" unit="MM" label="HEIGHT" align="right" />
            <StatRow value="1550" unit="KG" label="DRY WEIGHT" align="right" />
          </div>
        </div>
      </div>
    </section>
  )
}
