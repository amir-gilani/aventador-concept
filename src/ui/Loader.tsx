import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'

// Carbon overlay (z-50) with load percent; fades out when assets are ready.
// A hard 5s safety timeout hides it even if an asset (e.g. the Environment
// HDR) never resolves, so the site is never stuck behind the loader.
export default function Loader() {
  const { active, progress } = useProgress()
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (!active && progress >= 100) {
      const t = setTimeout(() => setHidden(true), 500)
      return () => clearTimeout(t)
    }
  }, [active, progress])

  useEffect(() => {
    const safety = setTimeout(() => setHidden(true), 5000)
    return () => clearTimeout(safety)
  }, [])

  if (hidden) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-carbon transition-opacity duration-500"
      style={{ opacity: !active && progress >= 100 ? 0 : 1 }}
    >
      <div className="flex flex-col items-center gap-3 font-mono text-xs tracking-data text-lo">
        <span>INITIALISING</span>
        <span className="text-hi">{Math.round(progress)}%</span>
      </div>
    </div>
  )
}
