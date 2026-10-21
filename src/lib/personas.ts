import type { AgeMode } from './types'

// Demo personas for the top-bar switcher. The real default comes from k-ID ageStatus.
export interface Persona {
  id: string
  label: string
  mode: AgeMode
  jurisdiction: string
}

export const PERSONAS: Persona[] = [
  { id: 'leo', label: 'Leo · 8 · US', mode: 'child', jurisdiction: 'US-CA' },
  { id: 'maya', label: 'Maya · 14 · UK', mode: 'teen', jurisdiction: 'GB' },
  { id: 'teacher', label: 'Teacher · Adult', mode: 'adult', jurisdiction: 'US-CA' },
  { id: 'grandpa', label: 'Grandparent · Plain words', mode: 'plainWords', jurisdiction: 'US-CA' },
]

/** Map k-ID session.ageStatus to a default mode. Unknown => child (safest). */
export function modeFromAgeStatus(ageStatus: string | undefined | null): AgeMode {
  switch ((ageStatus ?? '').toUpperCase()) {
    case 'LEGAL_ADULT':
      return 'adult'
    case 'DIGITAL_YOUTH':
      return 'teen'
    default:
      return 'child' // DIGITAL_MINOR, unknown
  }
}

export const isMinorMode = (m: AgeMode) => m === 'child' || m === 'teen'
