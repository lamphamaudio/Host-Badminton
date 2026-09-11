import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemberManagementView } from './MemberManagementView'
import { ToastProvider } from '@/lib/toast'
import { AuthProvider } from '@/context/AuthContext'
import * as api from '@/lib/api'

describe('MemberManagementView component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // covers: AC-1, AC-4
  it('renders member roster list, debt badges, and supports searching', async () => {
    const mockMembers: api.Member[] = [
      {
        id: 'm1',
        host_id: 'h1',
        name: 'Nguyễn Văn Nam',
        phone: '0901234567',
        gender: 'male',
        default_note: 'Đánh đôi',
        total_debt: 120000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'm2',
        host_id: 'h1',
        name: 'Trần Thị Hoa',
        phone: '0912345678',
        gender: 'female',
        default_note: null,
        total_debt: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    vi.spyOn(api, 'fetchMembers').mockResolvedValue(mockMembers)

    render(
      <AuthProvider>
        <ToastProvider>
          <MemberManagementView />
        </ToastProvider>
      </AuthProvider>
    )

    expect(screen.getByText('Thành Viên & Sổ Nợ')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn Nam')).toBeInTheDocument()
      expect(screen.getByText('Trần Thị Hoa')).toBeInTheDocument()
    })

    // Search filter
    const searchInput = screen.getByPlaceholderText('Tìm theo tên hoặc số điện thoại...')
    fireEvent.change(searchInput, { target: { value: 'Nam' } })

    // Check search was invoked
    await waitFor(() => {
      expect(api.fetchMembers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Nam' })
      )
    })
  })

  // covers: AC-1
  it('displays empty state when no members exist', async () => {
    vi.spyOn(api, 'fetchMembers').mockResolvedValue([])

    render(
      <AuthProvider>
        <ToastProvider>
          <MemberManagementView />
        </ToastProvider>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Chưa có thành viên nào trong danh sách')).toBeInTheDocument()
      expect(screen.getByText('Thêm thành viên đầu tiên')).toBeInTheDocument()
    })
  })

  // covers: AC-1
  it('opens member create drawer when clicking add button', async () => {
    vi.spyOn(api, 'fetchMembers').mockResolvedValue([])

    render(
      <AuthProvider>
        <ToastProvider>
          <MemberManagementView />
        </ToastProvider>
      </AuthProvider>
    )

    const addBtn = screen.getByRole('button', { name: /Thêm người/i })
    fireEvent.click(addBtn)

    await waitFor(() => {
      expect(screen.getByText('Thêm thành viên mới')).toBeInTheDocument()
    })
  })

  // covers: AC-1
  it('filters active only and all members correctly', async () => {
    const mockMembers: api.Member[] = [
      {
        id: 'm1',
        host_id: 'h1',
        name: 'Nguyễn Văn Nam',
        phone: '0901234567',
        gender: 'male',
        default_note: 'Đánh đôi',
        total_debt: 120000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'm2',
        host_id: 'h1',
        name: 'Trần Thị Hoa (Inactive)',
        phone: '0912345678',
        gender: 'female',
        default_note: null,
        total_debt: 0,
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    vi.spyOn(api, 'fetchMembers').mockResolvedValue(mockMembers)

    render(
      <AuthProvider>
        <ToastProvider>
          <MemberManagementView />
        </ToastProvider>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn Nam')).toBeInTheDocument()
      expect(screen.getByText('Trần Thị Hoa (Inactive)')).toBeInTheDocument()
    })

    // Click "Đang hoạt động" filter chip
    const activeBtn = screen.getByRole('button', { name: /Đang hoạt động/i })
    fireEvent.click(activeBtn)

    expect(screen.getByText('Nguyễn Văn Nam')).toBeInTheDocument()
    expect(screen.queryByText('Trần Thị Hoa (Inactive)')).not.toBeInTheDocument()

    // Click "Tất cả" filter chip
    const allBtn = screen.getByRole('button', { name: /Tất cả/i })
    fireEvent.click(allBtn)

    expect(screen.getByText('Nguyễn Văn Nam')).toBeInTheDocument()
    expect(screen.getByText('Trần Thị Hoa (Inactive)')).toBeInTheDocument()
  })
})
