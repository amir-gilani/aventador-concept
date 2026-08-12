import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import CarModel from './CarModel'
import Stage from './Stage'
import { scrollState } from './useScrollProgress'
import { useConfig } from '../store/useConfig'

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// ── Camera tuning seam ─────────────────────────────────────────
// Start [4.4, 1.7, 6.2]; dollies in as you scroll (z −1.6, y −0.7).
const CAM_X = 4.4
function CameraRig() {
  const { camera } = useThree()
  useFrame(() => {
    const t = scrollState.progress
    // On phones pull the camera back and reduce the side angle so the car reads
    // smaller and centred, leaving room for the stacked text.
    const mobile = window.innerWidth < 1024 // small-screen framing for mobile + tablet
    const baseZ = mobile ? 13.5 : 6.2
    camera.position.x = lerp(camera.position.x, mobile ? 3.4 : CAM_X, 0.07)
    camera.position.y = lerp(camera.position.y, 1.7 - t * 0.7, 0.07)
    camera.position.z = lerp(camera.position.z, baseZ - t * 1.6, 0.07)
    // look lower on mobile so the car sits HIGHER in the frame (room for the
    // wordmark + text below it)
    camera.lookAt(mobile ? -0.3 : 0, mobile ? -1.9 : 0.55, 0)
  })
  return null
}

// Accent-tinted rim light — colour tweens with the active finish.
function RimLight() {
  const ref = useRef<THREE.DirectionalLight>(null!)
  const finish = useConfig((s) => s.finish)
  useEffect(() => {
    if (!ref.current) return
    const target = new THREE.Color(finish.hex)
    const tw = gsap.to(ref.current.color, {
      r: target.r,
      g: target.g,
      b: target.b,
      duration: 0.6,
      ease: 'power2.out',
    })
    return () => {
      tw.kill()
    }
  }, [finish.hex])
  return (
    <directionalLight
      ref={ref}
      position={[-3, 2, -6]}
      intensity={2.4}
      color={finish.hex}
    />
  )
}

export default function Experience() {
  const [desktop, setDesktop] = useState(true)
  useEffect(() => {
    const update = () => setDesktop(window.innerWidth >= 1024)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    // ── STACKING CONTRACT ──────────────────────────────────────────
    // Fixed, full-screen, z-index:10. It sits ABOVE the hero wordmark (z-0)
    // and BELOW all foreground UI (z-20+). pointer-events:auto so the canvas
    // receives click-drag to rotate the car; because every UI control sits at
    // z-20 above it, the canvas only gets pointerdowns on empty scene / the
    // car (see scene/interaction.ts, keyed on [data-drag-surface]).
    // The canvas is fully TRANSPARENT (alpha:true + clear alpha 0, and NO
    // postprocessing — EffectComposer outputs an opaque buffer that would
    // cover the DOM), so it never paints over the wordmark or the UI.
    // ───────────────────────────────────────────────────────────────
    <div
      className="fixed inset-0"
      style={{ zIndex: 10, pointerEvents: 'auto' }}
      data-drag-surface
    >
      <Canvas
        style={{ pointerEvents: 'auto', background: 'transparent' }}
        dpr={[1, desktop ? 2 : 1.5]}
        gl={{ antialias: true, alpha: true, premultipliedAlpha: false }}
        camera={{ fov: 38, position: [CAM_X, 1.7, 6.2], near: 0.1, far: 100 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
          gl.setClearColor(0x000000, 0) // fully transparent clear — no opaque fill
          gl.setClearAlpha(0)
        }}
      >
        {/* dim hemisphere fill + key + accent rim */}
        <hemisphereLight intensity={0.35} color="#ffffff" groundColor="#0b0b0d" />
        <directionalLight position={[4, 7, 5]} intensity={2} />
        <RimLight />

        <Suspense fallback={null}>
          {/* Reflections ONLY (sets scene.environment). background={false} so
              the studio HDR never renders as a visible backdrop — the car sits
              on the page's plain --carbon via the transparent canvas. */}
          <Environment preset="studio" background={false} />
          <CarModel />
          <Stage reflective={desktop} />
        </Suspense>

        <CameraRig />
      </Canvas>
    </div>
  )
}
