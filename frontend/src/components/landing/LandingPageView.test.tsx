import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LandingPageView } from './LandingPageView'

// jsdom has no WebGL; the 3D court is covered by the browser run, not unit tests
vi.mock('./CourtCanvas', () => ({ CourtCanvas: () => null }))

function renderView(overrides: Partial<React.ComponentProps<typeof LandingPageView>> = {}) {
  const props = {
    onEnterApp: vi.fn(),
    onOpenLogin: vi.fn(),
    isAuthenticated: false,
    ...overrides,
  }
  render(<LandingPageView {...props} />)
  return props
}

describe('LandingPageView', () => {
  it('renders the hero and routes its calls to action', () => {
    const props = renderView()

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hết giờ sân.')
    fireEvent.click(screen.getByRole('button', { name: /Vào sân ngay/ }))
    expect(props.onEnterApp).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(props.onOpenLogin).toHaveBeenCalledTimes(1)
  })

  it('greets a signed-in host and sends them into the app', () => {
    const props = renderView({ isAuthenticated: true, hostName: 'Nguyễn Văn An' })

    fireEvent.click(screen.getByRole('button', { name: 'Xin chào, Nguyễn Văn An' }))
    expect(props.onEnterApp).toHaveBeenCalledTimes(1)
    expect(props.onOpenLogin).not.toHaveBeenCalled()
  })

  it('charges females the fixed fee and splits the remainder across males', () => {
    renderView()

    // 170.000 court + 4 x 25.000 shuttles = 270.000; 3 females x 30.000; 180.000 / 5 males
    // Hero scoreboard and calculator both show each amount
    expect(screen.getAllByLabelText('36.000 đ')).toHaveLength(2)
    expect(screen.getAllByLabelText('30.000 đ')).toHaveLength(2)
  })

  it('recalculates when the court fee is typed in', () => {
    renderView()

    fireEvent.change(screen.getByDisplayValue('170.000'), { target: { value: '200.000' } })

    // (300.000 - 90.000) / 5 males
    expect(screen.getAllByLabelText('42.000 đ')).toHaveLength(2)
  })

  it('splits evenly when the fixed female fee is cleared', () => {
    renderView()

    fireEvent.click(screen.getByRole('button', { name: /Xoá tiền nữ cố định/ }))

    // 270.000 / 8 players = 33.750, rounded up to 34.000 for everyone
    expect(screen.getAllByLabelText('34.000 đ')).toHaveLength(4)
    expect(screen.getByText('Để trống: cả nhóm chia đều.')).toBeInTheDocument()
  })

  it('links to every section from both the desktop and the phone navigation', () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    renderView()

    // Two navs render: the desktop bar and the phone row (CSS decides which one shows)
    const navs = screen.getAllByRole('navigation', { name: 'Điều hướng trang' })
    expect(navs).toHaveLength(2)

    for (const label of ['Bảng tính', 'Tính năng', 'Hỏi đáp']) {
      const buttons = screen.getAllByRole('button', { name: label })
      expect(buttons).toHaveLength(2)
      fireEvent.click(buttons[1])
    }
    expect(scrollIntoView).toHaveBeenCalledTimes(3)
    vi.unstubAllGlobals()
  })
})
