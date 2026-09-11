import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemberDetailDrawer } from './MemberDetailDrawer'
import { ToastProvider } from '@/lib/toast'
import { AuthProvider } from '@/context/AuthContext'
import type { Member, MemberDetail } from '@/lib/api'

describe('MemberDetailDrawer component', () => {
  const mockMember: Member = {
    id: 'm1',
    host_id: 'h1',
    name: 'Nguyễn Văn Nam',
    phone: '0901234567',
    gender: 'male',
    default_note: 'Đánh đôi',
    total_debt: 200000,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const mockDetail: MemberDetail = {
    ...mockMember,
    attended_sessions_count: 5,
    debt_records: [
      {
        id: 'd1',
        host_id: 'h1',
        member_id: 'm1',
        session_id: 's1',
        amount_owed: 100000,
        amount_paid: 0,
        status: 'unpaid',
        note: 'Phiên chơi ngày 2026-09-10',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'd2',
        host_id: 'h1',
        member_id: 'm1',
        session_id: 's2',
        amount_owed: 100000,
        amount_paid: 0,
        status: 'unpaid',
        note: 'Phiên chơi ngày 2026-09-08',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  }

  // covers: AC-4, AC-6
  it('renders member statistics, debt ledger, and VietQR reminder', async () => {
    const onGetDetails = vi.fn().mockResolvedValue(mockDetail)
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const onOpenSettle = vi.fn()

    render(
      <AuthProvider>
        <ToastProvider>
          <MemberDetailDrawer
            open={true}
            onOpenChange={vi.fn()}
            member={mockMember}
            onGetDetails={onGetDetails}
            onEdit={onEdit}
            onDelete={onDelete}
            onOpenSettle={onOpenSettle}
          />
        </ToastProvider>
      </AuthProvider>
    )

    expect(screen.getByText('Nguyễn Văn Nam')).toBeInTheDocument()
    expect(screen.getByText('Lời nhắc thanh toán VietQR')).toBeInTheDocument()
    expect(screen.getByText('Sao chép tin nhắn')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('Phiên chơi ngày 2026-09-10')).toBeInTheDocument()
      expect(screen.getByText('Phiên chơi ngày 2026-09-08')).toBeInTheDocument()
    })
  })

  // covers: AC-4, AC-5
  it('triggers onOpenSettle, onEdit, and onDelete actions', async () => {
    const onGetDetails = vi.fn().mockResolvedValue(mockDetail)
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const onOpenSettle = vi.fn()

    render(
      <AuthProvider>
        <ToastProvider>
          <MemberDetailDrawer
            open={true}
            onOpenChange={vi.fn()}
            member={mockMember}
            onGetDetails={onGetDetails}
            onEdit={onEdit}
            onDelete={onDelete}
            onOpenSettle={onOpenSettle}
          />
        </ToastProvider>
      </AuthProvider>
    )

    // Click settle button
    const settleBtn = screen.getByRole('button', { name: /Thu nợ/i })
    fireEvent.click(settleBtn)
    expect(onOpenSettle).toHaveBeenCalledWith(mockMember)

    // Click edit button
    const editBtn = screen.getByRole('button', { name: /Chỉnh sửa/i })
    fireEvent.click(editBtn)
    expect(onEdit).toHaveBeenCalledWith(mockMember)
  })

  // covers: AC-4
  it('renders zero debt state when member has no outstanding debt', async () => {
    const zeroDebtMember: Member = {
      ...mockMember,
      total_debt: 0,
    }
    const zeroDebtDetail: MemberDetail = {
      ...zeroDebtMember,
      attended_sessions_count: 2,
      debt_records: [],
    }

    const onGetDetails = vi.fn().mockResolvedValue(zeroDebtDetail)

    render(
      <AuthProvider>
        <ToastProvider>
          <MemberDetailDrawer
            open={true}
            onOpenChange={vi.fn()}
            member={zeroDebtMember}
            onGetDetails={onGetDetails}
            onEdit={vi.fn()}
            onDelete={vi.fn()}
            onOpenSettle={vi.fn()}
          />
        </ToastProvider>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Chưa có khoản nợ nào được ghi nhận.')).toBeInTheDocument()
    })
  })
})
