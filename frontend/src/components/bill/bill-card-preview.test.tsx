import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BillCardPreview, type BillSessionData } from './bill-card-preview'
import { ToastProvider } from '@/lib/toast'

const mockBillData: BillSessionData = {
  venueName: 'Sân Cầu Lông Kỳ Hòa',
  courtNumber: 'Sân 3',
  sessionDate: '2026-09-10T18:30:00Z',
  splitMode: 'fixed_female_discount',
  maleCount: 6,
  femaleCount: 4,
  maleFee: 40000,
  femaleFee: 30000,
  courtFee: 200000,
  shuttleFee: 160000,
  shuttleCount: 8,
  totalAmount: 360000,
  bankName: 'MB Bank',
  accountNumber: '999908092026',
  accountName: 'PHAM TRAN LAM',
  transferContent: 'SAN KY HOA 10/09',
}

describe('BillCardPreview component', () => {
  it('renders court details, costs, and player splits correctly', () => {
    render(
      <ToastProvider>
        <BillCardPreview data={mockBillData} />
      </ToastProvider>
    )

    expect(screen.getByText('Sân Cầu Lông Kỳ Hòa')).toBeInTheDocument()
    expect(screen.getByText('10 người')).toBeInTheDocument()
    expect(screen.getByText(/360\.000/)).toBeInTheDocument()
    expect(screen.getByText('999908092026')).toBeInTheDocument()
  })

  it('triggers clipboard copy when copy button is clicked', async () => {
    const user = userEvent.setup()
    const writeTextMock = vi.fn().mockResolvedValue(undefined)

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    })

    render(
      <ToastProvider>
        <BillCardPreview data={mockBillData} />
      </ToastProvider>
    )

    const copyBtn = screen.getByRole('button', { name: /Chép hóa đơn/i })
    await user.click(copyBtn)

    expect(writeTextMock).toHaveBeenCalledTimes(1)
    expect(writeTextMock.mock.calls[0][0]).toContain('Sân Cầu Lông Kỳ Hòa')
  })
})
