import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { useConfig, FINISHES } from '../store/useConfig'
import { useFx } from '../store/useFx'
import { scrollState, N_SLIDES } from './useScrollProgress'
import { pointer, drag } from './interaction'

// ─── GLB SWAP POINT ───────────────────────────────────────────
// STATUS: DONE — real model in place at /public/models/car.glb.
// This build is NOT Draco-compressed, so useGLTF needs no decoder path.
// Materials are assigned by MESH NAME below (a single glTF material is shared
// across body/chrome/trim, so we split on mesh name, not material name).
// The auto-fit block re-frames whatever geometry lives in <group ref={fit}>,
// so a different .glb would only need its mesh-name rules updated here.
// ──────────────────────────────────────────────────────────────

const MODEL_URL = '/models/car.glb'

// ── Tuning seams a beginner edits ──────────────────────────────
const TARGET_LENGTH = 4.4 // world units the car's longest axis fits to
const FIT_ADJUST = 1.3 // art-directed scale multiplier (hero size on Slide 1)
// Car horizontal position per slide: centre → right → left → centre → centre
const CAR_X = [0, 1.7, -1.7, 0, 0]
// Default resting pose on load — hardcoded (x, y, z) in radians. Left-side
// three-quarter, angled toward the front (mostly facing the viewer). NOTE: the
// real model's native forward may differ, so REST_Y likely needs re-tuning —
// press "P" to log the live angle and tell me the number.
const REST_X = 0.02 // pitch
const REST_Y = 0.0 // yaw (more front-on — tune for real model)
const REST_Z = 0 // roll
const PARALLAX_Y = 0.12 // how far the car yaws toward the pointer (subtle)
const PARALLAX_X = 0.06 // how far it pitches toward the pointer (subtle)
// Car fade-out window in slide-position units (Slide 5 sits at 4).
const FADE_START = 3.4 // begin fading as we leave Slide 4
const FADE_END = 3.95 // fully invisible just before Slide 5 settles
const FLASH_BOOST = 4 // extra emissive intensity at the peak of the reserve flash
// ───────────────────────────────────────────────────────────────

const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smoothstep = (f: number) => f * f * (3 - 2 * f)

// A material tracked for the Slide-5 fade (opacity = base × carOpacity).
type FadeMat = { mat: THREE.Material & { opacity: number }; base: number }
// An emissive light material pulsed on reserve (intensity = base + v × BOOST).
type LightMat = { mat: THREE.MeshStandardMaterial; base: number }

export default function CarModel() {
  const outer = useRef<THREE.Group>(null!) // animated: x + rotation + load scale
  const fit = useRef<THREE.Group>(null!) // normalization: recenter + scale
  const dragY = useRef(0)
  const dragX = useRef(0)
  const paraY = useRef(0)
  const paraX = useRef(0)
  const fadeMats = useRef<FadeMat[]>([]) // every material, for the fade-out
  const lightMats = useRef<LightMat[]>([]) // emissive lights, for the flash

  const { scene } = useGLTF(MODEL_URL)
  const finish = useConfig((s) => s.finish)

  // Shared body paint — one instance, tweened on colour change. transparent so
  // it can take part in the Slide-5 fade.
  const paint = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(FINISHES[0].hex),
        metalness: 0.85,
        roughness: 0.3,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.25,
        transparent: true,
      }),
    [],
  )
  // Brake caliper — FIXED colour (does NOT follow the paint / finish colour).
  const caliper = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2a2a2e',
        metalness: 0.5,
        roughness: 0.35,
        transparent: true,
      }),
    [],
  )

  // ═══ Prepare the model: assign materials by mesh name; collect fade + light
  //     material lists; hide beam geometry. Runs as a LAYOUT effect so it
  //     happens BEFORE auto-fit — hidden beams must be gone before the box is
  //     measured, or they'd inflate it and shrink the car.
  useLayoutEffect(() => {
    const fades: FadeMat[] = []
    const lights: LightMat[] = []
    const track = <T extends THREE.Material & { opacity: number }>(m: T): T => {
      m.transparent = true
      fades.push({ mat: m, base: m.opacity ?? 1 })
      return m
    }
    track(paint)
    track(caliper)

    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const n = mesh.name.toLowerCase()
      const old = mesh.material as THREE.MeshStandardMaterial
      const map = old?.map ?? null

      // remove any projected light-beam / glow / halo / flare geometry
      if (/beam|glow|halo|flare|volumetric|light_ray|lightray/.test(n)) {
        mesh.visible = false
        return
      }

      // body + both doors → paint (the ONLY meshes that follow the finish colour)
      if (n.includes('carpaint')) {
        mesh.material = paint
        return
      }
      // brake caliper → finish-tinted
      if (n.includes('caliper')) {
        mesh.material = caliper
        return
      }
      // headlight lens → clear · cabin glass → smoked
      if (n.includes('headlight_glass')) {
        mesh.material = track(
          new THREE.MeshPhysicalMaterial({
            color: '#ffffff',
            transparent: true,
            opacity: 0.35,
            roughness: 0.05,
            metalness: 0,
            clearcoat: 1,
          }),
        )
        return
      }
      if (n.includes('glass')) {
        mesh.material = track(
          new THREE.MeshPhysicalMaterial({
            color: '#050507',
            transparent: true,
            opacity: 0.92, // near-opaque privacy glass — hides the empty interior
            roughness: 0.08,
            metalness: 0,
            clearcoat: 1,
            clearcoatRoughness: 0.04,
          }),
        )
        return
      }
      // lamps → rear red stays lit; FRONT headlights off at rest (no beam/glow).
      // Both still pulse on reserve (base 0 → flashes up → back to 0).
      if (n.includes('lights_')) {
        const warm = n.includes('brakes') || n.includes('position_back')
        const base = warm ? 2.2 : 0
        const m = new THREE.MeshStandardMaterial({
          color: warm ? '#3a0505' : '#101014',
          emissive: new THREE.Color(warm ? '#ff2222' : '#e8f0ff'),
          emissiveIntensity: base,
          roughness: 0.4,
        })
        lights.push({ mat: m, base })
        mesh.material = track(m)
        return
      }
      // rims + spoiler → dark metal
      if (n.includes('rims') || n.includes('spoiler')) {
        mesh.material = track(
          new THREE.MeshStandardMaterial({
            color: '#1b1c20',
            metalness: 0.95,
            roughness: 0.25,
            envMapIntensity: 1.1,
            map,
          }),
        )
        return
      }
      // tyres → fully matte
      if (n.includes('tyres')) {
        mesh.material = track(
          new THREE.MeshStandardMaterial({
            color: '#0e0e10',
            metalness: 0,
            roughness: 0.95,
            map,
          }),
        )
        return
      }
      // chrome + window trim
      if (n.includes('chrome')) {
        mesh.material = track(
          new THREE.MeshStandardMaterial({
            color: '#c9ccd2',
            metalness: 1,
            roughness: 0.14,
            envMapIntensity: 1.4,
          }),
        )
        return
      }
      if (n.includes('window_trim')) {
        mesh.material = track(
          new THREE.MeshStandardMaterial({
            color: '#0b0b0d',
            metalness: 0.3,
            roughness: 0.5,
          }),
        )
        return
      }
      // underbody → matte black (barely seen)
      if (n.includes('car_bottom')) {
        mesh.material = track(
          new THREE.MeshStandardMaterial({ color: '#050506', roughness: 1 }),
        )
        return
      }
      // everything else (carbon, diffuser) → keep its texture, just glossier
      mesh.material = track(
        new THREE.MeshStandardMaterial({
          color: '#ffffff',
          map,
          metalness: 0.5,
          roughness: 0.4,
          envMapIntensity: 1.1,
        }),
      )
    })

    fadeMats.current = fades
    lightMats.current = lights
  }, [scene, paint, caliper])

  // AUTO-FIT: recenter on X/Z, sit on the floor (Y), scale longest axis to
  // TARGET_LENGTH. Measures ONLY visible meshes (Box3.setFromObject would also
  // count hidden beams / far-off empty nodes and shrink the car).
  useLayoutEffect(() => {
    const g = fit.current
    g.scale.setScalar(1)
    g.position.set(0, 0, 0)
    g.updateWorldMatrix(true, true)

    const box = new THREE.Box3()
    const tmp = new THREE.Box3()
    g.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh || m.visible === false || !m.geometry) return
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox()
      if (m.geometry.boundingBox) {
        tmp.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld)
        box.union(tmp)
      }
    })
    if (box.isEmpty()) return

    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    const s = (TARGET_LENGTH / maxDim) * FIT_ADJUST
    g.scale.setScalar(s)
    g.position.set(-center.x * s, -box.min.y * s, -center.z * s)
  }, [scene])

  // Log the hardcoded resting pose, and expose "P" to print the car's LIVE
  // rotation (x, y, z) so a new default angle can be captured for the real model.
  useEffect(() => {
    console.log('[CarModel] resting pose (x, y, z):', REST_X, REST_Y, REST_Z)
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'p' && outer.current) {
        const r = outer.current.rotation
        console.log('[CarModel] live rotation (x, y, z):', r.x, r.y, r.z)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Load-in: scale 0.8 → 1 with a little overshoot (skip on reduced motion).
  useEffect(() => {
    if (reduceMotion) {
      outer.current.scale.setScalar(1)
      return
    }
    outer.current.scale.setScalar(0.8)
    const tw = gsap.to(outer.current.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1.1,
      ease: 'back.out(1.4)',
      delay: 0.15,
    })
    return () => {
      tw.kill()
    }
  }, [])

  // Tween the body paint colour on every finish change (never snap).
  useEffect(() => {
    const target = new THREE.Color(finish.hex)
    const tw = gsap.to(paint.color, {
      r: target.r,
      g: target.g,
      b: target.b,
      duration: 0.6,
      ease: 'power2.out',
    })
    return () => {
      tw.kill()
    }
  }, [finish.hex, paint])

  // Headlight flash on reserve: a quick double emissive pulse, then back to
  // rest. Driven by the FX bus's flashTick (incremented by the RESERVE button).
  const flashTick = useFx((s) => s.flashTick)
  const firstFlash = useRef(true)
  useEffect(() => {
    if (firstFlash.current) {
      firstFlash.current = false
      return
    }
    const proxy = { v: 0 }
    const apply = () => {
      for (const { mat, base } of lightMats.current) {
        mat.emissiveIntensity = base + proxy.v * FLASH_BOOST
      }
    }
    const tl = gsap.timeline({ onUpdate: apply })
    tl.to(proxy, { v: 1, duration: 0.1, ease: 'power2.out' })
      .to(proxy, { v: 0.15, duration: 0.1, ease: 'power2.in' })
      .to(proxy, { v: 1, duration: 0.1, ease: 'power2.out' })
      .to(proxy, { v: 0, duration: 0.55, ease: 'power2.inOut' })
    return () => {
      tl.kill()
    }
  }, [flashTick])

  useFrame(() => {
    const t = scrollState.progress
    const sPos = t * (N_SLIDES - 1) // 0..(N-1) continuous slide position

    // Rotation = resting 3/4 pose + manual drag + subtle parallax. No self-spin.
    if (!drag.active) {
      drag.targetY = lerp(drag.targetY, 0, 0.03)
      drag.targetX = lerp(drag.targetX, 0, 0.03)
    }
    dragY.current = lerp(dragY.current, drag.targetY, 0.12)
    dragX.current = lerp(dragX.current, drag.targetX, 0.12)

    const paraTargetY = reduceMotion || drag.active ? 0 : pointer.x * PARALLAX_Y
    const paraTargetX = reduceMotion || drag.active ? 0 : pointer.y * PARALLAX_X
    paraY.current = lerp(paraY.current, paraTargetY, 0.06)
    paraX.current = lerp(paraX.current, paraTargetX, 0.06)

    outer.current.rotation.y = REST_Y + dragY.current + paraY.current
    outer.current.rotation.x = REST_X + dragX.current + paraX.current
    outer.current.rotation.z = REST_Z

    // Fade the car OUT as we enter Slide 5 (opacity = base × carOpacity).
    const fadeK = Math.min(1, Math.max(0, (sPos - FADE_START) / (FADE_END - FADE_START)))
    const carOpacity = 1 - smoothstep(fadeK)
    for (const { mat, base } of fadeMats.current) mat.opacity = base * carOpacity
    outer.current.visible = carOpacity > 0.001

    // X-position choreography — lerped between slide keyframes (centred on mobile).
    let targetX = 0
    if (window.innerWidth >= 768) {
      const i = Math.min(N_SLIDES - 2, Math.max(0, Math.floor(sPos)))
      const f = smoothstep(sPos - i)
      targetX = lerp(CAR_X[i], CAR_X[i + 1], f)
    }
    outer.current.position.x = lerp(outer.current.position.x, targetX, 0.08)
  })

  return (
    <group ref={outer}>
      <group ref={fit}>
        <primitive object={scene} dispose={null} />
      </group>
    </group>
  )
}

useGLTF.preload(MODEL_URL)
