import StatRow from './StatRow'
import { useReveal } from './useReveal'

// Slide 2 — Performance. Car animates to the RIGHT; specs stack on the LEFT.
// (Placeholder numbers — Amir swaps in real values later.)
export default function Slide2Performance() {
  const ref = useReveal<HTMLDivElement>('left')
  return (
    <section
      id="performance"
      data-snap
      className="relative h-screen w-full overflow-hidden"
      style={{ pointerEvents: 'none' }}
    >
      {/* z-20 so DOM content renders ABOVE the fixed canvas (z-10). */}
      <div className="relative z-20 flex h-full items-center px-6 md:px-16">
        {/* subtle contrast backing so text never sinks into the car */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-carbon via-carbon/70 to-transparent md:w-[62%]" />
        <div ref={ref} className="relative w-full md:w-[46%]">
          <span
            data-reveal
            className="mb-8 block font-mono text-[11px] tracking-data text-lo"
          >
            003 — ENGINEERED TO INTIMIDATE
          </span>
          <div className="flex flex-col gap-6">
            <StatRow value="2.8" unit="S" label="0–100 KM/H" />
            <StatRow value="355" unit="KM/H" label="TOP SPEED" />
            <StatRow value="780" unit="CV" label="MAX POWER" />
            <StatRow value="6.5" unit="L" label="V12" />
          </div>
        </div>
      </div>
    </section>
  )
}
