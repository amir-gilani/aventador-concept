import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

type Dir = 'left' | 'right' | 'up'
const OFFSET = 90 // how far a slide-in travels (px)

// Reveals any [data-reveal] children of the returned ref when the section
// scrolls into view (stagger 0.1). Each item slides in from a direction:
//  - pass a section default via useReveal('left' | 'right' | 'up')
//  - or override per element with data-reveal-dir="left|right|up"
// Replays every time the section re-enters, so nothing sits static / just pops.
// Skipped under prefers-reduced-motion.
export function useReveal<T extends HTMLElement>(dir: Dir = 'up') {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const items = el.querySelectorAll('[data-reveal]')
    if (items.length === 0) return

    const dirOf = (t: Element): Dir => {
      const d = (t as HTMLElement).dataset.revealDir
      return d === 'left' || d === 'right' || d === 'up' ? d : dir
    }

    const ctx = gsap.context(() => {
      gsap.from(items, {
        x: (_i, t) => {
          const d = dirOf(t as Element)
          return d === 'left' ? -OFFSET : d === 'right' ? OFFSET : 0
        },
        y: (_i, t) => (dirOf(t as Element) === 'up' ? 40 : 0),
        opacity: 0,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: el,
          start: 'top 65%',
          // replay on each entry (and reset when scrolled back above)
          toggleActions: 'restart none none reset',
        },
      })
    }, el)
    return () => ctx.revert()
  }, [dir])
  return ref
}
