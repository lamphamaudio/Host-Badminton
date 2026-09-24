import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { TECHNIQUES, getTechnique, type Technique, type TechniqueId } from '@/lib/technique/techniques'
import { TechniqueDetail } from './TechniqueDetail'

/** Court frame (metres) to the diagram's 0.1 m grid: x runs left to right, z top to bottom */
const toSvg = (x: number, z: number): [number, number] => [(x + 6.7) * 10, (z + 3.05) * 10]

/** Top-down court with the player's spot and the shot they make */
function ShotDiagram({ technique }: { technique: Technique }) {
  const [px, py] = toSvg(technique.position[0], technique.position[2])
  const [tx, ty] = toSvg(technique.target[0], technique.target[2])
  // Bow the path sideways a little so it reads as a flight, not a ruler line
  const cx = (px + tx) / 2
  const cy = (py + ty) / 2 - 7
  const incoming = technique.shuttle.kind === 'incoming' ? toSvg(technique.shuttle.from[0], technique.shuttle.from[2]) : null

  return (
    <svg viewBox="-2 -2 138 65" className="h-auto w-full" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="0.8" className="text-line-strong">
        <rect x="0" y="0" width="134" height="61" rx="1" className="fill-raised" />
        {/* Singles sidelines, short service lines, centre lines and doubles long service lines */}
        <path d="M0 4.6H134M0 56.4H134M47.2 0V61M86.8 0V61M0 30.5H47.2M86.8 30.5H134M7.6 0V61M126.4 0V61" />
      </g>
      <line x1="67" y1="-2" x2="67" y2="63" stroke="currentColor" strokeWidth="1.6" className="text-fg-subtle" />
      {incoming && (
        <path
          d={`M${incoming[0]} ${incoming[1]} L${px} ${py}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="2.5 2.5"
          className="text-fg-subtle"
        />
      )}
      <path d={`M${px} ${py} Q${cx} ${cy} ${tx} ${ty}`} fill="none" stroke="currentColor" strokeWidth="1.8" className="text-accent" />
      <circle cx={tx} cy={ty} r="2.6" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-accent" />
      <circle cx={px} cy={py} r="3" fill="currentColor" className="text-fg" />
    </svg>
  )
}

function TechniqueCard({ technique, onOpen }: { technique: Technique; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left shadow-sm transition-colors hover:border-line-strong active:bg-raised cursor-pointer"
    >
      <div className="w-[88px] shrink-0 overflow-hidden rounded-lg">
        <ShotDiagram technique={technique} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-accent">{technique.category}</span>
          <span className="text-fg-subtle">{technique.level}</span>
        </div>
        <h3 className="mt-1 text-[15px] font-bold leading-snug text-fg">{technique.name}</h3>
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-fg-muted">{technique.summary}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-fg-subtle" />
    </button>
  )
}

export function TechniqueView() {
  const [openId, setOpenId] = useState<TechniqueId | null>(null)

  const open = (id: TechniqueId | null) => {
    setOpenId(id)
    window.scrollTo({ top: 0 })
  }

  if (openId) {
    // Keyed so a different technique starts from a fresh timeline and scene
    return <TechniqueDetail key={openId} technique={getTechnique(openId)} onBack={() => open(null)} />
  }

  return (
    <div className="space-y-4 pb-24">
      <PageHeader title="Kỹ thuật" description="Chọn một kỹ thuật để xem từng bước trên sân 3D." />
      <ul aria-label="Danh sách kỹ thuật" className="space-y-2.5">
        {TECHNIQUES.map((technique) => (
          <li key={technique.id}>
            <TechniqueCard technique={technique} onOpen={() => open(technique.id)} />
          </li>
        ))}
      </ul>
    </div>
  )
}
