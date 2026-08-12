import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
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

// ── DARK STUDIO ENVIRONMENT ────────────────────────────────────
// Hand-built moody studio instead of the milky `preset="studio"` HDRI: a
// near-black base with a few bright emissive panels (Lightformers) baked into a
// cubemap. Those panels ARE the long highlight streaks you see sliding over the
// clearcoat as the car turns — the thing that makes the paint read as paint.
// It also loads nothing over the network (the preset fetches an HDR from a CDN).
//
// To go back to the HDRI at any point, swap this whole component for:
//   <Environment preset="studio" background={false} />
//
// frames={1} bakes the cubemap once. The two accent panels read `finish`, so a
// colour change re-renders this component and re-bakes exactly one frame —
// the studio glow picks up a hint of the active paint (ambient tint sync).
const STUDIO_INTENSITY = 1.15 // overall reflection brightness
function StudioEnvironment() {
  const finish = useConfig((s) => s.finish)
  return (
    <Environment
      resolution={256}
      frames={1}
      background={false}
      environmentIntensity={STUDIO_INTENSITY}
    >
      {/* near-black studio void — keeps the env moody, not grey */}
      <color attach="background" args={['#05050a']} />

      {/* overhead softbox running along the car's length: the highlight that
          slides down the roof and bonnet */}
      <Lightformer
        form="rect"
        intensity={5}
        color="#ffffff"
        position={[0, 6, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[3.2, 14, 1]}
      />
      {/* two long side tubes — classic car-studio flank reflections. No
          rotation prop, so Lightformer aims them at the origin for us. */}
      <Lightformer
        form="rect"
        intensity={3.2}
        color="#cddcff"
        position={[-6, 2.6, 1]}
        scale={[14, 1.3, 1]}
      />
      <Lightformer
        form="rect"
        intensity={2.6}
        color="#cddcff"
        position={[6, 2.2, -1.5]}
        scale={[14, 1.1, 1]}
      />
      {/* accent-tinted kickers front + rear — follow the active finish */}
      <Lightformer
        form="circle"
        intensity={2.2}
        color={finish.hex}
        position={[-4.5, 1.2, -6]}
        scale={4}
      />
      <Lightformer
        form="circle"
        intensity={1.3}
        color={finish.hex}
        position={[5, 0.7, 5.5]}
        scale={3}
      />
      {/* dim cool bounce from below so the sills aren't pure black */}
      <Lightformer
        form="rect"
        intensity={0.5}
        color="#39404f"
        position={[0, -4, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[14, 14, 1]}
      />
    </Environment>
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
        {/* Moody key/fill/rim set. The hemisphere fill stays low so the studio
            panels (see StudioEnvironment) do the modelling, not flat ambient. */}
        <hemisphereLight intensity={0.22} color="#ffffff" groundColor="#0b0b0d" />
        <directionalLight position={[4, 7, 5]} intensity={2} />
        {/* cool counter-rim from the far side — separates the car's shoulder
            line from the dark background */}
        <directionalLight position={[3, 1.6, -5.5]} intensity={0.9} color="#9fb6ff" />
        <RimLight />

        <Suspense fallback={null}>
          {/* Reflections ONLY (sets scene.environment). background={false} so
              the studio never renders as a visible backdrop — the car sits on
              the page's plain --carbon via the transparent canvas. */}
          <StudioEnvironment />
          <CarModel />
          <Stage reflective={desktop} />
        </Suspense>

        <CameraRig />
      </Canvas>
    </div>
  )
}
