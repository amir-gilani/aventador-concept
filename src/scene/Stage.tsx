import { ContactShadows } from '@react-three/drei'

// No floor plane, no reflective disc, no glow — the car sits on the page's
// plain --carbon background (canvas is transparent). Only a soft ContactShadow
// directly under the car keeps it feeling grounded.
// `reflective` is accepted for API compatibility but no longer used.
export default function Stage(_props: { reflective?: boolean }) {
  return (
    <ContactShadows
      position={[0, 0, 0]}
      opacity={0.5}
      scale={12}
      blur={3}
      far={4}
      resolution={512}
      color="#000000"
    />
  )
}
