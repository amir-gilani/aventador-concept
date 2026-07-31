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
const FIT_ADJUST = 1.165 // art-directed scale multiplier (hero size on Slide 1)
// Car horizontal position per slide: centre → left → right → centre → centre
// (Slide 2 = Dimensions text-right → car left · Slide 3 = Performance text-left → car right)
const CAR_X = [0, -4.4, 2.3, 0.6, 0]
// Extra yaw per slide (added to REST_Y). Slide 2 → right three-quarter view.
const ROT_Y_SLIDE = [0, 1.3, 0, 0, 0]
// Per-slide scale multiplier. Slide 2 sits far left (further from camera) so it
// is scaled up to read the same on-screen size as the other slides.
const SCALE_SLIDE = [1, 1.4, 0.9, 1, 1]
// Per-slide vertical offset (world units). Slide 2 is lowered to sit like the rest.
const CAR_Y = [0.06, -0.5, 0.12, 0, 0]
// Per-slide depth offset (world units). Negative = further from camera ("back").
const CAR_Z = [0, 0, -0.8, 0, 0]
// Default resting pose on load — hardcoded (x, y, z) in radians. Left-side
// three-quarter, angled toward the front (mostly facing the viewer). NOTE: the
// real model's native forward may differ, so REST_Y likely needs re-tuning —
// press "P" to log the live angle and tell me the number.
const REST_X = 0.02 // pitch
const REST_Y = 0.1 // yaw (more front-on — tune for real model)
const REST_Z = 0 // roll
const PARALLAX_Y = 0.12 // how far the car yaws toward the pointer (subtle)
const PARALLAX_X = 0.06 // how far it pitches toward the pointer (subtle)
// Car fade-out window in slide-position units (Slide 5 sits at 4).
const FADE_START = 3.4 // begin fading as we leave Slide 4
const FADE_END = 3.95 // fully invisible just before Slide 5 settles
const FLASH_BOOST = 4 // extra emissive intensity at the peak of the reserve flash
const SMOKE_N = 24 // tyre-smoke particle count (staggered, each with its own life)
const SHAKE_PIVOT_Z = 2.0 // reserve rock pivots near the FRONT so the rear shakes most (flip sign if reversed)
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
  const paintMeshes = useRef<THREE.Mesh[]>([]) // body panels — for the paint-sweep height range
  const rearWheels = useRef<THREE.Object3D[]>([]) // rear wheel nodes, spun on reserve
  const allWheels = useRef<THREE.Object3D[]>([]) // all four wheels, spun on Slide-4 entry
  const slide4Spun = useRef(false) // guard so the Slide-4 spin fires once per entry
  const zBase = useRef(0) // smoothed per-slide depth (lerp target lives here)
  const driveZ = useRef(0) // Slide-4 drive-in offset: starts far back, eases to 0
  const shake = useRef(0) // reserve rumble intensity (1 → 0)
  const shakeGroup = useRef<THREE.Group>(null!) // rocks the car on reserve (rear-biased)
  // Tyre-smoke: pool of billboard sprites, each with its own life/size/opacity.
  const smokeActive = useRef(false)
  const smokeState = useRef(
    Array.from({ length: SMOKE_N }, () => ({
      vx: 0, vy: 0, vz: 0, age: 0, life: 1, delay: 0,
    })),
  )

  const { scene } = useGLTF(MODEL_URL)
  const finish = useConfig((s) => s.finish)

  // Shared body paint — one instance, tweened on colour change. transparent so
  // it can take part in the Slide-5 fade.
  const paint = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(FINISHES[0].hex),
      metalness: 0.85,
      roughness: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.25,
      transparent: true,
    })
    // PAINT SWEEP: the new colour washes up the body (bottom→top) with a bright
    // edge line, instead of a flat crossfade. Uniforms driven from the effect
    // below; uSweep 0→1 reveals uColorB over uColorA.
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uSweep = { value: 1 }
      shader.uniforms.uColorA = { value: new THREE.Color(FINISHES[0].hex) }
      shader.uniforms.uColorB = { value: new THREE.Color(FINISHES[0].hex) }
      shader.uniforms.uYMin = { value: 0.0 }
      shader.uniforms.uYMax = { value: 1.6 }
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vSweepY;')
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\n vSweepY = (modelMatrix * vec4(transformed, 1.0)).y;',
        )
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          '#include <common>\nuniform float uSweep;\nuniform vec3 uColorA;\nuniform vec3 uColorB;\nuniform float uYMin;\nuniform float uYMax;\nvarying float vSweepY;',
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          {
            float h = clamp((vSweepY - uYMin) / (uYMax - uYMin), 0.0, 1.0);
            float w = 0.14;
            // boundary sweeps fully from below the body (-w) to above it (1+w)
            // so the car goes 100% old → 100% new across uSweep 0→1.
            float b = mix(-w, 1.0 + w, uSweep);
            float edge = smoothstep(b - w, b + w, h);
            diffuseColor.rgb = mix(uColorB, uColorA, edge);
            float line = clamp(1.0 - abs(h - b) / w, 0.0, 1.0);
            diffuseColor.rgb += line * line * 0.3;
          }`,
        )
      m.userData.shader = shader
    }
    return m
  }, [])
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

  // Soft round smoke sprite (procedural — no external asset).
  const smokeTex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(255,255,255,0.9)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
    return new THREE.CanvasTexture(c)
  }, [])
  const smokeSprites = useMemo(
    () =>
      Array.from({ length: SMOKE_N }, () => {
        const g = 0.5 + Math.random() * 0.16 // slight per-particle grey variation
        const m = new THREE.SpriteMaterial({
          map: smokeTex,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        })
        m.color.setRGB(g, g, g * 1.03)
        const s = new THREE.Sprite(m)
        s.visible = false
        return s
      }),
    [smokeTex],
  )

  // ═══ Prepare the model: assign materials by mesh name; collect fade + light
  //     material lists; hide beam geometry. Runs as a LAYOUT effect so it
  //     happens BEFORE auto-fit — hidden beams must be gone before the box is
  //     measured, or they'd inflate it and shrink the car.
  useLayoutEffect(() => {
    const fades: FadeMat[] = []
    const lights: LightMat[] = []
    const paints: THREE.Mesh[] = []
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
        paints.push(mesh)
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
    paintMeshes.current = paints

    // Rear wheel spin nodes (BL/BR) for the reserve burnout. Prefer the rig's
    // dedicated rotation bones; fall back to the rear wheel meshes.
    let rears = ['BL', 'BR']
      .map((k) => scene.getObjectByName(`bone_wheel_${k}_rotation`))
      .filter(Boolean) as THREE.Object3D[]
    if (rears.length === 0) {
      scene.traverse((o) => {
        if (/wheel_b[lr]/i.test(o.name)) rears.push(o)
      })
    }
    rearWheels.current = rears

    // All four wheel rotation nodes (for the Slide-4 entry spin).
    let all = ['FL', 'FR', 'BL', 'BR']
      .map((k) => scene.getObjectByName(`bone_wheel_${k}_rotation`))
      .filter(Boolean) as THREE.Object3D[]
    if (all.length === 0) {
      scene.traverse((o) => {
        if (/wheel_[fb][lr]/i.test(o.name)) all.push(o)
      })
    }
    allWheels.current = all
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
  // `loaded` gates the per-slide scale in useFrame so it doesn't fight this tween.
  const loaded = useRef(false)
  useEffect(() => {
    if (reduceMotion) {
      outer.current.scale.setScalar(1)
      loaded.current = true
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
      onComplete: () => {
        loaded.current = true
      },
    })
    return () => {
      tw.kill()
    }
  }, [])

  // Paint sweep on every finish change: the new colour washes up the body with
  // a bright edge, plus a brief reflection sheen. Falls back to a plain set if
  // the shader hasn't compiled yet (very first render).
  useEffect(() => {
    const target = new THREE.Color(finish.hex)
    const shader = paint.userData.shader as
      | { uniforms: Record<string, { value: THREE.Color | number }> }
      | undefined
    if (!shader) {
      paint.color.copy(target)
      return
    }
    const uA = shader.uniforms.uColorA.value as THREE.Color
    const uB = shader.uniforms.uColorB.value as THREE.Color
    uA.copy(uB) // start from the currently shown colour
    uB.copy(target)
    paint.color.copy(target) // keep material colour in sync

    // Map the sweep to the BODY panels' world height only (not wheels/spoiler),
    // so the top of the paint isn't reached before the sweep finishes.
    if (outer.current && paintMeshes.current.length) {
      outer.current.updateWorldMatrix(false, true)
      const box = new THREE.Box3()
      const tmp = new THREE.Box3()
      for (const m of paintMeshes.current) {
        if (!m.geometry.boundingBox) m.geometry.computeBoundingBox()
        if (m.geometry.boundingBox) {
          tmp.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld)
          box.union(tmp)
        }
      }
      if (!box.isEmpty()) {
        shader.uniforms.uYMin.value = box.min.y
        shader.uniforms.uYMax.value = box.max.y
      }
    }

    const s = { v: 0 }
    const tl = gsap.timeline()
    tl.to(s, {
      v: 1,
      duration: 0.9,
      ease: 'power2.inOut',
      onUpdate: () => {
        shader.uniforms.uSweep.value = s.v
      },
    }, 0)
    tl.to(paint, { envMapIntensity: 2.6, duration: 0.25, ease: 'power2.out' }, 0)
      .to(paint, { envMapIntensity: 1.25, duration: 0.65, ease: 'power2.inOut' }, 0.25)
    return () => {
      tl.kill()
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
    shake.current = 1 // rear-biased rumble, decays in useFrame
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

    // Rear wheel spin — a quick burnout that fast-starts then eases out.
    const spins = rearWheels.current.map((w) =>
      gsap.to(w.rotation, {
        x: w.rotation.x + Math.PI * 20,
        duration: 1.5,
        ease: 'power3.out',
        overwrite: true,
      }),
    )

    // Tyre-smoke burst at the rear contact patches (ground under the wheels).
    if (rearWheels.current.length) {
      const wp = new THREE.Vector3()
      const rand = (a: number, b: number) => a + Math.random() * (b - a)
      smokeSprites.forEach((s, i) => {
        rearWheels.current[i % rearWheels.current.length].getWorldPosition(wp)
        s.position.set(
          wp.x + rand(-0.35, 0.35),
          0.04 + Math.random() * 0.1,
          wp.z + rand(-0.35, 0.35),
        )
        s.scale.setScalar(rand(0.15, 0.3))
        s.material.rotation = Math.random() * Math.PI * 2
        s.material.opacity = 0
        s.visible = false
        const st = smokeState.current[i]
        st.vx = rand(-0.8, 0.8)
        st.vy = rand(0.25, 0.7)
        st.vz = rand(-0.8, 0.8)
        st.age = 0
        st.delay = Math.random() * 0.35 // staggered birth → billows over time
        st.life = rand(0.8, 1.4) // varied lifetime
      })
      smokeActive.current = true
    }

    return () => {
      tl.kill()
      spins.forEach((s) => s.kill())
    }
  }, [flashTick])

  useFrame((_, delta) => {
    const t = scrollState.progress
    const sPos = t * (N_SLIDES - 1) // 0..(N-1) continuous slide position

    // Reserve rumble: a quick, gentle rock. Pivoted near the front (see the
    // shakeGroup offset) so the REAR moves most. Decays to rest.
    shake.current = Math.max(0, shake.current - delta * 2.2)
    if (shakeGroup.current) {
      const a = shake.current * shake.current // ease-out
      shakeGroup.current.rotation.x = (Math.random() - 0.5) * 0.013 * a // pitch → rear bobs
      shakeGroup.current.rotation.z = (Math.random() - 0.5) * 0.005 * a // slight roll
      shakeGroup.current.position.set(0, (Math.random() - 0.5) * 0.007 * a, SHAKE_PIVOT_Z)
    }

    // Slide-4 entry: the car drives IN from the back — snap it far from the
    // camera, then ease it forward to rest while the wheels spin (once per entry).
    if (sPos > 2.7 && !slide4Spun.current) {
      slide4Spun.current = true
      driveZ.current = -7 // start well behind the resting depth
      gsap.to(driveZ, { current: 0, duration: 1.3, ease: 'power3.out', overwrite: true })
      allWheels.current.forEach((w) =>
        gsap.to(w.rotation, {
          x: w.rotation.x + Math.PI * 6,
          duration: 1.3,
          ease: 'power3.out',
          overwrite: true,
        }),
      )
    } else if (sPos < 2.5) {
      slide4Spun.current = false
    }

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

    // Per-slide keyframe interpolation (shared by yaw + x-position).
    const si = Math.min(N_SLIDES - 2, Math.max(0, Math.floor(sPos)))
    const sf = smoothstep(sPos - si)
    const slideYaw = lerp(ROT_Y_SLIDE[si], ROT_Y_SLIDE[si + 1], sf)

    outer.current.rotation.y = REST_Y + slideYaw + dragY.current + paraY.current
    outer.current.rotation.x = REST_X + dragX.current + paraX.current
    outer.current.rotation.z = REST_Z

    // Fade the car OUT as we enter Slide 5 (opacity = base × carOpacity).
    const fadeK = Math.min(1, Math.max(0, (sPos - FADE_START) / (FADE_END - FADE_START)))
    const carOpacity = 1 - smoothstep(fadeK)
    for (const { mat, base } of fadeMats.current) mat.opacity = base * carOpacity
    outer.current.visible = carOpacity > 0.001

    // X/Y position choreography — lerped between slide keyframes (centred on mobile).
    const desktop = window.innerWidth >= 768
    const targetX = desktop ? lerp(CAR_X[si], CAR_X[si + 1], sf) : 0
    const targetY = desktop ? lerp(CAR_Y[si], CAR_Y[si + 1], sf) : 0
    const targetZ = desktop ? lerp(CAR_Z[si], CAR_Z[si + 1], sf) : 0
    outer.current.position.x = lerp(outer.current.position.x, targetX, 0.08)
    outer.current.position.y = lerp(outer.current.position.y, targetY, 0.08)
    // Depth: smoothed base + the Slide-4 drive-in offset (added, not lerped, so
    // the car snaps to the back on entry and drives forward without retreating).
    zBase.current = lerp(zBase.current, targetZ, 0.08)
    outer.current.position.z = zBase.current + driveZ.current

    // Per-slide scale (after load, desktop only) — keeps far-left Slide 2 the
    // same on-screen size as the others.
    if (loaded.current && window.innerWidth >= 768) {
      const targetS = lerp(SCALE_SLIDE[si], SCALE_SLIDE[si + 1], sf)
      const cur = outer.current.scale.x
      outer.current.scale.setScalar(lerp(cur, targetS, 0.08))
    }

    // Tyre-smoke: integrate each sprite with its own life, buoyancy, swirl and
    // fade. Particles are born on a stagger and die individually → natural puff.
    if (smokeActive.current) {
      const damp = 1 - Math.min(1, delta * 1.1)
      let alive = false
      for (let i = 0; i < SMOKE_N; i++) {
        const s = smokeSprites[i]
        const st = smokeState.current[i]
        st.age += delta
        const life = st.age - st.delay // time since this particle was born
        if (life < 0) {
          alive = true
          continue // not born yet
        }
        if (life > st.life) {
          s.visible = false
          continue // dead
        }
        alive = true
        s.visible = true

        st.vx *= damp
        st.vz *= damp
        st.vy = st.vy * damp + 0.35 * delta // buoyant rise
        // gentle swirl so it curls instead of moving straight
        st.vx += Math.sin(st.age * 2.3 + i) * 0.25 * delta
        st.vz += Math.cos(st.age * 1.9 + i * 1.7) * 0.25 * delta
        s.position.x += st.vx * delta
        s.position.y += st.vy * delta
        s.position.z += st.vz * delta

        const k = life / st.life // 0..1 life progress
        s.scale.setScalar(0.25 + k * (1.4 + (i % 5) * 0.12)) // grows, varied
        s.material.rotation += delta * 0.5 * (i % 2 ? 1 : -1) // slow tumble
        const fadeIn = Math.min(1, life / 0.2)
        const fadeOut = 1 - k * k // hold, then ease out
        s.material.opacity = fadeIn * fadeOut * 0.28
      }
      if (!alive) smokeActive.current = false
    }
  })

  return (
    <>
      <group ref={outer}>
        {/* shakeGroup pivots at +z (front); the inner offset re-centres the car,
            so the reserve rock swings the REAR more than the front. */}
        <group ref={shakeGroup} position={[0, 0, SHAKE_PIVOT_Z]}>
          <group position={[0, 0, -SHAKE_PIVOT_Z]}>
            <group ref={fit}>
              <primitive object={scene} dispose={null} />
            </group>
          </group>
        </group>
      </group>
      {/* world-space tyre smoke (not parented to the animated car) */}
      <group>
        {smokeSprites.map((s, i) => (
          <primitive key={i} object={s} />
        ))}
      </group>
    </>
  )
}

useGLTF.preload(MODEL_URL)
