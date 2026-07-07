import { useReveal } from './useReveal'

// Slide 4 — Limited Edition. Car CENTRED; four short badge highlights arranged
// AROUND it (two per side). Kicker top-centre.
function Badge({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      data-reveal
      className={`absolute flex items-center gap-2 border border-hairline bg-carbon/40 px-4 py-2 font-mono text-[10px] tracking-data text-hi backdrop-blur-sm ${className ?? ''}`}
      style={{ pointerEvents: 'auto' }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      {children}
    </div>
  )
}

export default function Slide4Limited() {
  const ref = useReveal<HTMLDivElement>()
  return (
    <section
      id="limited"
      data-snap
      className="relative h-screen w-full"
      style={{ pointerEvents: 'none' }}
    >
      <div ref={ref} className="relative z-20 h-full w-full">
        {/* top-centre kicker */}
        <span
          data-reveal
          className="absolute left-1/2 top-20 -translate-x-1/2 font-mono text-[11px] tracking-data text-lo"
        >
          LIMITED EDITION
        </span>

        {/* four highlights around the car (two per side) */}
        <Badge className="left-6 top-[32%] md:left-16">001 / 350</Badge>
        <Badge className="left-6 bottom-[28%] md:left-16">HANDCRAFTED</Badge>
        <Badge className="right-6 top-[32%] md:right-16">CERTIFIED</Badge>
        <Badge className="right-6 bottom-[28%] md:right-16">V12</Badge>
      </div>
    </section>
  )
}
