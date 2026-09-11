import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemberFormDrawer } from './MemberFormDrawer'
import type { Member } from '@/lib/api'

describe('MemberFormDrawer component', () => {
  // covers: AC-1
  it('renders create mode with empty fields and submits new member', async () => {
    const onOpenChange = vi.fn()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <MemberFormDrawer
        open={true}
        onOpenChange={onOpenChange}
        memberToEdit={null}
        onSave={onSave}
      />
    )

    expect(screen.getByText('Thêm thành viên mới')).toBeInTheDocument()
    const nameInput = screen.getByPlaceholderText('VD: Nguyễn Văn Nam')
    const phoneInput = screen.getByPlaceholderText('VD: 0901234567')
    const noteInput = screen.getByPlaceholderText('VD: Chuyên đánh đôi, hay về sớm 30p...')

    fireEvent.change(nameInput, { target: { value: 'Lê Văn Cường' } })
    fireEvent.change(phoneInput, { target: { value: '0988776655' } })
    fireEvent.change(noteInput, { target: { value: 'Thường mang cầu' } })

    // Select female gender
    const femaleBtn = screen.getByText('Nữ')
    fireEvent.click(femaleBtn)

    const submitBtn = screen.getByRole('button', { name: 'Thêm người chơi' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        name: 'Lê Văn Cường',
        phone: '0988776655',
        gender: 'female',
        default_note: 'Thường mang cầu',
        is_active: true,
      })
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  // covers: AC-1
  it('renders edit mode with pre-filled data and toggles active status', async () => {
    const mockMember: Member = {
      id: 'm1',
      host_id: 'h1',
      name: 'Nguyễn Văn Nam',
      phone: '0901234567',
      gender: 'male',
      default_note: 'Đánh đôi',
      total_debt: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const onOpenChange = vi.fn()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <MemberFormDrawer
        open={true}
        onOpenChange={onOpenChange}
        memberToEdit={mockMember}
        onSave={onSave}
      />
    )

    expect(screen.getByText('Chỉnh sửa thành viên')).toBeInTheDocument()
    const nameInput = screen.getByDisplayValue('Nguyễn Văn Nam')
    fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn Nam (VIP)' } })

    expect(screen.getByText('Đang hoạt động')).toBeInTheDocument()

    const submitBtn = screen.getByRole('button', { name: 'Cập nhật' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        name: 'Nguyễn Văn Nam (VIP)',
        phone: '0901234567',
        gender: 'male',
        default_note: 'Đánh đôi',
        is_active: true,
      })
    })
  })

  // covers: AC-1
  it('displays error message if onSave fails', async () => {
    const onOpenChange = vi.fn()
    const onSave = vi.fn().mockRejectedValue(new Error('Số điện thoại đã tồn tại'))

    render(
      <MemberFormDrawer
        open={true}
        onOpenChange={onOpenChange}
        memberToEdit={null}
        onSave={onSave}
      />
    )

    const nameInput = screen.getByPlaceholderText('VD: Nguyễn Văn Nam')
    fireEvent.change(nameInput, { target: { value: 'Test Player' } })

    const submitBtn = screen.getByRole('button', { name: 'Thêm người chơi' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Số điện thoại đã tồn tại')).toBeInTheDocument()
      expect(onOpenChange).not.toHaveBeenCalledWith(false)
    })
  })
})
