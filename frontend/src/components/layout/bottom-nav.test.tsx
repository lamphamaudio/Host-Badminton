import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BottomNav } from './bottom-nav'

describe('BottomNav component', () => {
  it('renders all default navigation tabs', () => {
    // covers: AC-7
    render(<BottomNav activeTab="calculator" onTabChange={vi.fn()} />)
    expect(screen.getByText('Tính tiền')).toBeInTheDocument()
    expect(screen.getByText('Lịch sử')).toBeInTheDocument()
    expect(screen.getByText('Sân bãi')).toBeInTheDocument()
    expect(screen.getByText('Thành viên')).toBeInTheDocument()
    expect(screen.getByText('Cài đặt')).toBeInTheDocument()
  })

  it('highlights the active tab', () => {
    // covers: AC-7
    render(<BottomNav activeTab="calculator" onTabChange={vi.fn()} />)
    const calcBtn = screen.getByRole('button', { name: /Tính tiền/i })
    expect(calcBtn).toHaveAttribute('aria-current', 'page')
  })

  it('triggers onTabChange when a tab is clicked', async () => {
    // covers: AC-7
    const user = userEvent.setup()
    const handleTabChange = vi.fn()

    render(<BottomNav activeTab="calculator" onTabChange={handleTabChange} />)
    const sessionsBtn = screen.getByRole('button', { name: /Lịch sử/i })
    await user.click(sessionsBtn)
    expect(handleTabChange).toHaveBeenCalledWith('sessions')
  })
})
