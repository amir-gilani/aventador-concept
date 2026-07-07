// One spec row: big Anton value with a small accent unit superscript, and a
// mono label below a hairline top rule. Used by slides 2 (Performance) and
// 3 (Dimensions).
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
  return (
    <div
      data-reveal
      className={`border-t border-hairline pt-4 ${align === 'right' ? 'text-right' : ''}`}
    >
      <div
        className="font-display leading-none text-hi"
        style={{ fontSize: 'clamp(40px, 5.5vw, 72px)' }}
      >
        {value}
        <sup className="ml-1 align-super text-[0.32em] text-accent">{unit}</sup>
      </div>
      <div className="mt-2 font-mono text-[10px] tracking-data text-lo">
        {label}
      </div>
    </div>
  )
}
