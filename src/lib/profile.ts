import type { AgeMode, Profile } from './types'

const KEY = 'curio.profile'

/** Age typed in onboarding -> explanation style. */
export function modeFromAge(age: number): AgeMode {
  if (age < 13) return 'child'
  if (age < 18) return 'teen'
  if (age >= 65) return 'plainWords'
  return 'adult'
}

export function loadProfile(): Profile | null {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Profile) : null
  } catch {
    return null
  }
}

export function saveProfile(p: Profile) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* private mode: profile lasts for this visit only */
  }
}

export function clearProfile() {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
