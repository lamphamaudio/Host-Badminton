import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LandingPageView } from './LandingPageView'

describe('LandingPageView component', () => {
  it('renders headline, feature badges, and action buttons', () => {
    const onEnterApp = vi.fn()
    const onOpenLogin = vi.fn()

    render(
      <LandingPageView
        onEnterApp={onEnterApp}
        onOpenLogin={onOpenLogin}
        isAuthenticated={false}
      />
    )

    expect(screen.getByText(/Tính tiền sân & Thu nợ nhóm/i)).toBeInTheDocument()
    expect(screen.getByText('Bắt đầu tính tiền ngay')).toBeInTheDocument()
    expect(screen.getByText('Dành riêng cho chủ sân & trưởng nhóm cầu lông phong trào')).toBeInTheDocument()
    expect(screen.getByText('Mã VietQR')).toBeInTheDocument()
    expect(screen.getByText('Sổ nợ FIFO')).toBeInTheDocument()
  })

  it('triggers onEnterApp when clicking CTA buttons', () => {
    const onEnterApp = vi.fn()
    const onOpenLogin = vi.fn()

    render(
      <LandingPageView
        onEnterApp={onEnterApp}
        onOpenLogin={onOpenLogin}
        isAuthenticated={false}
      />
    )

    const ctaBtn = screen.getByRole('button', { name: /Bắt đầu tính tiền ngay/i })
    fireEvent.click(ctaBtn)
    expect(onEnterApp).toHaveBeenCalledTimes(1)
  })

  it('triggers onOpenLogin when clicking login button', () => {
    const onEnterApp = vi.fn()
    const onOpenLogin = vi.fn()

    render(
      <LandingPageView
        onEnterApp={onEnterApp}
        onOpenLogin={onOpenLogin}
        isAuthenticated={false}
      />
    )

    const loginBtns = screen.getAllByRole('button', { name: /Đăng nhập/i })
    fireEvent.click(loginBtns[0])
    expect(onOpenLogin).toHaveBeenCalledTimes(1)
  })

  it('adjusts interactive mini calculator parameters in real time', () => {
    render(
      <LandingPageView
        onEnterApp={vi.fn()}
        onOpenLogin={vi.fn()}
        isAuthenticated={false}
      />
    )

    expect(screen.getByText('Bảng điều khiển giả lập')).toBeInTheDocument()

    // Steppers for male count
    const plusButtons = screen.getAllByRole('button', { name: '+' })
    fireEvent.click(plusButtons[0]) // + 1 male

    // Expect updated players count in bill preview
    expect(screen.getByText(/Mỗi người thanh toán/i)).toBeInTheDocument()
  })

  it('expands and collapses FAQ accordion items', () => {
    render(
      <LandingPageView
        onEnterApp={vi.fn()}
        onOpenLogin={vi.fn()}
        isAuthenticated={false}
      />
    )

    const faqQuestion = screen.getByText('Host Badminton có thu phí sử dụng không?')
    fireEvent.click(faqQuestion)

    expect(screen.getByText(/Hoàn toàn miễn phí 100% dành cho tất cả các chủ sân/i)).toBeInTheDocument()

    // Collapse
    fireEvent.click(faqQuestion)
    expect(screen.queryByText(/Hoàn toàn miễn phí 100% dành cho tất cả các chủ sân/i)).not.toBeInTheDocument()
  })
})
