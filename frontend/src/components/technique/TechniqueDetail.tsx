import { useCallback, useRef, useState, type RefObject } from 'react'
import { ArrowLeft, Pause, Play } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { phaseIndexAt, type Technique } from '@/lib/technique/techniques'
import type { TechniqueSceneHandle, TechniqueView } from './techniqueScene'
import { TechniqueViewer } from './TechniqueViewer'

const SPEEDS: Array<[number, string]> = [
  [1, '1×'],
  [0.5, '0.5×'],
  [0.25, '0.25×'],
]

const VIEWS: Array<[TechniqueView, string]> = [
  ['side', 'Bên cạnh'],
  ['behind', 'Phía sau'],
  ['wide', 'Toàn sân'],
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

const formatSeconds = (value: number) => `${value.toFixed(2).replace('.', ',')} s`

/**
 * Drag through the motion frame by frame. Step boundaries and the moment of contact are marked
 * on the track; the thumb follows playback without re-rendering React every frame.
 */
function Scrubber({
  technique,
  duration,
  inputRef,
  readoutRef,
  onSeek,
}: {
  technique: Technique
  duration: number
  inputRef: RefObject<HTMLInputElement | null>
  readoutRef: RefObject<HTMLSpanElement | null>
  onSeek: (time: number) => void
}) {
  const at = (time: number) => `${(Math.min(time, duration) / duration) * 100}%`
  return (
    <div className="flex items-center gap-3 border-t border-white/10 bg-[#05070a] px-3 py-1.5">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="range"
          min={0}
          max={duration}
          step={0.01}
          defaultValue={0}
          onInput={(event) => onSeek(Number(event.currentTarget.value))}
          aria-label="Tua động tác"
          aria-describedby="scrubber-hint"
          className="relative block h-11 w-full cursor-pointer accent-[#c8ff3d]"
        />
        {/* Drawn over the track so the played part does not hide them; touches pass through */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[9px] top-1/2 h-3 -translate-y-1/2">
          {technique.phases.slice(1).map((phase) => (
            <span key={phase.id} className="absolute top-0 h-3 w-px bg-[#05070a]/70" style={{ left: at(phase.start) }} />
          ))}
          <span
            className="absolute -top-0.5 h-4 w-1 -translate-x-1/2 rounded-full bg-white ring-2 ring-[#05070a]"
            style={{ left: at(technique.contactTime) }}
          />
        </div>
        <span id="scrubber-hint" className="sr-only">
          Vạch trắng là lúc vợt chạm cầu
        </span>
      </div>
      <span ref={readoutRef} className="w-14 shrink-0 text-right font-mono text-xs tabular-nums text-[#e8ece9]/70">
        {formatSeconds(0)}
      </span>
    </div>
  )
}

function NoteList({ title, items, tone }: { title: string; items: string[]; tone: 'accent' | 'danger' }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <h2 className="text-sm font-bold text-fg">{title}</h2>
      <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-fg-muted">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true" className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${tone === 'accent' ? 'bg-accent' : 'bg-danger'}`} />
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function TechniqueDetail({ technique, onBack }: { technique: Technique; onBack: () => void }) {
  const sceneRef = useRef<TechniqueSceneHandle | null>(null)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [view, setView] = useState<TechniqueView>('side')
  const [ready, setReady] = useState(false)
  const [duration, setDuration] = useState(0)
  const [touched, setTouched] = useState(false)
  const scrubRef = useRef<HTMLInputElement>(null)
  const readoutRef = useRef<HTMLSpanElement>(null)
  // Mirrors of the rendered values so the per-frame callback only sets state on real changes
  const shown = useRef({ phaseIndex: 0, playing: true })
  const speedRef = useRef(speed)
  const viewRef = useRef(view)

  const handleReady = useCallback((handle: TechniqueSceneHandle | null) => {
    sceneRef.current = handle
    setReady(handle !== null)
    setDuration(handle?.duration ?? 0)
    // A fresh scene starts at the requested speed and camera
    if (handle) {
      handle.setSpeed(speedRef.current)
      if (viewRef.current !== 'side') handle.setView(viewRef.current)
    }
  }, [])

  const handleFrame = useCallback(
    (time: number, isPlaying: boolean) => {
      // Direct DOM writes: this runs every frame
      if (scrubRef.current) scrubRef.current.value = String(time)
      if (readoutRef.current) readoutRef.current.textContent = formatSeconds(time)
      const index = phaseIndexAt(technique, time)
      if (index !== shown.current.phaseIndex) {
        shown.current.phaseIndex = index
        setPhaseIndex(index)
      }
      if (isPlaying !== shown.current.playing) {
        shown.current.playing = isPlaying
        setPlaying(isPlaying)
      }
    },
    [technique]
  )

  const togglePlay = () => {
    if (playing) sceneRef.current?.pause()
    else sceneRef.current?.play()
  }

  const changeSpeed = (value: number) => {
    setSpeed(value)
    speedRef.current = value
    sceneRef.current?.setSpeed(value)
  }

  const changeView = (value: TechniqueView) => {
    setView(value)
    viewRef.current = value
    sceneRef.current?.setView(value)
  }

  const showStep = (index: number) => {
    sceneRef.current?.seek(technique.phases[index].focus)
  }

  const seek = (time: number) => sceneRef.current?.seek(time)

  const phase = technique.phases[phaseIndex]

  return (
    <div className="space-y-4 pb-24">
      <button
        type="button"
        onClick={onBack}
        className="-ml-2 flex min-h-[44px] items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-fg-muted transition-colors hover:text-fg cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Tất cả kỹ thuật
      </button>
      <PageHeader title={technique.name} description={technique.summary} />

      <div className="relative overflow-hidden rounded-3xl border border-line bg-canvas" onPointerDown={() => setTouched(true)}>
        <TechniqueViewer
          technique={technique}
          onReady={handleReady}
          onFrame={handleFrame}
          className="aspect-[4/5] w-full sm:aspect-video"
        />
        {ready && !touched && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-[#05070a]/75 px-3 py-1.5 text-xs text-[#e8ece9]/80 backdrop-blur"
          >
            Kéo để xoay · chụm hai ngón để phóng to
          </div>
        )}
        {ready && duration > 0 && (
          <Scrubber technique={technique} duration={duration} inputRef={scrubRef} readoutRef={readoutRef} onSeek={seek} />
        )}
        <div
          aria-live="polite"
          className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-[#05070a]/75 px-3 py-1.5 text-xs font-semibold text-[#e8ece9] backdrop-blur"
        >
          <span className="font-mono text-[#c8ff3d]">
            {phaseIndex + 1}/{technique.phases.length}
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

      <section aria-label="Các bước thực hiện">
        <ol className="space-y-2">
          {technique.phases.map((step, index) => {
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

      <NoteList title={technique.category === 'Giao cầu' ? 'Luật cần nhớ' : 'Điểm mấu chốt'} items={technique.keyPoints} tone="accent" />
      <NoteList title="Lỗi thường gặp" items={technique.mistakes} tone="danger" />
    </div>
  )
}
