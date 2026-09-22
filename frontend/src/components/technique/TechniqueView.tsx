import { useCallback, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { MAX_SERVE_HEIGHT, SERVE_PHASES, phaseIndexAt } from '@/lib/technique/serve'
import type { ServeSceneHandle, ServeView } from './serveScene'
import { ServeViewer } from './ServeViewer'

const SPEEDS: Array<[number, string]> = [
  [1, '1×'],
  [0.5, '0.5×'],
  [0.25, '0.25×'],
]

const VIEWS: Array<[ServeView, string]> = [
  ['side', 'Bên cạnh'],
  ['behind', 'Phía sau'],
  ['wide', 'Toàn sân'],
]

const RULES = [
  'Giao cầu chéo sân, sang ô đối diện.',
  `Lúc vợt chạm cầu, toàn bộ quả cầu phải thấp hơn ${MAX_SERVE_HEIGHT.toLocaleString('vi-VN')} m so với mặt sân.`,
  'Hai chân chạm sân và đứng yên từ lúc chuẩn bị cho tới khi giao cầu xong.',
]

function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<[T, string]>
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-flow-col auto-cols-fr gap-1 rounded-xl border border-line bg-raised p-1">
      {options.map(([option, text]) => (
        <button
          key={String(option)}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={`min-h-[40px] whitespace-nowrap rounded-lg px-2 text-[13px] font-semibold transition-colors cursor-pointer ${
            value === option ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

export function TechniqueView() {
  const sceneRef = useRef<ServeSceneHandle | null>(null)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [view, setView] = useState<ServeView>('side')
  const [ready, setReady] = useState(false)
  // Mirrors of the rendered values so the per-frame callback only sets state on real changes
  const shown = useRef({ phaseIndex: 0, playing: true })

  const handleReady = useCallback((handle: ServeSceneHandle | null) => {
    sceneRef.current = handle
    setReady(handle !== null)
  }, [])

  const handleFrame = useCallback((time: number, isPlaying: boolean) => {
    const index = phaseIndexAt(time)
    if (index !== shown.current.phaseIndex) {
      shown.current.phaseIndex = index
      setPhaseIndex(index)
    }
    if (isPlaying !== shown.current.playing) {
      shown.current.playing = isPlaying
      setPlaying(isPlaying)
    }
  }, [])

  const togglePlay = () => {
    if (playing) sceneRef.current?.pause()
    else sceneRef.current?.play()
  }

  const changeSpeed = (value: number) => {
    setSpeed(value)
    sceneRef.current?.setSpeed(value)
  }

  const changeView = (value: ServeView) => {
    setView(value)
    sceneRef.current?.setView(value)
  }

  const showStep = (index: number) => {
    sceneRef.current?.seek(SERVE_PHASES[index].focus)
  }

  const phase = SERVE_PHASES[phaseIndex]

  return (
    <div className="space-y-4 pb-24">
      <PageHeader title="Kỹ thuật" description="Giao cầu cao thuận tay, xem từng bước trên sân 3D." />

      <div className="relative overflow-hidden rounded-3xl border border-line bg-canvas">
        <ServeViewer onReady={handleReady} onFrame={handleFrame} className="aspect-[4/5] w-full sm:aspect-video" />
        <div
          aria-live="polite"
          className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-[#05070a]/75 px-3 py-1.5 text-xs font-semibold text-[#e8ece9] backdrop-blur"
        >
          <span className="font-mono text-[#c8ff3d]">
            {phaseIndex + 1}/{SERVE_PHASES.length}
          </span>{' '}
          · {phase.title}
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={togglePlay}
            disabled={!ready}
            aria-label={playing ? 'Tạm dừng' : 'Phát'}
            className="flex h-11 w-11 min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-volt text-ink transition hover:bg-volt-hover active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <div className="flex-1">
            <Segmented label="Tốc độ phát" options={SPEEDS} value={speed} onChange={changeSpeed} />
          </div>
        </div>
        <Segmented label="Góc nhìn" options={VIEWS} value={view} onChange={changeView} />
      </div>

      <section aria-label="Các bước giao cầu">
        <ol className="space-y-2">
          {SERVE_PHASES.map((step, index) => {
            const active = index === phaseIndex
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => showStep(index)}
                  aria-current={active ? 'step' : undefined}
                  className={`w-full rounded-2xl border p-3.5 text-left transition-colors cursor-pointer ${
                    active ? 'border-accent/50 bg-accent/10' : 'border-line bg-surface hover:border-line-strong'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                        active ? 'bg-volt text-ink' : 'bg-raised text-fg-muted'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className={`text-sm font-bold ${active ? 'text-fg' : 'text-fg-muted'}`}>{step.title}</span>
                  </div>
                  {active && <p className="mt-2 pl-10 text-sm leading-relaxed text-fg">{step.tip}</p>}
                </button>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-sm font-bold text-fg">Luật cần nhớ</h2>
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-fg-muted">
          {RULES.map((rule) => (
            <li key={rule} className="flex gap-2">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {rule}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
