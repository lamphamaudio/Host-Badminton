import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CalculatorScreen } from './CalculatorScreen'
import { ToastProvider } from '@/lib/toast'
import * as api from '@/lib/api'

describe('CalculatorScreen component', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.spyOn(api, 'fetchVenues').mockResolvedValue([])
  })

  it('renders calculator sections and default values correctly', () => {
    render(
      <ToastProvider>
        <CalculatorScreen />
      </ToastProvider>
    )

    expect(screen.getByText('Tính tiền sân & VietQR')).toBeInTheDocument()
    expect(screen.getByText('Tiền thuê sân')).toBeInTheDocument()
    expect(screen.getByText('Tiền cầu lông')).toBeInTheDocument()
    expect(screen.getByText('Số người tham gia')).toBeInTheDocument()
    expect(screen.getByText('Cách chia tiền')).toBeInTheDocument()
    expect(screen.getByText('Xem hóa đơn & Lưu lịch sử')).toBeInTheDocument()
  })

  it('switches split mode tabs reactively', () => {
    render(
      <ToastProvider>
        <CalculatorScreen />
      </ToastProvider>
    )

    const discountTab = screen.getByText('Giảm giá Nữ')
    fireEvent.click(discountTab)

    expect(screen.getByText('Mức giảm giá cho Nữ (VND)')).toBeInTheDocument()

    const fixedFeeTab = screen.getByText('Nữ cố định')
    fireEvent.click(fixedFeeTab)

    expect(screen.getByText('Tiền cố định cho mỗi Nữ (VND)')).toBeInTheDocument()

    const multiStageTab = screen.getByText('Về sớm (2 hiệp)')
    fireEvent.click(multiStageTab)

    expect(screen.getByText('Cấu hình 2 hiệp & Người về sớm')).toBeInTheDocument()
  })

  it('opens VietQR bill drawer when trigger button is clicked', () => {
    render(
      <ToastProvider>
        <CalculatorScreen />
      </ToastProvider>
    )

    const openBillBtn = screen.getByText('Xem hóa đơn & Lưu lịch sử')
    fireEvent.click(openBillBtn)

    expect(screen.getByText('Hóa đơn VietQR hoàn chỉnh')).toBeInTheDocument()
    expect(screen.getByText('Quét VietQR để thanh toán')).toBeInTheDocument()
  })
})

