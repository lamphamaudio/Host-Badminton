import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  THEME_STORAGE_KEY,
  readPreference,
  reloadThemePreference,
  resolveTheme,
  useTheme,
} from './theme'

function mockSystemLight(prefersLight: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('light') ? prefersLight : !prefersLight,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    mockSystemLight(false)
    reloadThemePreference()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('defaults to the dark night-court theme', () => {
    expect(readPreference()).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('ignores unknown values left in storage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'purple')
    expect(readPreference()).toBe('dark')
  })

  it('resolves the system preference from the OS setting', () => {
    mockSystemLight(true)
    expect(resolveTheme('system')).toBe('light')
    mockSystemLight(false)
    expect(resolveTheme('system')).toBe('dark')
  })

  it('toggles, applies to <html> and remembers the choice', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.resolved).toBe('dark')

    act(() => result.current.toggle())

    expect(result.current.resolved).toBe('light')
    expect(result.current.preference).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('follows the device when set to system', () => {
    mockSystemLight(true)
    const { result } = renderHook(() => useTheme())

    act(() => result.current.setPreference('system'))

    expect(result.current.preference).toBe('system')
    expect(result.current.resolved).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
