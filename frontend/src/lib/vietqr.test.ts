import { describe, it, expect } from 'vitest'
import {
  normalizeAccountNumber,
  removeVietnameseTones,
  generateVietQRQuicklink,
  findBankByBin,
  generateOfflineQRDataUrl,
} from './vietqr'

describe('normalizeAccountNumber', () => {
  it('strips spaces, dashes, and periods', () => {
    expect(normalizeAccountNumber('1903 6288-123.456')).toBe('19036288123456')
    expect(normalizeAccountNumber(' 0987 654 321 ')).toBe('0987654321')
  })

  it('handles empty string gracefully', () => {
    expect(normalizeAccountNumber('')).toBe('')
  })
})

describe('removeVietnameseTones', () => {
  it('removes accents and special characters cleanly', () => {
    expect(removeVietnameseTones('Sân Kỳ Hòa - Tiền cầu')).toBe('San Ky Hoa - Tien cau')
    expect(removeVietnameseTones('Đỗ Phạm Văn Đạt')).toBe('Do Pham Van Dat')
  })
})

describe('generateVietQRQuicklink', () => {
  it('generates proper VietQR Quicklink URL with params', () => {
    const url = generateVietQRQuicklink({
      bankBin: '970422',
      accountNumber: '0987654321',
      accountName: 'Pham Thanh Lam',
      amount: 36000,
      memo: 'SAN KY HOA 10 09',
    })

    expect(url).toContain('https://img.vietqr.io/image/970422-0987654321-compact2.png')
    expect(url).toContain('amount=36000')
    expect(url).toContain('addInfo=SAN+KY+HOA+10+09')
    expect(url).toContain('accountName=PHAM+THANH+LAM')
  })

  it('returns empty string if bankBin or account is missing', () => {
    expect(generateVietQRQuicklink({ bankBin: '', accountNumber: '123' })).toBe('')
    expect(generateVietQRQuicklink({ bankBin: '970422', accountNumber: '' })).toBe('')
  })
})

describe('findBankByBin', () => {
  it('locates bank by 6 digit bin', () => {
    const mb = findBankByBin('970422')
    expect(mb).toBeDefined()
    expect(mb?.shortName).toBe('MB Bank')

    const vcb = findBankByBin('970436')
    expect(vcb?.shortName).toBe('Vietcombank')
  })

  it('returns undefined for non-existent bin', () => {
    expect(findBankByBin('000000')).toBeUndefined()
  })
})

describe('generateOfflineQRDataUrl', () => {
  it('generates a base64 data URL for offline fallback', async () => {
    const dataUrl = await generateOfflineQRDataUrl({
      bankBin: '970422',
      accountNumber: '0987654321',
      accountName: 'Pham Thanh Lam',
      amount: 36000,
      memo: 'San Ky Hoa',
    })

    expect(dataUrl).toMatch(/^data:image\/png;base64,/)
  })
})
