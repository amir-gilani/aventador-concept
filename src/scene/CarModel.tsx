import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { useConfig, FINISHES } from '../store/useConfig'
import { useFx } from '../store/useFx'
import { scrollState, N_SLIDES } from './useScrollProgress'
import { pointer, drag, setCarHover } from './interaction'

const LIGHT_BASE = 0.18 // resting emissive intensity of the light bars

// ─── GLB SWAP POINT ───────────────────────────────────────────
// When the real model is ready:
// 1. Drop the file at /public/models/car.glb (Draco-compressed)
// 2. const { scene } = useGLTF('/models/car.glb')  (needs Draco decoder path)
// 3. Apply the `paint` material to the body mesh(es) by name.
// Nothing outside this file should need to change — the auto-fit block
// below re-frames whatever geometry lives in the <group ref={fit}>.
// ──────────────────────────────────────────────────────────────

// ── Tuning seams a beginner edits ──────────────────────────────
const TARGET_LENGTH = 4.4 // world units the car's longest axis fits to
const FIT_ADJUST = 1 // optional art-directed scale multiplier
// Car horizontal position per slide: centre → right → left → centre → centre
const CAR_X = [0, 1.7, -1.7, 0, 0]
// Resting pose: a right-facing three-quarter view (flip REST_Y's sign to face
// the other way). The car no longer spins on its own — this is where it sits
// (plus manual drag + subtle parallax).
const REST_Y = 0.6 // resting yaw (right-facing 3/4)
const REST_X = 0.02 // tiny resting pitch
const PARALLAX_Y = 0.12 // how far the car yaws toward the pointer (subtle)
const PARALLAX_X = 0.06 // how far it pitches toward the pointer (subtle)
// Car fade-out window in slide-position units (Slide 5 sits at 4).
const FADE_START = 3.4 // begin fading as we leave Slide 4
const FADE_END = 3.95 // fully invisible just before Slide 5 settles
// ───────────────────────────────────────────────────────────────

const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smoothstep = (f: number) => f * f * (3 - 2 * f)

export default function CarModel() {
  const outer = useRef<THREE.Group>(null!) // animated: x + rotation + load scale
  const fit = useRef<THREE.Group>(null!) // normalization: recenter + scale
  // Smoothed rotation contributions: drag offset + parallax offset.
  const dragY = useRef(0)
  const dragX = useRef(0)
  const paraY = useRef(0)
  const paraX = useRef(0)

  const finish = useConfig((s) => s.finish)

  // Shared paint material — every body panel uses this one instance, so a
  // single colour tween recolours the whole car.
  const paint = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(FINISHES[0].hex),
        metalness: 0.85,
        roughness: 0.3,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.25,
        transparent: true, // enables the Slide-5 fade-out (opacity driven below)
      }),
    [],
  )
  const tyre = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0a0a0b',
        roughness: 0.85,
        metalness: 0.1,
        transparent: true,
      }),
    [],
  )
  const rim = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1b1b20',
        roughness: 0.35,
        metalness: 0.9,
        transparent: true,
      }),
    [],
  )
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#05070a',
        roughness: 0.08,
        metalness: 0,
        transmission: 0.5,
        transparent: true,
        opacity: 0.85,
        ior: 1.4,
      }),
    [],
  )
  // Emissive light bars (front headlights = cool white, rear = red). Their
  // emissiveIntensity rests at LIGHT_BASE and pulses on reserve (see below).
  const headlight = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0a0a0b',
        emissive: new THREE.Color('#eaf2ff'),
        emissiveIntensity: LIGHT_BASE,
        roughness: 0.3,
        metalness: 0,
        transparent: true,
      }),
    [],
  )
  const taillight = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#140000',
        emissive: new THREE.Color('#ff2b2b'),
        emissiveIntensity: LIGHT_BASE,
        roughness: 0.3,
        metalness: 0,
        transparent: true,
      }),
    [],
  )

  // Stylised low-poly wedge: side profile (length × height) extruded to width.
  const bodyGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-2.0, 0.18)
    s.lineTo(2.0, 0.18)
    s.lineTo(2.0, 0.5)
    s.lineTo(0.7, 0.72)
    s.lineTo(0.15, 1.02)
    s.lineTo(-0.95, 1.02)
    s.lineTo(-2.0, 0.68)
    s.lineTo(-2.0, 0.18)
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 1.8,
      bevelEnabled: true,
      bevelSize: 0.06,
      bevelThickness: 0.06,
      bevelSegments: 2,
    })
    geo.translate(0, 0, -0.9) // centre the extrusion on width
    geo.computeVertexNormals()
    return geo
  }, [])

  // AUTO-FIT: recenter on X/Z, sit on the floor (Y), scale longest axis to
  // TARGET_LENGTH. Works identically for the real GLB later.
  useLayoutEffect(() => {
    const g = fit.current
    g.scale.setScalar(1)
    g.position.set(0, 0, 0)
    const box = new THREE.Box3().setFromObject(g)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    const s = (TARGET_LENGTH / maxDim) * FIT_ADJUST
    g.scale.setScalar(s)
    g.position.set(-center.x * s, -box.min.y * s, -center.z * s)
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

  // Tween the paint colour on every finish change (never snap).
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
      firstFlash.current = false // don't flash on mount
      return
    }
    const bars = [headlight, taillight]
    const tl = gsap.timeline()
    tl.to(bars, { emissiveIntensity: 3.4, duration: 0.1, ease: 'power2.out' })
      .to(bars, { emissiveIntensity: 0.5, duration: 0.1, ease: 'power2.in' })
      .to(bars, { emissiveIntensity: 3.4, duration: 0.1, ease: 'power2.out' })
      .to(bars, { emissiveIntensity: LIGHT_BASE, duration: 0.55, ease: 'power2.inOut' })
    return () => {
      tl.kill()
    }
  }, [flashTick, headlight, taillight])

  useFrame(() => {
    const t = scrollState.progress
    const sPos = t * (N_SLIDES - 1) // 0..(N-1) continuous slide position

    // Rotation = resting 3/4 pose + manual drag + subtle parallax.
    // No self-spin. While released, the drag offset eases gently back to rest.
    if (!drag.active) {
      drag.targetY = lerp(drag.targetY, 0, 0.03)
      drag.targetX = lerp(drag.targetX, 0, 0.03)
    }
    dragY.current = lerp(dragY.current, drag.targetY, 0.12)
    dragX.current = lerp(dragX.current, drag.targetX, 0.12)

    // Parallax toward the pointer when idle (disabled while dragging / reduced
    // motion), lerped for a soft, living feel.
    const paraTargetY = reduceMotion || drag.active ? 0 : pointer.x * PARALLAX_Y
    const paraTargetX = reduceMotion || drag.active ? 0 : pointer.y * PARALLAX_X
    paraY.current = lerp(paraY.current, paraTargetY, 0.06)
    paraX.current = lerp(paraX.current, paraTargetX, 0.06)

    outer.current.rotation.y = REST_Y + dragY.current + paraY.current
    outer.current.rotation.x = REST_X + dragX.current + paraX.current

    // Fade the car OUT as we enter Slide 5 (sPos 3.4 → 3.95), so the outro
    // shows only its own content on the clean background. Reversible & smooth
    // because it reads continuous progress.
    const fadeK = Math.min(1, Math.max(0, (sPos - FADE_START) / (FADE_END - FADE_START)))
    const carOpacity = 1 - smoothstep(fadeK)
    paint.opacity = carOpacity
    tyre.opacity = carOpacity
    rim.opacity = carOpacity
    glass.opacity = 0.85 * carOpacity
    headlight.opacity = carOpacity
    taillight.opacity = carOpacity
    outer.current.visible = carOpacity > 0.001 // fully hidden on Slide 5

    // X-position choreography — smoothly lerped between slide keyframes.
    // Centred on mobile (text stacks above/below instead of beside).
    let targetX = 0
    if (window.innerWidth >= 768) {
      const i = Math.min(N_SLIDES - 2, Math.max(0, Math.floor(sPos)))
      const f = smoothstep(sPos - i)
      targetX = lerp(CAR_X[i], CAR_X[i + 1], f)
    }
    outer.current.position.x = lerp(outer.current.position.x, targetX, 0.08)
  })

  return (
    <group
      ref={outer}
      onPointerOver={() => setCarHover(true)}
      onPointerOut={() => setCarHover(false)}
    >
      <group ref={fit}>
        {/* body */}
        <mesh geometry={bodyGeo} material={paint} />
        {/* cabin glass */}
        <mesh material={glass} position={[-0.35, 0.92, 0]}>
          <boxGeometry args={[1.55, 0.5, 1.5]} />
        </mesh>
        {/* headlights (front = +x) + rear light bar (rear = −x) */}
        <mesh material={headlight} position={[1.99, 0.5, 0.55]}>
          <boxGeometry args={[0.09, 0.16, 0.34]} />
        </mesh>
        <mesh material={headlight} position={[1.99, 0.5, -0.55]}>
          <boxGeometry args={[0.09, 0.16, 0.34]} />
        </mesh>
        <mesh material={taillight} position={[-2.0, 0.72, 0]}>
          <boxGeometry args={[0.07, 0.12, 1.5]} />
        </mesh>
        {/* four wheels (cylinders, axis along width) */}
        {(
          [
            [1.25, 0.95],
            [1.25, -0.95],
            [-1.25, 0.95],
            [-1.25, -0.95],
          ] as const
        ).map(([x, z], k) => (
          <group key={k} position={[x, 0.5, z]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh material={tyre}>
              <cylinderGeometry args={[0.5, 0.5, 0.34, 24]} />
            </mesh>
            <mesh material={rim}>
              <cylinderGeometry args={[0.28, 0.28, 0.36, 20]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}
