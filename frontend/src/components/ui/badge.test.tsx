import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './badge'

describe('Badge component', () => {
  it('renders status text and variant classes', () => {
    // covers: AC-5
    const { rerender } = render(<Badge variant="paid">Đã thanh toán</Badge>)
    expect(screen.getByText('Đã thanh toán')).toBeInTheDocument()
    expect(screen.getByText('Đã thanh toán')).toHaveClass('text-emerald-400')

    rerender(<Badge variant="unpaid">Chưa đóng</Badge>)
    expect(screen.getByText('Chưa đóng')).toHaveClass('text-red-400')

    rerender(<Badge variant="pending">Chờ xác nhận</Badge>)
    expect(screen.getByText('Chờ xác nhận')).toHaveClass('text-amber-400')
  })

  it('renders with dot indicator', () => {
    // covers: AC-5
    const { container } = render(
      <Badge variant="paid" dot>
        Active
      </Badge>
    )
    const dot = container.querySelector('.rounded-full.shrink-0')
    expect(dot).toBeInTheDocument()
  })
})
