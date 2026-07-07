// Navbar (z-30) — NOT fixed/sticky. It lives in the hero's normal flow and
// scrolls up and away with the hero content; once past the hero it's gone.
// mix-blend-difference so it reads over any paint colour while visible.
// Phase 1: static shell. Active-link scroll tracking arrives in Phase 3.
export default function Navbar() {
  return (
    <nav
      className="relative z-30 flex w-full items-center justify-between px-6 py-5 mix-blend-difference md:px-10"
      style={{ pointerEvents: 'none' }}
    >
      <div className="flex flex-col leading-none" style={{ pointerEvents: 'auto' }}>
        <span className="font-display text-lg tracking-wide">AUTOMOBILI</span>
        <span className="font-mono text-[10px] tracking-data text-lo">
          CONCEPT DIVISION
        </span>
      </div>

      <div
        className="hidden gap-8 font-mono text-xs tracking-data md:flex"
        style={{ pointerEvents: 'auto' }}
      >
        <span>MODEL</span>
        <span>PERFORMANCE</span>
        <span>CONFIGURE</span>
      </div>

      {/* Right side: cart + user. Clean 1.5px line icons in the nav text
          colour (currentColor). Both stay visible on mobile — no hamburger.
          gap-7 ≈ 28px between them. */}
      <div className="flex items-center gap-7" style={{ pointerEvents: 'auto' }}>
        <button className="text-hi transition-opacity hover:opacity-60" aria-label="Cart">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="9" cy="20" r="1.25" />
            <circle cx="18" cy="20" r="1.25" />
            <path d="M2.5 3.5h2.2l2.1 11.2a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.3l1.3-7.2H6" />
          </svg>
        </button>

        <button className="text-hi transition-opacity hover:opacity-60" aria-label="Account">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="3.75" />
            <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
          </svg>
        </button>
      </div>
    </nav>
  )
}
