import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Stepper } from './stepper'

describe('Stepper component', () => {
  it('displays the current value and label', () => {
    // covers: AC-4
    render(<Stepper value={6} onChangeValue={vi.fn()} label="Số người nam" />)
    expect(screen.getByText('Số người nam')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
  })

  it('increments value on plus button click', async () => {
    // covers: AC-4
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Stepper value={4} onChangeValue={handleChange} min={0} max={10} />)

    const plusBtn = screen.getByRole('button', { name: 'Tăng' })
    await user.click(plusBtn)
    expect(handleChange).toHaveBeenCalledWith(5)
  })

  it('decrements value on minus button click', async () => {
    // covers: AC-4
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Stepper value={4} onChangeValue={handleChange} min={0} max={10} />)

    const minusBtn = screen.getByRole('button', { name: 'Giảm' })
    await user.click(minusBtn)
    expect(handleChange).toHaveBeenCalledWith(3)
  })

  it('respects min and max constraints', async () => {
    // covers: AC-4
    const user = userEvent.setup()
    const handleChange = vi.fn()

    const { rerender } = render(<Stepper value={0} onChangeValue={handleChange} min={0} max={10} />)
    const minusBtn = screen.getByRole('button', { name: 'Giảm' })
    expect(minusBtn).toBeDisabled()
    await user.click(minusBtn)
    expect(handleChange).not.toHaveBeenCalled()

    rerender(<Stepper value={10} onChangeValue={handleChange} min={0} max={10} />)
    const plusBtn = screen.getByRole('button', { name: 'Tăng' })
    expect(plusBtn).toBeDisabled()
  })
})
