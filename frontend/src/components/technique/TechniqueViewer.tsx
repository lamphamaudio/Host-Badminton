import { useEffect, useRef, useState } from 'react'
import type { Technique } from '@/lib/technique/techniques'
import type { TechniqueSceneHandle } from './techniqueScene'

export interface TechniqueViewerProps {
  technique: Technique
  /** Receives the scene controls once three.js has loaded, and null on unmount */
  onReady: (handle: TechniqueSceneHandle | null) => void
  onFrame: (time: number, playing: boolean) => void
  className?: string
}

function supportsWebGL(): boolean {
  try {
    const probe = document.createElement('canvas')
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * Touch-orbitable 3D technique. The scene is lazily imported so three.js only downloads
 * when a technique is opened.
 */
export function TechniqueViewer({ technique, onReady, onFrame, className }: TechniqueViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fallback, setFallback] = useState(() => !supportsWebGL())
  const [loading, setLoading] = useState(true)
  // Latest callbacks without rebuilding the scene when the parent re-renders
  const onFrameRef = useRef(onFrame)
  const onReadyRef = useRef(onReady)
  useEffect(() => {
    onFrameRef.current = onFrame
    onReadyRef.current = onReady
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || fallback) return

    let handle: TechniqueSceneHandle | null = null
    let cancelled = false
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    import('./techniqueScene')
      .then(({ createTechniqueScene }) => {
        // StrictMode mounts twice; never build a scene for an unmounted canvas
        if (cancelled) return
        handle = createTechniqueScene(canvas, {
          technique,
          reducedMotion,
          onFrame: (time, playing) => onFrameRef.current(time, playing),
        })
        setLoading(false)
        onReadyRef.current(handle)
      })
      .catch(() => setFallback(true))

    return () => {
      cancelled = true
      onReadyRef.current(null)
      handle?.dispose()
    }
  }, [fallback, technique])

  if (fallback) {
    return (
      <div className={`flex items-center justify-center bg-raised p-6 text-center text-sm text-fg-muted ${className ?? ''}`}>
        Thiết bị này không hỗ trợ hiển thị 3D (WebGL). Bạn vẫn có thể đọc hướng dẫn từng bước bên dưới.
      </div>
    )
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      {/* touch-none hands pinch and drag to the orbit controls instead of scrolling the page */}
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        aria-label={`Mô phỏng 3D động tác ${technique.name.toLowerCase()}. Kéo để xoay, chụm hai ngón để phóng to.`}
        role="img"
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-fg-muted">
          Đang dựng sân 3D…
        </div>
      )}
    </div>
  )
}
