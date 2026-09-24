import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { TECHNIQUES, getTechnique } from '@/lib/technique/techniques'
import type { TechniqueViewerProps } from './TechniqueViewer'
import { TechniqueView } from './TechniqueView'

// jsdom has no WebGL: stand in for the viewer and hand the page a fake scene handle
let viewer: TechniqueViewerProps
const scene = {
  play: vi.fn(),
  pause: vi.fn(),
  setSpeed: vi.fn(),
  seek: vi.fn(),
  setView: vi.fn(),
  dispose: vi.fn(),
}
const DURATION = 3.4
vi.mock('./TechniqueViewer', () => ({
  TechniqueViewer: (props: TechniqueViewerProps) => {
    viewer = props
    return null
  },
}))

function openTechnique(name: string) {
  render(<TechniqueView />)
  fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }))
  act(() => viewer.onReady({ ...scene, duration: DURATION }))
}

describe('TechniqueView', () => {
  beforeEach(() => {
    Object.values(scene).forEach((fn) => fn.mockClear())
    window.scrollTo = vi.fn()
  })

  it('lists every technique with its category', () => {
    render(<TechniqueView />)
    expect(screen.getByRole('heading', { level: 1, name: 'Kỹ thuật' })).toBeInTheDocument()
    const items = within(screen.getByRole('list', { name: 'Danh sách kỹ thuật' })).getAllByRole('listitem')
    expect(items).toHaveLength(TECHNIQUES.length)
    TECHNIQUES.forEach((technique, i) => {
      expect(items[i]).toHaveTextContent(technique.name)
      expect(items[i]).toHaveTextContent(technique.category)
    })
  })

  it('opens a technique in the 3D viewer and goes back to the list', () => {
    openTechnique('Đập cầu thuận tay')
    expect(screen.getByRole('heading', { level: 1, name: 'Đập cầu thuận tay' })).toBeInTheDocument()
    expect(viewer.technique.id).toBe('smash')
    const steps = within(screen.getByRole('region', { name: 'Các bước thực hiện' })).getAllByRole('listitem')
    expect(steps).toHaveLength(getTechnique('smash').phases.length)
    expect(screen.getByText('Lỗi thường gặp')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Tất cả kỹ thuật' }))
    expect(screen.getByRole('list', { name: 'Danh sách kỹ thuật' })).toBeInTheDocument()
  })

  it('follows the animation: the step being played is highlighted with its tip', () => {
    openTechnique('Giao cầu cao thuận tay')
    const serve = getTechnique('high-serve')
    act(() => viewer.onFrame(serve.contactTime, true))

    const current = screen.getByRole('button', { current: 'step' })
    expect(current).toHaveTextContent('Tiếp xúc')
    expect(current).toHaveTextContent('1,15 m')
    expect(screen.getByText(`4/${serve.phases.length}`)).toBeInTheDocument()
    expect(screen.getByText('Luật cần nhớ')).toBeInTheDocument()
  })

  it('holds the pose of a step when it is tapped', () => {
    openTechnique('Lốp cầu thuận tay')
    fireEvent.click(screen.getByRole('button', { name: /Bước lên lưới/ }))
    expect(scene.seek).toHaveBeenCalledWith(getTechnique('net-lift').phases[1].focus)
    expect(screen.getByText('Điểm mấu chốt')).toBeInTheDocument()
  })

  it('scrubs through the motion and follows playback on the same track', () => {
    openTechnique('Đập cầu thuận tay')
    const track = screen.getByRole('slider', { name: 'Tua động tác' })
    expect(track).toHaveAttribute('max', String(DURATION))

    fireEvent.input(track, { target: { value: '1.2' } })
    expect(scene.seek).toHaveBeenCalledWith(1.2)

    act(() => viewer.onFrame(2.5, true))
    expect(track).toHaveValue('2.5')
    expect(screen.getByText('2,50 s')).toBeInTheDocument()
  })

  it('drives playback, speed and camera from the controls', () => {
    openTechnique('Giao cầu ngắn trái tay')

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
