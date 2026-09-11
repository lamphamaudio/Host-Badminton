import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginSheet } from './LoginSheet'
import { AuthProvider } from '../../context/AuthContext'
import * as api from '../../lib/api'

describe('LoginSheet component', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders Google sign in tab by default and switches to Phone tab', async () => {
    render(
      <AuthProvider>
        <LoginSheet open={true} onOpenChange={() => {}} />
      </AuthProvider>
    )

    expect(screen.getByText('Đăng nhập Host Badminton')).toBeInTheDocument()
    expect(screen.getByText('Tiếp tục với Google')).toBeInTheDocument()

    // Switch to Phone tab
    const phoneTabBtn = screen.getByRole('button', { name: /Số điện thoại/i })
    fireEvent.click(phoneTabBtn)

    expect(screen.getByPlaceholderText('0912 345 678')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gửi mã xác thực OTP/i })).toBeInTheDocument()
  })

  it('handles Phone OTP submission and code verification input', async () => {
    vi.spyOn(api, 'sendPhoneOTP').mockResolvedValueOnce({
      message: 'OTP sent',
      expires_in: 300,
    })

    render(
      <AuthProvider>
        <LoginSheet open={true} onOpenChange={() => {}} />
      </AuthProvider>
    )

    // Switch to Phone tab
    const phoneTabBtn = screen.getByRole('button', { name: /Số điện thoại/i })
    fireEvent.click(phoneTabBtn)

    const phoneInput = screen.getByPlaceholderText('0912 345 678')
    fireEvent.change(phoneInput, { target: { value: '0987654321' } })

    const sendBtn = screen.getByRole('button', { name: /Gửi mã xác thực OTP/i })
    fireEvent.click(sendBtn)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('123456')).toBeInTheDocument()
      expect(screen.getByText(/Đã gửi mã đến:/i)).toBeInTheDocument()
    })
  })

  it('displays error message when sending OTP fails', async () => {
    vi.spyOn(api, 'sendPhoneOTP').mockRejectedValueOnce(
      new Error('Không thể gửi mã OTP lúc này')
    )

    render(
      <AuthProvider>
        <LoginSheet open={true} onOpenChange={() => {}} />
      </AuthProvider>
    )

    const phoneTabBtn = screen.getByRole('button', { name: /Số điện thoại/i })
    fireEvent.click(phoneTabBtn)

    const phoneInput = screen.getByPlaceholderText('0912 345 678')
    fireEvent.change(phoneInput, { target: { value: '0987654321' } })

    const sendBtn = screen.getByRole('button', { name: /Gửi mã xác thực OTP/i })
    fireEvent.click(sendBtn)

    await waitFor(() => {
      expect(screen.getByText(/Không thể gửi mã OTP lúc này/i)).toBeInTheDocument()
    })
  })
})
