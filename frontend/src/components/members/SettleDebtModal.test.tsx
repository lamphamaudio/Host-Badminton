import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SettleDebtModal } from './SettleDebtModal'
import type { Member } from '@/lib/api'

describe('SettleDebtModal component', () => {
  const mockMember: Member = {
    id: 'm1',
    host_id: 'h1',
    name: 'Nguyễn Văn Nam',
    phone: '0901234567',
    gender: 'male',
    total_debt: 150000,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // covers: AC-5
  it('renders total debt, quick preset buttons, and submits settlement', () => {
    const onOpenChange = vi.fn()
    const onSettle = vi.fn().mockResolvedValue({
      member_id: 'm1',
      settled_amount: 150000,
      remaining_debt: 0,
      settled_records_count: 2,
    })

    render(
      <SettleDebtModal
        open={true}
        onOpenChange={onOpenChange}
        member={mockMember}
        onSettle={onSettle}
      />
    )

    expect(screen.getByText('Ghi nhận thanh toán nợ')).toBeInTheDocument()
    expect(screen.getByText('Nguyễn Văn Nam')).toBeInTheDocument()
    expect(screen.getByText('Trả hết')).toBeInTheDocument()

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Xác nhận thu nợ/i })
    fireEvent.submit(submitBtn.closest('form')!)

    expect(onSettle).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({
        amount: 150000,
        forgive_remainder: false,
      })
    )
  })

  // covers: AC-5
  it('supports quick preset buttons and forgiveness toggle', async () => {
    const onOpenChange = vi.fn()
    const onSettle = vi.fn().mockResolvedValue({
      member_id: 'm1',
      settled_amount: 150000,
      remaining_debt: 0,
      settled_records_count: 1,
    })

    render(
      <SettleDebtModal
        open={true}
        onOpenChange={onOpenChange}
        member={mockMember}
        onSettle={onSettle}
      />
    )

    // Toggle forgive remainder
    const forgiveLabel = screen.getByText('Miễn số nợ còn lại')
    const toggleBtn = forgiveLabel.closest('.flex.items-center')?.querySelector('button')
    expect(toggleBtn).toBeTruthy()
    fireEvent.click(toggleBtn!)

    const submitBtn = screen.getByRole('button', { name: /Xác nhận thu nợ/i })
    fireEvent.submit(submitBtn.closest('form')!)

    expect(onSettle).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({
        amount: 150000,
        forgive_remainder: true,
      })
    )
  })

  // covers: AC-5
  it('handles submission error gracefully', async () => {
    const onOpenChange = vi.fn()
    const onSettle = vi.fn().mockRejectedValue(new Error('Lỗi kết nối máy chủ'))

    render(
      <SettleDebtModal
        open={true}
        onOpenChange={onOpenChange}
        member={mockMember}
        onSettle={onSettle}
      />
    )

    const submitBtn = screen.getByRole('button', { name: /Xác nhận thu nợ/i })
    fireEvent.submit(submitBtn.closest('form')!)

    expect(await screen.findByText('Lỗi kết nối máy chủ')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
