/**
 * Browser LocalStorage manager for saving and auto-restoring calculator sessions and host bank settings.
 */

import { CalculatorInputs } from './calculator'

export const STORAGE_KEY = 'host_badminton_calculator_state'

export interface HostBankProfile {
  bankBin: string
  accountNumber: string
  accountName: string
  memo: string
}

export interface SavedCalculatorState {
  inputs: CalculatorInputs
  bankProfile: HostBankProfile
  venueName: string
  sessionDate: string
}

export const DEFAULT_CALCULATOR_STATE: SavedCalculatorState = {
  inputs: {
    courtFee: 200000,
    shuttlecockCount: 8,
    shuttlecockUnitPrice: 20000,
    maleCount: 6,
    femaleCount: 4,
    splitMode: 'even',
    femaleDiscount: 10000,
    fixedFemaleFee: 30000,
    earlyLeaverConfig: {
      count: 0,
      stage1Ratio: 0.5,
      stage1Shuttlecocks: 4,
    },
  },
  bankProfile: {
    bankBin: '970422', // MB Bank default
    accountNumber: '',
    accountName: '',
    memo: 'TIEN SAN CAU LONG',
  },
  venueName: 'Sân Cầu Lông Kỳ Hòa',
  sessionDate: new Date().toISOString().split('T')[0],
}

/**
 * Loads calculator state from localStorage with safe fallback to defaults.
 */
export function loadCalculatorState(): SavedCalculatorState {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_CALCULATOR_STATE
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return DEFAULT_CALCULATOR_STATE
    }

    const parsed = JSON.parse(raw)
    return {
      inputs: {
        ...DEFAULT_CALCULATOR_STATE.inputs,
        ...(parsed.inputs || {}),
      },
      bankProfile: {
        ...DEFAULT_CALCULATOR_STATE.bankProfile,
        ...(parsed.bankProfile || {}),
      },
      venueName: parsed.venueName || DEFAULT_CALCULATOR_STATE.venueName,
      sessionDate: parsed.sessionDate || DEFAULT_CALCULATOR_STATE.sessionDate,
    }
  } catch (err) {
    console.warn('Failed to parse saved calculator state, falling back to defaults', err)
    return DEFAULT_CALCULATOR_STATE
  }
}

/**
 * Persists calculator state to localStorage.
 */
export function saveCalculatorState(state: SavedCalculatorState): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('Failed to save calculator state to localStorage', err)
  }
}

/**
 * Clears saved calculator state from localStorage.
 */
export function clearCalculatorState(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.error('Failed to clear calculator state from localStorage', err)
  }
}
