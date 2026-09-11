/**
 * Vietnam Banking Directory and VietQR Quicklink Generator
 * Provides standard BIN codes, bank metadata, Quicklink image URLs, and offline QR fallback generation.
 */

import QRCode from 'qrcode'

export interface BankInfo {
  bin: string
  shortName: string
  name: string
  logo?: string
}

export const VIETNAM_BANKS: BankInfo[] = [
  { bin: '970422', shortName: 'MB Bank', name: 'Ngân hàng Quân Đội' },
  { bin: '970436', shortName: 'Vietcombank', name: 'Ngân hàng Ngoại Thương Việt Nam' },
  { bin: '970407', shortName: 'Techcombank', name: 'Ngân hàng Kỹ Thương Việt Nam' },
  { bin: '970415', shortName: 'VietinBank', name: 'Ngân hàng Công Thương Việt Nam' },
  { bin: '970418', shortName: 'BIDV', name: 'Ngân hàng Đầu tư và Phát triển Việt Nam' },
  { bin: '970416', shortName: 'ACB', name: 'Ngân hàng Á Châu' },
  { bin: '970432', shortName: 'VPBank', name: 'Ngân hàng Việt Nam Thịnh Vượng' },
  { bin: '970423', shortName: 'TPBank', name: 'Ngân hàng Tiên Phong' },
  { bin: '970403', shortName: 'Sacombank', name: 'Ngân hàng Sài Gòn Thương Tín' },
  { bin: '970441', shortName: 'VIB', name: 'Ngân hàng Quốc Tế Việt Nam' },
  { bin: '970448', shortName: 'OCB', name: 'Ngân hàng Phương Đông' },
  { bin: '970443', shortName: 'SHB', name: 'Ngân hàng Sài Gòn Hà Nội' },
  { bin: '970437', shortName: 'HDBank', name: 'Ngân hàng Phát triển TP.HCM' },
  { bin: '970426', shortName: 'MSB', name: 'Ngân hàng Hàng Hải Việt Nam' },
  { bin: '970440', shortName: 'SeABank', name: 'Ngân hàng Đông Nam Á' },
  { bin: '546034', shortName: 'Cake', name: 'Cake by VPBank' },
  { bin: '963388', shortName: 'Timo', name: 'Ngân hàng số Timo' },
]

export interface VietQROptions {
  bankBin: string
  accountNumber: string
  accountName?: string
  amount?: number
  memo?: string
  template?: 'compact2' | 'compact' | 'qr_only' | 'print'
}

/**
 * Normalizes an account number by removing all whitespace, dashes, and periods.
 */
export function normalizeAccountNumber(accountNumber: string): string {
  return (accountNumber || '').replace(/[\s.-]/g, '')
}

/**
 * Removes Vietnamese diacritics for clean bank transfer memo compatibility.
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

/**
 * Builds a dynamic VietQR Quicklink image URL.
 */
export function generateVietQRQuicklink(options: VietQROptions): string {
  const cleanAccount = normalizeAccountNumber(options.accountNumber)
  const template = options.template || 'compact2'

  if (!options.bankBin || !cleanAccount) {
    return ''
  }

  const queryParams = new URLSearchParams()

  if (options.amount !== undefined && options.amount > 0) {
    queryParams.set('amount', Math.round(options.amount).toString())
  }

  if (options.memo) {
    const cleanMemo = removeVietnameseTones(options.memo.trim())
    queryParams.set('addInfo', cleanMemo)
  }

  if (options.accountName) {
    const cleanName = removeVietnameseTones(options.accountName.trim()).toUpperCase()
    queryParams.set('accountName', cleanName)
  }

  const queryString = queryParams.toString()
  const baseUrl = `https://img.vietqr.io/image/${options.bankBin}-${cleanAccount}-${template}.png`

  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

/**
 * Finds a bank info object by its 6-digit BIN code.
 */
export function findBankByBin(bin: string): BankInfo | undefined {
  return VIETNAM_BANKS.find((b) => b.bin === bin)
}

/**
 * Generates an offline fallback QR code as a PNG data URL.
 */
export async function generateOfflineQRDataUrl(options: VietQROptions): Promise<string> {
  const cleanAccount = normalizeAccountNumber(options.accountNumber)
  if (!options.bankBin || !cleanAccount) {
    return ''
  }

  const bank = findBankByBin(options.bankBin)
  const bankName = bank ? bank.shortName : options.bankBin
  const memoText = options.memo ? `\nNoi dung: ${removeVietnameseTones(options.memo)}` : ''
  const amountText = options.amount ? `\nSo tien: ${Math.round(options.amount)} VND` : ''
  const nameText = options.accountName
    ? `\nChu TK: ${removeVietnameseTones(options.accountName).toUpperCase()}`
    : ''

  const fallbackPayload = `Ngan hang: ${bankName}\nSTK: ${cleanAccount}${nameText}${amountText}${memoText}`

  try {
    return await QRCode.toDataURL(fallbackPayload, {
      margin: 2,
      width: 320,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
  } catch (err) {
    console.error('Failed to generate offline QR code:', err)
    return ''
  }
}
