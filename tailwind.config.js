/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // ─── COLOUR TOKENS (edit here) ───────────────────────────────
      colors: {
        carbon: '#0b0b0d', // warm near-black stage (NOT pure #000)
        surface: '#141417',
        hi: '#f4f4f2', // high-contrast text
        lo: '#86868c', // low-contrast text / captions
        // --accent is a live CSS var (updated by the configurator).
        accent: 'var(--accent)',
      },
      fontFamily: {
        display: ['Anton', 'sans-serif'], // big type / slide titles
        // Engraved editorial serif — the giant "AVENTADOR" watermark behind
        // the car. Cinzel is caps-only by design (stone-cut Roman letterforms).
        serif: ['Cinzel', 'Georgia', 'serif'],
        body: ['Inter', 'sans-serif'], // UI / body
        mono: ['"Space Mono"', 'monospace'], // data / captions
      },
      borderColor: {
        hairline: 'rgba(255,255,255,0.10)',
      },
    },
  },
  plugins: [],
}
