import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './button'

describe('Button component', () => {
  it('renders correctly with default styles', () => {
    // covers: AC-3
    render(<Button>Bắt đầu tính</Button>)
    const btn = screen.getByRole('button', { name: 'Bắt đầu tính' })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveClass('min-h-[44px]')
  })

  it('renders different variants correctly', () => {
    // covers: AC-3
    const { rerender } = render(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-[#182338]')

    rerender(<Button variant="accent">Accent</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-lime-500')

    rerender(<Button variant="destructive">Destructive</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-red-600')
  })

  it('handles click events and disabled state', async () => {
    // covers: AC-3
    const user = userEvent.setup()
    const handleClick = vi.fn()

    const { rerender } = render(<Button onClick={handleClick}>Click Me</Button>)
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)

    rerender(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>
    )
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
