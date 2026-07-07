// Footer — mono, low contrast. Includes the required disclaimer.
export default function Footer() {
  return (
    <footer
      className="relative z-20 flex w-full flex-col gap-2 px-6 py-10 font-mono text-[10px] tracking-data text-lo md:flex-row md:items-center md:justify-between md:px-10"
      style={{ pointerEvents: 'auto' }}
    >
      <span>© 2026 CONCEPT — NOT AFFILIATED WITH ANY MANUFACTURER</span>
      <span>SCROLL TO ROTATE · TAP A COLOUR TO CONFIGURE</span>
    </footer>
  )
}
