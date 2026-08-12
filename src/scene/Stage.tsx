import { useEffect, useMemo } from 'react'
import { ContactShadows, MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'

// ── FLOOR TUNING SEAMS ─────────────────────────────────────────
// A dark, mirror-like ground plane under the car: MeshReflectorMaterial
// re-renders the scene from a mirrored camera, so the car (and its lights)
// reflect properly instead of being faked with a gradient.
const FLOOR_SIZE = 26 // world units — wide enough for the slide-2/3 car x offsets
const MIRROR = 0.68 // 0 = matte, 1 = full mirror
const BLUR: [number, number] = [400, 140] // [x, y] reflection blur — y > x = vertical smear
const MIX_STRENGTH = 32 // reflection brightness
const CENTRE_ALPHA = 0.94 // floor opacity under the car (fades to 0 at the disc edge)
const REFLECTOR_RES = 1024 // reflection render-target size (desktop only)
// ───────────────────────────────────────────────────────────────

// Radial greyscale ramp used as the floor's alphaMap, so the plane dissolves
// into the page's --carbon background instead of ending on a hard rectangle
// edge (which would read as a grey box over the DOM watermark).
// NOTE: three samples alphaMap's GREEN channel, so the fade must be baked as
// white→black RGB — not as canvas alpha.
function useFloorFade() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    const v = Math.round(CENTRE_ALPHA * 255)
    g.addColorStop(0, `rgb(${v},${v},${v})`)
    g.addColorStop(0.45, `rgb(${v * 0.8},${v * 0.8},${v * 0.8})`)
    g.addColorStop(1, 'rgb(0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    return new THREE.CanvasTexture(c)
  }, [])
  useEffect(() => () => tex.dispose(), [tex])
  return tex
}

// `reflective` is false on mobile/tablet (<1024px): the mirror pass costs an
// extra full scene render, so small screens keep the cheap ContactShadow only.
export default function Stage({ reflective = true }: { reflective?: boolean }) {
  const fade = useFloorFade()

  return (
    <>
      {reflective && (
        // depthWrite:false + renderOrder -10 keeps this transparent plane from
        // sorting in front of the car's (also transparent) materials.
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.002, 0]}
          renderOrder={-10}
        >
          <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
          <MeshReflectorMaterial
            resolution={REFLECTOR_RES}
            mirror={MIRROR}
            blur={BLUR}
            mixBlur={1.1}
            mixStrength={MIX_STRENGTH}
            mixContrast={1.1}
            depthScale={1.1} // fade the reflection with distance from the car
            minDepthThreshold={0.35}
            maxDepthThreshold={1.5}
            color="#0b0b0d" // matches --carbon so the floor melts into the page
            metalness={0.7}
            roughness={0.9}
            transparent
            alphaMap={fade}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Contact shadow keeps the tyres visually planted on the mirror. */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.55}
        scale={12}
        blur={3}
        far={4}
        resolution={512}
        color="#000000"
      />
    </>
  )
}
