import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadCalculatorState,
  saveCalculatorState,
  clearCalculatorState,
  STORAGE_KEY,
  DEFAULT_CALCULATOR_STATE,
  SavedCalculatorState,
} from './storage'

describe('storage manager', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns default state when storage is empty', () => {
    const state = loadCalculatorState()
    expect(state.inputs.courtFee).toBe(200000)
    expect(state.inputs.splitMode).toBe('even')
    expect(state.bankProfile.bankBin).toBe('970422')
  })

  it('saves and restores custom calculator state correctly', () => {
    const customState: SavedCalculatorState = {
      inputs: {
        courtFee: 350000,
        shuttlecockCount: 12,
        shuttlecockUnitPrice: 25000,
        maleCount: 8,
        femaleCount: 2,
        splitMode: 'fixed_female_discount',
        femaleDiscount: 15000,
        fixedFemaleFee: 30000,
        earlyLeaverConfig: { count: 1, stage1Ratio: 0.5 },
      },
      bankProfile: {
        bankBin: '970436',
        accountNumber: '1234567890',
        accountName: 'NGUYEN VAN A',
        memo: 'CAU LONG 12 09',
      },
      venueName: 'Sân Cầu Lông Lan Anh',
      sessionDate: '2026-09-12',
    }

    saveCalculatorState(customState)

    const loaded = loadCalculatorState()
    expect(loaded.inputs.courtFee).toBe(350000)
    expect(loaded.inputs.maleCount).toBe(8)
    expect(loaded.bankProfile.bankBin).toBe('970436')
    expect(loaded.bankProfile.accountName).toBe('NGUYEN VAN A')
    expect(loaded.venueName).toBe('Sân Cầu Lông Lan Anh')
  })

  it('handles corrupted json data safely without crashing', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid json {')
    const loaded = loadCalculatorState()
    expect(loaded).toEqual(DEFAULT_CALCULATOR_STATE)
  })

  it('clears saved state cleanly', () => {
    saveCalculatorState({
      ...DEFAULT_CALCULATOR_STATE,
      venueName: 'Temporary Venue',
    })
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy()

    clearCalculatorState()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
