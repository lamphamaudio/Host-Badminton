import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { CONTACT_TIME, SERVE_PHASES } from '@/lib/technique/serve'
import type { ServeViewerProps } from './ServeViewer'
import { TechniqueView } from './TechniqueView'

// jsdom has no WebGL: stand in for the viewer and hand the page a fake scene handle
let viewer: ServeViewerProps
const scene = {
  play: vi.fn(),
  pause: vi.fn(),
  setSpeed: vi.fn(),
  seek: vi.fn(),
  setView: vi.fn(),
  dispose: vi.fn(),
}
vi.mock('./ServeViewer', () => ({
  ServeViewer: (props: ServeViewerProps) => {
    viewer = props
    return null
  },
}))

function renderReady() {
  render(<TechniqueView />)
  act(() => viewer.onReady(scene))
}

describe('TechniqueView', () => {
  beforeEach(() => {
    Object.values(scene).forEach((fn) => fn.mockClear())
  })

  it('lists the five serve steps in coaching order', () => {
    renderReady()
    expect(screen.getByRole('heading', { level: 1, name: 'Kỹ thuật' })).toBeInTheDocument()
    const steps = within(screen.getByRole('region', { name: 'Các bước giao cầu' })).getAllByRole('listitem')
    expect(steps.map((s) => s.textContent)).toEqual(
      SERVE_PHASES.map((p, i) => expect.stringContaining(`${i + 1}${p.title}`))
    )
  })

  it('follows the animation: the step being played is highlighted with its tip', () => {
    renderReady()
    act(() => viewer.onFrame(CONTACT_TIME, true))

    const current = screen.getByRole('button', { current: 'step' })
    expect(current).toHaveTextContent('Tiếp xúc')
    expect(current).toHaveTextContent('1,15 m')
    expect(screen.getByText('4/5')).toBeInTheDocument()
  })

  it('holds the pose of a step when it is tapped', () => {
    renderReady()
    fireEvent.click(screen.getByRole('button', { name: /Vung vợt/ }))
    expect(scene.seek).toHaveBeenCalledWith(SERVE_PHASES[2].focus)
  })

  it('drives playback, speed and camera from the controls', () => {
    renderReady()

    fireEvent.click(screen.getByRole('button', { name: 'Tạm dừng' }))
    expect(scene.pause).toHaveBeenCalled()
    // The scene reports it stopped, so the button offers play
    act(() => viewer.onFrame(0.2, false))
    fireEvent.click(screen.getByRole('button', { name: 'Phát' }))
    expect(scene.play).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('radio', { name: '0.25×' }))
    expect(scene.setSpeed).toHaveBeenCalledWith(0.25)

    fireEvent.click(screen.getByRole('radio', { name: 'Toàn sân' }))
    expect(scene.setView).toHaveBeenCalledWith('wide')
    expect(screen.getByRole('radio', { name: 'Toàn sân' })).toHaveAttribute('aria-checked', 'true')
  })
})
