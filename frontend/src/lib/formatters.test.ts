import { describe, it, expect } from 'vitest'
import {
  formatVND,
  formatVNDCompact,
  parseVND,
  formatCount,
  formatSessionDateTime,
} from './formatters'

describe('formatters', () => {
  describe('formatVND', () => {
    it('formats numbers to Vietnamese Dong with symbol', () => {
      // covers: AC-2
      expect(formatVND(150000)).toMatch(/150\.000/)
      expect(formatVND(150000)).toContain('đ')
      expect(formatVND(0)).toMatch(/0/)
    })

    it('formats numbers without symbol when requested', () => {
      // covers: AC-2
      expect(formatVND(250000, false)).toMatch(/250\.000/)
    })

    it('handles NaN gracefully', () => {
      expect(formatVND(NaN)).toBe('0 đ')
    })
  })

  describe('formatVNDCompact', () => {
    it('formats thousands to k notation', () => {
      // covers: AC-2
      expect(formatVNDCompact(50000)).toBe('50k')
      expect(formatVNDCompact(150000)).toBe('150k')
      expect(formatVNDCompact(15500)).toBe('15.5k')
    })

    it('formats millions to M notation', () => {
      // covers: AC-2
      expect(formatVNDCompact(1000000)).toBe('1M')
      expect(formatVNDCompact(1500000)).toBe('1.5M')
    })

    it('handles zero and small values', () => {
      expect(formatVNDCompact(0)).toBe('0k')
      expect(formatVNDCompact(500)).toBe('500 đ')
    })
  })

  describe('parseVND', () => {
    it('parses numeric string', () => {
      // covers: AC-2
      expect(parseVND('150000')).toBe(150000)
      expect(parseVND('150.000')).toBe(150000)
    })

    it('parses shorthand k notation', () => {
      // covers: AC-2
      expect(parseVND('150k')).toBe(150000)
      expect(parseVND('50K')).toBe(50000)
      expect(parseVND('12.5k')).toBe(12500)
    })

    it('parses shorthand M notation', () => {
      // covers: AC-2
      expect(parseVND('1.5M')).toBe(1500000)
      expect(parseVND('2m')).toBe(2000000)
    })

    it('handles empty and invalid inputs', () => {
      expect(parseVND('')).toBe(0)
      expect(parseVND('abc')).toBe(0)
    })
  })

  describe('formatCount', () => {
    it('formats player and item counts with unit', () => {
      expect(formatCount(6)).toBe('6 người')
      expect(formatCount(12, 'quả')).toBe('12 quả')
    })
  })

  describe('formatSessionDateTime', () => {
    it('formats Date instance', () => {
      const d = new Date(2026, 8, 10, 18, 30) // 10/09/2026 18:30
      expect(formatSessionDateTime(d)).toBe('18:30 · 10/09/2026')
    })

    it('handles invalid date', () => {
      expect(formatSessionDateTime('invalid')).toBe('')
    })
  })
})
