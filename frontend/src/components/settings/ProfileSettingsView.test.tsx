import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfileSettingsView } from './ProfileSettingsView'
import { AuthProvider } from '../../context/AuthContext'
import { loadCalculatorState } from '../../lib/storage'

describe('ProfileSettingsView component', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders guest mode notice when not logged in', () => {
    render(
      <AuthProvider>
        <ProfileSettingsView />
      </AuthProvider>
    )

    expect(
      screen.getByText(/Bạn đang sử dụng ở chế độ Khách/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Đăng nhập ngay/i })
    ).toBeInTheDocument()
  })

  it('updates profile and syncs default bank details to calculator storage', async () => {
    render(
      <AuthProvider>
        <ProfileSettingsView />
      </AuthProvider>
    )

    const nameInput = screen.getByPlaceholderText('Ví dụ: Nguyễn Văn A')
    fireEvent.change(nameInput, { target: { value: 'Trần Văn Host' } })

    const accountNumInput = screen.getByPlaceholderText('Ví dụ: 0912345678')
    fireEvent.change(accountNumInput, { target: { value: '0987654321' } })

    const accountNameInput = screen.getByPlaceholderText('Ví dụ: NGUYEN VAN A')
    fireEvent.change(accountNameInput, { target: { value: 'TRAN VAN HOST' } })

    const saveBtn = screen.getByRole('button', { name: /Lưu thay đổi/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      const state = loadCalculatorState()
      expect(state.bankProfile.accountNumber).toBe('0987654321')
      expect(state.bankProfile.accountName).toBe('TRAN VAN HOST')
    })
  })
})
