/**
 * Light/dark appearance for the app. The resolved theme is written to <html data-theme>,
 * which switches the colour tokens defined in index.css. index.html applies the same
 * logic inline before first paint so a light-mode user never sees a dark flash.
 */
import { useSyncExternalStore } from 'react'

export type ThemePreference = 'dark' | 'light' | 'system'
export type ResolvedTheme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'host_badminton_theme'
const THEME_COLOR: Record<ResolvedTheme, string> = { dark: '#05070a', light: '#f4f6f1' }

function isPreference(value: unknown): value is ThemePreference {
  return value === 'dark' || value === 'light' || value === 'system'
}

export function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isPreference(stored) ? stored : 'dark'
  } catch {
    return 'dark'
  }
}

function systemPrefersLight(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ?? false
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') return systemPrefersLight() ? 'light' : 'dark'
  return preference
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
}

// Module-level store shared by every component that reads the theme
let preference: ThemePreference = readPreference()
const listeners = new Set<() => void>()

function emit() {
  applyTheme(resolveTheme(preference))
  listeners.forEach((listener) => listener())
}

export function setThemePreference(next: ThemePreference) {
  preference = next
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    // Private browsing can block storage; the choice still applies for this visit
  }
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Follow the OS setting live while the preference is 'system'
  const media = window.matchMedia?.('(prefers-color-scheme: light)')
  const handleChange = () => {
    if (preference === 'system') emit()
  }
  media?.addEventListener('change', handleChange)
  return () => {
    listeners.delete(listener)
    media?.removeEventListener('change', handleChange)
  }
}

interface ThemeSnapshot {
  preference: ThemePreference
  resolved: ResolvedTheme
}

let snapshot: ThemeSnapshot = { preference, resolved: resolveTheme(preference) }

function getSnapshot(): ThemeSnapshot {
  const resolved = resolveTheme(preference)
  // Return a stable object until something actually changes
  if (snapshot.preference !== preference || snapshot.resolved !== resolved) {
    snapshot = { preference, resolved }
  }
  return snapshot
}

export function useTheme() {
  const { preference: current, resolved } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    preference: current,
    resolved,
    setPreference: setThemePreference,
    toggle: () => setThemePreference(resolved === 'dark' ? 'light' : 'dark'),
  }
}

/** Re-sync the store with storage; used by tests and after external changes. */
export function reloadThemePreference() {
  preference = readPreference()
  emit()
}
