import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import Experience from './scene/Experience'
import Loader from './ui/Loader'
import Hero from './ui/Hero'
import Slide2Performance from './ui/Slide2Performance'
import Slide3Dimensions from './ui/Slide3Dimensions'
import Slide4Limited from './ui/Slide4Limited'
import Outro from './ui/Outro'
import CartDrawer from './ui/CartDrawer'
import SlideFrame from './ui/SlideFrame'
import { initSectionSnap } from './scroll/sectionSnap'
import { initCarInteraction } from './scene/interaction'
import { scrollState } from './scene/useScrollProgress'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  // ─── Lenis smooth scroll ↔ ScrollTrigger sync (exact snippet) ────
  useEffect(() => {
    const lenis = new Lenis()
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (t: number) => lenis.raf(t * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    // Feed continuous scroll progress (0..1) to the scene — read every frame
    // by the car + camera, so rotation stays smooth through snap transitions.
    lenis.on('scroll', ({ scroll, limit }: { scroll: number; limit: number }) => {
      scrollState.progress = limit > 0 ? Math.min(1, Math.max(0, scroll / limit)) : 0
    })

    // Full-page 5-slide section snapping, driven through this same Lenis.
    const cleanupSnap = initSectionSnap(lenis)

    // Drag-to-rotate + pointer parallax for the car (window-level listeners).
    const cleanupCar = initCarInteraction()

    return () => {
      cleanupSnap()
      cleanupCar()
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [])

  return (
    <>
      {/* z-50 loader overlay */}
      <Loader />

      {/* z-10 fixed full-screen canvas (car + stage), pointer-events none */}
      <Experience />

      {/* DOM slides create the scroll height. Sections are relative with no
          z-index (so they don't isolate): the hero wordmark can sit on z-0
          BEHIND the canvas while all other content sits on z-20 ABOVE it.
          Each root section is a [data-snap] 100vh panel — see scroll/sectionSnap. */}
      <main className="relative">
        <Hero />
        <Slide3Dimensions />
        <Slide2Performance />
        <Slide4Limited />
        <Outro />
      </main>

      {/* z-40 accent frame around slides 1–4 (fades out on the Outro) */}
      <SlideFrame />

      {/* z-[60] cart drawer — slides in over everything */}
      <CartDrawer />
    </>
  )
}
