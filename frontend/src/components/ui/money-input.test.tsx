import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MoneyInput } from './money-input'

describe('MoneyInput component', () => {
  it('renders with label and formatted display value', () => {
    // covers: AC-2, AC-3
    render(<MoneyInput label="Tiền sân" value={200000} onChangeValue={vi.fn()} />)
    expect(screen.getByText('Tiền sân')).toBeInTheDocument()
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toMatch(/200\.000/)
  })

  it('updates value when quick increment chip is tapped', async () => {
    // covers: AC-3
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(
      <MoneyInput value={100000} onChangeValue={handleChange} quickIncrements={[50000, 100000]} />
    )

    const chip50k = screen.getByRole('button', { name: '+50k' })
    await user.click(chip50k)
    expect(handleChange).toHaveBeenCalledWith(150000)
  })

  it('clears value when clear button is clicked', async () => {
    // covers: AC-3
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(<MoneyInput value={150000} onChangeValue={handleChange} />)

    const clearBtn = screen.getByTitle('Xóa số tiền')
    await user.click(clearBtn)
    expect(handleChange).toHaveBeenCalledWith(0)
  })
})
