import {
  STORAGE_KEY,
  PROFILE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  DEFAULT_PROFILE,
} from '../constants'
import { normalizeDay, normalizeProfile } from './normalize'

export const loadFromStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.days) || parsed.days.length === 0) {
      return null
    }
    const normalizedDays = parsed.days.map((day, index) =>
      normalizeDay(day, `Stored-${index + 1}`),
    )
    const activeId = normalizedDays.some(
      (day) => day.id === parsed.activeDayId,
    )
      ? parsed.activeDayId
      : normalizedDays[0].id
    const pendingDate = /^\d{4}-\d{2}-\d{2}$/.test(parsed.pendingDate)
      ? parsed.pendingDate
      : activeId
    return { days: normalizedDays, activeDayId: activeId, pendingDate }
  } catch (error) {
    return null
  }
}

export const loadProfileFromStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_PROFILE
  }
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY)
    if (!raw) return DEFAULT_PROFILE
    const parsed = JSON.parse(raw)
    return normalizeProfile(parsed)
  } catch (error) {
    return DEFAULT_PROFILE
  }
}

export const getPreferredTheme = () => {
  if (typeof window === 'undefined') return 'light'
  const savedTheme = window.localStorage?.getItem(THEME_STORAGE_KEY)
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}
