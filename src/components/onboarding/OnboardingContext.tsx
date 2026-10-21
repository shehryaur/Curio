'use client'

import { createContext, useContext } from 'react'
import type { AgeSignal } from '@k-id/core'
import type { OnboardingDraft } from '@/lib/kidStorage'

/**
 * Onboarding state that KidRoot owns and feeds into <KidSessionProvider> as props (k-ID headless mode).
 * The chat renders INSIDE the provider and drives the flow through these setters.
 */
export interface OnboardingContextValue {
  /** Concrete ISO code the player picked (e.g. 'GB', 'US-CA'), 'auto' (k-ID resolves it from the IP) as the
   * fallback, or undefined before the country question is answered (k-ID waits; nothing is fetched yet). */
  jurisdiction: string | undefined
  age: AgeSignal | undefined
  email: string | undefined
  /** Answers saved so far (survive a reload while a grown-up's approval is pending). */
  draft: OnboardingDraft
  /** What this provider mount resumes from storage: an established session, a pending challenge, or nothing. */
  resuming: 'session' | 'challenge' | null
  setJurisdiction: (code: string) => void
  setAge: (signal: AgeSignal) => void
  setEmail: (email: string | undefined) => void
  updateDraft: (patch: Partial<OnboardingDraft>) => void
  /** Fresh k-ID flow: clears saved ids and remounts the session provider. keepAnswers re-uses name/age/interests. */
  restart: (opts?: { keepAnswers?: boolean; jurisdiction?: string }) => void
  /** Remount the session provider with the same saved ids (retry after a network error while resuming). */
  retry: () => void
  /** Wipe profile + every saved id and reload the page. */
  startOver: () => void
}

export const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding() must be used inside <KidRoot>.')
  return ctx
}
