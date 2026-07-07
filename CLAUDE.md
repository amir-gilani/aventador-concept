# CLAUDE.md — Project Rules

> This file is read automatically by Claude Code every session. It defines what this project is and the rules for building it. Follow it as the source of truth. Keep answers action-oriented; don't re-ask settled decisions.

## WHAT WE'RE BUILDING

A premium, single-page **3D supercar showcase** (Awwwards-grade): dark cinematic stage, one hero car centre-stage that **rotates as the user scrolls**, with a **live colour configurator** that recolours the car body, the UI accent, the price, and the finish name in real time. Aesthetic reference: a high-end automotive product landing page.

This is a **portfolio / concept** project — **not affiliated with any manufacturer**. Treat "Aventador" purely as a design theme; never embed official logos or trademarked marks.

---

## HARD RULES (never violate)

1. **PLACEHOLDER FIRST.** The real `.glb` model does not exist yet. Build the entire experience around a placeholder car (stylised low-poly wedge from primitives: extruded body + 4 cylinder wheels + glass cabin box). The site must be fully functional and beautiful with the placeholder.
2. **ONE-FILE SWAP CONTRACT.** All model geometry lives ONLY in `src/scene/CarModel.tsx`. Parent components only pass it the active paint colour. Keep this block in that file:
   ```tsx
   // ─── GLB SWAP POINT ───────────────────────────────────────────
   // When the real model is ready:
   // 1. Drop the file at /public/models/car.glb (Draco-compressed)
   // 2. const { scene } = useGLTF('/models/car.glb')  (needs Draco decoder path)
   // 3. Apply the paint material to the body mesh(es) by name.
   // Nothing outside this file should need to change.
   // ──────────────────────────────────────────────────────────────
   ```
3. **AUTO-FIT THE CAR (both placeholder and real GLB).** The car must occupy the same on-screen framing regardless of the model's native scale or origin. Inside `CarModel.tsx`, wrap the car in a group and normalize it on load: compute the bounding box (`new THREE.Box3().setFromObject(...)`), recenter it to the origin, and uniformly scale it so its longest dimension equals a fixed target size (e.g. `TARGET_LENGTH = 4.4` world units). Expose one `FIT_ADJUST` multiplier (default `1`) for optional art-directed tweaking. Result: dropping in any real `.glb` later needs zero manual scale/position guessing — it auto-sizes to match the placeholder's framing.
4. **NEVER use localStorage/sessionStorage.** All state in memory (zustand).
5. **Canvas is fixed and full-screen, behind the DOM UI.** DOM sections create scroll height; the car reacts to scroll progress. Never place the canvas inside a scrolling section.
6. **Do not substitute the stack.** No Next.js, no CSS-in-JS, no alternative animation libraries.
7. **Never set animated values directly from a scroll handler.** Store scroll progress in a ref and lerp toward it inside `useFrame`. No React state per scroll event.

---

## STACK (exact)

- Vite + React 18 + TypeScript
- `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`
- `gsap` (+ ScrollTrigger, free) · `lenis` (smooth scroll) · `zustand` (state)
- Tailwind CSS for all 2D UI

Setup (run yourself):
```bash
npm create vite@latest . -- --template react-ts
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing gsap lenis zustand
npm install -D tailwindcss postcss autoprefixer @types/three
```

---

## ARCHITECTURE

```
src/
  App.tsx                  // Lenis init, ScrollTrigger sync, layout shell
  scene/
    Experience.tsx         // <Canvas>, camera, lights, env, postprocessing
    CarModel.tsx           // ← the ONLY file that knows what the car is
    Stage.tsx              // floor, ContactShadows, ground glow
    useScrollProgress.ts   // 0..1 page scroll progress (shared ref, no re-renders)
  ui/
    Navbar.tsx  Hero.tsx  Slide2Performance.tsx  Slide3Dimensions.tsx  Slide4Limited.tsx  Outro.tsx  Footer.tsx  Loader.tsx
  store/
    useConfig.ts           // zustand configurator store
```

Z-layering (a classic failure point — apply from the start):
- z-0 hero wordmark (behind car) · z-10 fixed `<Canvas>` (`pointer-events:none` on the canvas element) · z-20 DOM sections (sections `pointer-events:none`, interactive children `pointer-events:auto`) · z-30 navbar — hero-only, NOT fixed; sits inside the hero's normal flow and scrolls away, absent in later sections (`mix-blend-mode:difference` while visible) · z-50 loader.

---

## STATE CONTRACT (`useConfig.ts`)

```ts
type Finish = { name: string; hex: string; price: string }
const FINISHES: Finish[] = [
  { name: 'GIALLO ORION',     hex: '#F5C518', price: '€ 420,000' },
  { name: 'ARANCIO BOREALIS', hex: '#FF5B04', price: '€ 428,000' },
  { name: 'VERDE MANTIS',     hex: '#6FBF3A', price: '€ 431,000' },
  { name: 'ROSSO MARS',       hex: '#C41E1E', price: '€ 425,000' },
  { name: 'BLU CEPHEUS',      hex: '#1E4FD6', price: '€ 424,000' },
  { name: 'GRIGIO TELESTO',   hex: '#3A3D42', price: '€ 419,000' },
  { name: 'BIANCO ICARUS',    hex: '#E9E9E6', price: '€ 422,000' },
]
// state: { index: number; finish: Finish; next(): void; prev(): void; set(i:number): void }
```
On every change: write hex to `document.documentElement.style.setProperty('--accent', hex)`, and **tween** the paint `material.color` (and rim-light colour) to the new hex over ~0.6s — never snap.

---

## DESIGN TOKENS

**Type:** Display `Anton` (all-caps, tight tracking; hero wordmark `clamp(64px,18vw,260px)`, line-height .8). Body/UI `Inter` 400–700. Data/captions `Space Mono`, uppercase, letter-spacing .14–.22em.

**Colour:** `--carbon:#0b0b0d` (warm near-black, NOT #000) + fixed radial vignette · `--surface:#141417` · `--hi:#f4f4f2` · `--lo:#86868c` · `--accent` starts `#F5C518`, live-updated · hairline `rgba(255,255,255,.10)`.

**Signature (spend boldness here only):** angular clip-path corners on the primary CTA `polygon(10px 0,100% 0,calc(100% - 10px) 100%,0 100%)`. Everything else quiet.

---

## 3D SCENE

- `<Canvas dpr={[1,2]} gl={{antialias:true}}>`, ACES filmic tone mapping, exposure ≈1.05.
- Camera fov 38, start `[4.4,1.7,6.2]`, lookAt `[0,0.55,0]`.
- `<Environment preset="studio" />` (essential for glossy paint).
- Lights: dim hemisphere fill + key directional `[4,7,5]` (~2) + accent-tinted rim from `[-3,2,-6]` (colour follows `--accent`).
- Stage: dark reflective floor + `<ContactShadows>` + soft radial ground glow.
- Postprocessing: `<Bloom intensity={0.4} luminanceThreshold={0.85} mipmapBlur />`; **disable below 768px**.
- Paint: `MeshPhysicalMaterial { metalness:.85, roughness:.3, clearcoat:1, clearcoatRoughness:.08, envMapIntensity:1.25 }`, colour from store.

---

## SECTIONS

**Navbar** (hero-only, NOT fixed/sticky): belongs **only to Slide 1 (hero)** — sits at the top of the hero in normal flow and scrolls up and away with the hero content. Once the user scrolls past the hero it must be completely gone: must NOT stick, reappear, or float over later slides. Left "AUTOMOBILI" + mono "CONCEPT DIVISION"; centre "Model · Performance · Configure" (active = accent); right side: two clean line/SVG icons — a **shopping-cart icon and a user icon**, side by side (~24–32px apart), same colour as nav text. Both icons stay visible on mobile (no hamburger collapse).

The page is **5 full-height slides** (each 100vh, section-snapped). The car lives on the fixed canvas; its horizontal position animates per slide (see ANIMATION → car x-position). Slides:

- **Slide 1 — Hero** (car CENTRED): giant `Anton` "AVENTADOR" BEHIND the car (outline stroke, low-opacity fill). Top-left badge "LIMITED — 001 / 350". Bottom-left price (accent `Anton`) + meta `DRIVETRAIN: AWD · V12 · {finish.name}`. Bottom-centre "RESERVE YOURS" CTA + 7 colour swatches below. Bottom-right two hairline arrow buttons + vertical rotated pagination `0{index+1} / 07`. (Navbar belongs to this slide only — see Navbar above.)
- **Slide 2 — Performance** (car moves to the RIGHT, text on the LEFT): mono eyebrow "002 — ENGINEERED TO INTIMIDATE"; key performance specs stacked on the left, each with a hairline top rule: `2.8s / 0–100 KM/H`, `355 KM/H / TOP SPEED`, `780 CV / MAX POWER`, `6.5L / V12` (units small superscript in accent).
- **Slide 3 — Dimensions** (car moves to the LEFT, text on the RIGHT): mono eyebrow "003 — PROPORTIONS"; physical/design specs stacked on the right, same styling: `4780 mm / LENGTH`, `2030 mm / WIDTH`, `1136 mm / HEIGHT`, `1550 kg / DRY WEIGHT`. (Placeholder numbers — Amir replaces with real values later.)
- **Slide 4 — Limited Edition** (car CENTRED, highlights arranged AROUND it in a circular/boxed layout like the basketball "THE CHAMPION" slide): mono kicker top-centre "LIMITED EDITION"; short badge-style highlights positioned around the car (two per side): `001 / 350`, `HANDCRAFTED`, `CERTIFIED`, `V12`. Keep labels short so they sit cleanly around the car.
- **Slide 5 — Outro** (car CENTRED or fading back; final CTA like the basketball "DEFY GRAVITY" slide): mono pill kicker top "NEXT-LEVEL PERFORMANCE"; huge `Anton` title "DEFY LIMITS." ("LIMITS." accent); a row of social icons (X / Instagram / YouTube — line/SVG, accent on hover); primary button "SHOP COLLECTION"; and a bottom strip of short links/labels (`OFFICIAL STORE · GLOBAL SHIPPING · SECURE CHECKOUT`). Structure mirrors the reference; Amir will edit the exact text/links later.
- **Footer** (inside/under Slide 5): mono, low contrast: `© 2026 CONCEPT — NOT AFFILIATED WITH ANY MANUFACTURER` · `SCROLL TO ROTATE · TAP A COLOUR TO CONFIGURE`.
- **Loader**: carbon overlay, mono "INITIALISING" + `useProgress` percent, fades when ready.

Note: pagination in the hero now reflects a range appropriate to the finishes/variants, not the slide count.

---

## ANIMATION

Lenis ↔ ScrollTrigger sync (exactly this):
```ts
const lenis = new Lenis()
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((t) => lenis.raf(t * 1000))
gsap.ticker.lagSmoothing(0)
```
- **Section snapping (full-page):** the page scrolls as 5 full-height panels (hero → performance → dimensions → limited → outro), one slide per scroll gesture. Each scroll down smoothly **snaps** to the next 100vh section — no free/partial scrolling between them. Implement it through Lenis (e.g. eased programmatic `lenis.scrollTo` on wheel/touch intent, or GSAP ScrollTrigger snap synced to Lenis) so it feels eased and cinematic, never an instant jump. Respect `prefers-reduced-motion` (fall back to normal scroll).
- **Scroll → car (must survive snapping):** progress `t = scrollY/(scrollHeight-innerHeight)` in a ref. In `useFrame` lerp (factor ~.06–.08): `rotation.y → -0.5 + t*Math.PI*2.2`; camera z `→ 6.2 - t*1.6`, y `→ 1.7 - t*0.7`; + idle drift `+= delta*0.12` (skip if reduced-motion). The car rotation reads continuous scroll progress, so it keeps rotating smoothly **through and between** snap transitions — snapping must not freeze or jump the car. Verify the animation stays smooth across snaps.
- **Car x-position per slide (choreography):** besides rotation, the car's horizontal position animates as slides change, lerped smoothly (never snapped): Slide 1 centre → Slide 2 right → Slide 3 left → Slide 4 centre → Slide 5 centre. Drive the target x from scroll progress / active section and lerp the car group's x in `useFrame`. On mobile, keep the car centred on all slides (text stacks above/below instead of beside) to avoid cramping.
- **Load sequence (<1.6s):** wordmark letters stagger (0.04s) → car scales 0.8→1 `back.out(1.4)` → price/CTA/swatches fade up (0.08s).
- **Reveals:** each slide's text (slides 2–5) reveals on its ScrollTrigger enter, stagger 0.1.
- **Micro:** swatch hover 1.1; arrows border→accent; CTA glow pulse on hover.
- Easing `expo.out` / `cubic-bezier(0.77,0,0.175,1)`.
- Respect `prefers-reduced-motion`: skip load seq + idle drift; keep scroll rotation (higher lerp).

---

## RESPONSIVE

- Tablet 768–1024: hamburger; wordmark/stats scale down; camera back ~15%; price+CTA stack.
- Mobile <768: 16px padding; hide arrows (keep swatches); dpr cap 1.5; **Bloom off**; single column. Test at 375 / 768 / 1440.

---

## KNOWN PITFALLS (avoid explicitly)

1. Black screen → camera inside model or no lights; check camera vs. model bounds first.
2. Canvas swallowing clicks → apply the pointer-events z-layering above.
3. Jittery scroll → never set rotation from scroll handler or drive React state per scroll; use ref + `useFrame` lerp.
4. Lenis vs ScrollTrigger fighting → use the exact sync snippet.
4b. Section snapping breaking car rotation → the car must read continuous scroll progress (ref + `useFrame` lerp), so it keeps rotating through snaps; don't gate rotation on discrete section index.
5. Cheap colour snap → tween `material.color` + rim light.
6. GLB later needs the Draco decoder path in `useGLTF`.
7. `<Environment>` fetches on load → wrap scene in `<Suspense>` with Loader (no unstyled flash).
8. `html, body { background: var(--carbon) }` so overscroll never flashes white.

---

## BUILD ORDER (verify each phase before the next)

1. **Shell** — Vite, Tailwind, fonts, tokens, 5 empty full-height slides, Lenis+ScrollTrigger synced. ✅ runs clean, smooth scroll, no console errors.
2. **Scene** — Canvas, camera, lights, Environment, Stage, placeholder car + paint. ✅ car visible/reflective/grounded; buttons still clickable.
3. **Scroll choreography** — rotation + camera dolly via ref/useFrame; nav active tracking. ✅ smooth, no jitter on fast flicks.
4. **Configurator** — zustand store, swatches, arrows, pagination; live tweened paint/accent/price/name. ✅ all controls update everything consistently.
5. **Polish** — load sequence, reveals, micro-interactions, Bloom, loader, reduced-motion, responsive at 375/768/1440. ✅ acceptance checklist.

---

## ACCEPTANCE CHECKLIST (self-verify before finishing any phase)

- [ ] `npm run dev` starts with no meaningful console errors
- [ ] Navbar is hero-only — scrolls away with the hero, never appears over slides 2–5
- [ ] Scrolling snaps smoothly one slide at a time across all 5 slides, eased not instant
- [ ] Car rotates smoothly across full scroll AND stays smooth through section snaps; camera dollies in
- [ ] All 7 finishes recolour: paint (tweened), rim light, `--accent` UI, price, finish name, active swatch ring
- [ ] Arrows + pagination cycle finishes; wordmark sits behind the car
- [ ] Every interactive element clickable (canvas not swallowing events)
- [ ] Loader shows progress and fades; no white/unstyled flash
- [ ] Mobile 375px: single column, no horizontal scroll, Bloom off, still smooth
- [ ] `prefers-reduced-motion` respected
- [ ] `CarModel.tsx` holds the GLB SWAP POINT; nothing outside references geometry

---

## SIGNATURE EFFECTS — PHASE NOW (placeholder-safe, add during Polish)

Keep these tasteful; they're the "premium" layer. All work on the placeholder:
- **Reflective floor** (`MeshReflectorMaterial`, subtle blur) — desktop only; simpler shadow on mobile.
- **Paint sweep** — colour change animates front-to-back via a shader uniform, not an instant swap.
- **Split layout (slides 2 & 3)** — car animates right (slide 2) then left (slide 3), spec text revealing on the opposite side (ScrollTrigger).
- **Mouse parallax** — lerp car/camera tilt toward normalized pointer.
- **Number count-up** — spec numbers count from 0 on enter.
- **Ambient tint sync** — scene/rim tint shifts slightly toward the active finish.

## SIGNATURE EFFECTS — PHASE AFTER REAL MODEL (do NOT attempt on placeholder)

Requires the real multi-part GLB:
- Scissor-door open / interior camera move · close-up detail shots (wheel, headlight) · part hover highlights + info hotspots · functional headlights.

---

## OUTPUT STYLE

When you finish a phase, print: (a) run commands, (b) a short note on where to tune colours / camera / rotation range, (c) the GLB swap instructions. Keep commentary minimal. Comment the code at the seams a beginner edits: the FINISHES array, camera position, rotation range, the CarModel TODO.
