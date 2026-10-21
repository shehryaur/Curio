import type { AgeMode } from './types'

/**
 * Judge demo helpers. Visible ONLY when NEXT_PUBLIC_DEMO_MODE=true in .env.local.
 * Real users never see them: the real flow always goes through k-ID (age gate, parent email approval).
 */
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export interface DemoPersona {
  id: string
  name: string
  age: number
  mode: AgeMode
  jurisdiction: string // shown in the k-ID badge
  label: string
}

export const DEMO_PERSONAS: DemoPersona[] = [
  { id: 'leo', name: 'Leo', age: 8, mode: 'child', jurisdiction: 'US-CA', label: 'Leo · 8 · US (child)' },
  { id: 'maya', name: 'Maya', age: 14, mode: 'teen', jurisdiction: 'GB', label: 'Maya · 14 · UK (teen)' },
  { id: 'alex', name: 'Alex', age: 34, mode: 'adult', jurisdiction: 'US-CA', label: 'Alex · 34 · US (adult)' },
  { id: 'rose', name: 'Rose', age: 72, mode: 'plainWords', jurisdiction: 'US-CA', label: 'Rose · 72 · US (senior)' },
]
