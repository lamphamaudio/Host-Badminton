import { useEffect, useRef, useState } from 'react'
import type { CourtSceneHandle } from './courtScene'

function supportsWebGL(): boolean {
  try {
    const probe = document.createElement('canvas')
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * Fixed full-viewport 3D court behind the page. The three.js scene is lazily imported so
 * the classic landing and the app never download it; without WebGL a static gradient shows.
 */
export function CourtCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fallback, setFallback] = useState(() => !supportsWebGL())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || fallback) return

    let handle: CourtSceneHandle | null = null
    let cancelled = false
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const readProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      return scrollable > 0 ? window.scrollY / scrollable : 0
    }
    const handleScroll = () => handle?.setProgress(readProgress())
    const handlePointer = (event: PointerEvent) => {
      handle?.setPointer(
        (event.clientX / window.innerWidth) * 2 - 1,
        -((event.clientY / window.innerHeight) * 2 - 1)
      )
    }

    import('./courtScene')
      .then(({ createCourtScene }) => {
        // StrictMode mounts twice; never build a scene for an unmounted canvas
        if (cancelled) return
        handle = createCourtScene(canvas, { reducedMotion })
        handle.setProgress(readProgress())
      })
      .catch(() => setFallback(true))

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('pointermove', handlePointer, { passive: true })
    return () => {
      cancelled = true
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('pointermove', handlePointer)
      handle?.dispose()
    }
  }, [fallback])

  return (
    <div aria-hidden="true" className="fixed inset-0 z-0">
      {fallback ? (
        <div className="h-full w-full bg-[radial-gradient(ellipse_at_50%_30%,#1b2a1f_0%,#05070a_65%)]" />
      ) : (
        <canvas ref={canvasRef} className="block h-full w-full" />
      )}
    </div>
  )
}
