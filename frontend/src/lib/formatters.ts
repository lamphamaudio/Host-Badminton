/**
 * Utility formatters for Vietnamese Dong (VND), numbers, and court timestamps.
 */

/**
 * Format a numeric amount into standard Vietnamese Dong with thousands dot separators.
 * Example: 150000 -> "150.000 đ"
 */
export function formatVND(amount: number, showSymbol = true): string {
  if (isNaN(amount)) return '0 đ'
  const formatted = new Intl.NumberFormat('vi-VN').format(amount)
  return showSymbol ? `${formatted} đ` : formatted
}

/**
 * Format an amount into compact shorthand for quick mobile display chips.
 * Examples:
 * 50000 -> "50k"
 * 150000 -> "150k"
 * 1200000 -> "1.2M"
 */
export function formatVNDCompact(amount: number): string {
  if (isNaN(amount) || amount === 0) return '0k'
  if (Math.abs(amount) >= 1_000_000) {
    const millions = amount / 1_000_000
    return `${millions % 1 === 0 ? millions : millions.toFixed(1)}M`
  }
  if (Math.abs(amount) >= 1_000) {
    const thousands = amount / 1_000
    return `${thousands % 1 === 0 ? thousands : thousands.toFixed(1)}k`
  }
  return `${amount} đ`
}

/**
 * Parse a raw text input containing numbers and optional 'k' / 'K' suffixes into an integer.
 * Examples:
 * "150000" -> 150000
 * "150k" -> 150000
 * "12.5k" -> 12500
 * "150.000" -> 150000
 * "1,5M" -> 1500000
 */
export function parseVND(input: string): number {
  if (!input) return 0
  const trimmed = input.trim().toLowerCase()

  if (trimmed.endsWith('k')) {
    const rawNum = trimmed.slice(0, -1).replace(/,/g, '.')
    const val = parseFloat(rawNum)
    return isNaN(val) ? 0 : Math.round(val * 1000)
  }

  if (trimmed.endsWith('m')) {
    const rawNum = trimmed.slice(0, -1).replace(/,/g, '.')
    const val = parseFloat(rawNum)
    return isNaN(val) ? 0 : Math.round(val * 1_000_000)
  }

  // Remove non-digit characters
  const cleaned = trimmed.replace(/[^\d]/g, '')
  const parsed = parseInt(cleaned, 10)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Format a player count or item quantity.
 */
export function formatCount(count: number, unit = 'người'): string {
  return `${count} ${unit}`
}

/**
 * Format date time string for court sessions.
 * Example: "18:00 · 10/09/2026"
 */
export function formatSessionDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${hours}:${minutes} · ${day}/${month}/${year}`
}
