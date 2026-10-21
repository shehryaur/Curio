// Per-tier switches (spec: docs/AGE_TIERS.md). Content differences come from ByMode text; this file holds UI switches.
import type { AgeMode, ObjectViewerProps } from '@/lib/types'

export const GUIDE: Record<AgeMode, NonNullable<ObjectViewerProps['guide']>> = {
  child: 'pet',
  teen: 'reticle',
  adult: 'none',
  plainWords: 'finger',
}

const EU = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
])

/** UK / EU privacy-by-design regions (country part of an ISO 3166 code). */
export function isUkOrEu(jurisdiction: string | null | undefined): boolean {
  if (!jurisdiction) return false
  const c = jurisdiction.toUpperCase().split('-')[0]
  return c === 'GB' || c === 'UK' || EU.has(c)
}

/** Teen info badge (not a lock). */
export function privacyBadge(jurisdiction: string | null | undefined): string {
  return isUkOrEu(jurisdiction)
    ? 'UK Age Appropriate Design Code · profiling off · progress stays on this device'
    : 'COPPA (US) · data minimised'
}

/** Templates whose 3D model is a real glTF sample asset. */
export const KHRONOS_TEMPLATES = new Set(['bottle', 'camera'])
