import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Reveals any [data-reveal] children of the returned ref when the section
// scrolls into view (stagger 0.1). Skipped under prefers-reduced-motion.
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const items = el.querySelectorAll('[data-reveal]')
    if (items.length === 0) return
    const ctx = gsap.context(() => {
      gsap.from(items, {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 65%' },
      })
    }, el)
    return () => ctx.revert()
  }, [])
  return ref
}
