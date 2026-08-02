// One spec row: big Anton value (tabular figures) with a small accent unit
// superscript, and a mono label below a hairline top rule that carries a short
// accent tick. Used by slides 2 (Performance) and 3 (Dimensions).
export default function StatRow({
  value,
  unit,
  label,
  align = 'left',
}: {
  value: string
  unit: string
  label: string
  align?: 'left' | 'right'
}) {
  const right = align === 'right'
  return (
    <div
      data-reveal
      className={`relative border-t border-hairline pt-4 ${right ? 'text-right' : ''}`}
    >
      {/* short accent tick sitting on the rule (signature data detail) */}
      <span
        className={`absolute -top-px h-0.5 w-10 bg-accent ${right ? 'right-0' : 'left-0'}`}
      />
      <div
        className="font-display leading-[0.9] text-hi [font-variant-numeric:tabular-nums]"
        style={{ fontSize: 'clamp(42px, 5.6vw, 76px)' }}
      >
        {value}
        <sup className="ml-1 align-super text-[0.3em] tracking-normal text-accent">
          {unit}
        </sup>
      </div>
      <div className="mt-2.5 font-mono text-[10px] tracking-[0.2em] text-lo">
        {label}
      </div>
    </div>
  )
}
