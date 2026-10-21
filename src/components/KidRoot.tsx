'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { KidCoreProvider, KidSessionProvider, type AgeSignal } from '@k-id/core'
import { KID_BASE_URL, KID_DECLARE, KID_PUBLISHABLE_KEY } from '@/lib/kidConfig'
import { kidStorage, type OnboardingDraft } from '@/lib/kidStorage'
import { clearProfile, loadProfile, modeFromAge, saveProfile } from '@/lib/profile'
import { OnboardingContext, type OnboardingContextValue } from './onboarding/OnboardingContext'
import { Gate, PipLoading } from './onboarding/Gate'

async function sendClaimToBackend(claimToken: string) {
  try {
    await fetch('/api/kid/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claimToken }),
    })
  } catch (err) {
    console.error('[curio] claim failed', err)
  }
}

function draftAge(d: OnboardingDraft): AgeSignal | undefined {
  if (d.dateOfBirth) return { dateOfBirth: d.dateOfBirth }
  if (typeof d.age === 'number') return { age: d.age }
  return undefined
}

function startOver() {
  clearProfile()
  kidStorage.clearAll()
  window.location.reload()
}

type Ids = { sessionId?: string; challengeId?: string }

export function KidRoot({ children }: { children: ReactNode }) {
  // Saved state is read after mount (localStorage is browser-only), then the provider mounts once.
  const [booted, setBooted] = useState(false)
  const [ids, setIds] = useState<Ids>({})
  const [draft, setDraft] = useState<OnboardingDraft>({})
  const [jurisdiction, setJurisdiction] = useState<string | undefined>(undefined)
  const [age, setAgeState] = useState<AgeSignal | undefined>(undefined)
  const [email, setEmail] = useState<string | undefined>(undefined)
  const [providerKey, setProviderKey] = useState(0)

  useEffect(() => {
    let profile = loadProfile()
    let sessionId = kidStorage.getSessionId()
    let challengeId = kidStorage.getChallengeId()
    let d = kidStorage.getDraft() ?? {}

    if (sessionId && !profile) {
      // A session without a profile: onboarding never finished. Start fresh.
      kidStorage.clearAll()
      sessionId = challengeId = undefined
      d = {}
    }
    if (!sessionId && challengeId && !(d.name && d.email && draftAge(d))) {
      kidStorage.clearChallengeId()
      challengeId = undefined
    }
    if (!sessionId && challengeId && !profile && d.name && draftAge(d)) {
      // Consent was sent but the page closed before the profile was saved: the app opens in limited mode anyway.
      const age = d.age ?? 0
      profile = { name: d.name, age, interests: d.interests ?? [], mode: modeFromAge(age), isMinor: age < 18 }
      saveProfile(profile)
    }
    if (profile && !sessionId && !challengeId) {
      clearProfile()
      profile = null
    }
    if (!sessionId && !challengeId && Object.keys(d).length > 0) {
      // Reloaded mid-chat before anything was sent: the chat simply starts over.
      kidStorage.clearDraft()
      d = {}
    }

    setIds(sessionId ? { sessionId } : challengeId ? { challengeId } : {})
    setDraft(d)
    if (d.jurisdiction) setJurisdiction(d.jurisdiction)
    if (challengeId) {
      // Resuming a pending consent: the SDK only takes these at mount (submit() re-sends to this email).
      setAgeState(draftAge(d))
      setEmail(d.email)
    }
    setBooted(true)
  }, [])

  const updateDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch }
      kidStorage.setDraft(next)
      return next
    })
  }, [])

  const restart = useCallback(
    (opts?: { keepAnswers?: boolean; jurisdiction?: string }) => {
      kidStorage.clearIds()
      setIds({})
      setEmail(undefined)
      if (opts?.keepAnswers) {
        // Re-send the age at mount only when the chat was complete; otherwise the chat re-asks from where it was.
        setAgeState(draft.interests?.length ? draftAge(draft) : undefined)
        if (opts.jurisdiction) {
          setJurisdiction(opts.jurisdiction)
          updateDraft({ jurisdiction: opts.jurisdiction })
        }
      } else {
        kidStorage.clearDraft()
        setDraft({})
        setAgeState(undefined)
        setJurisdiction(opts?.jurisdiction)
      }
      setProviderKey((k) => k + 1)
    },
    [draft, updateDraft],
  )

  // Remount with whatever ids are saved NOW (a pending consent started this visit resumes instead of restarting).
  const retry = useCallback(() => {
    const sessionId = kidStorage.getSessionId()
    const challengeId = kidStorage.getChallengeId()
    setIds(sessionId ? { sessionId } : challengeId ? { challengeId } : {})
    if (!sessionId && challengeId) {
      const d = kidStorage.getDraft() ?? {}
      setAgeState(draftAge(d))
      setEmail(d.email)
    }
    setProviderKey((k) => k + 1)
  }, [])

  const value = useMemo<OnboardingContextValue>(
    () => ({
      jurisdiction,
      age,
      email,
      draft,
      resuming: ids.sessionId ? 'session' : ids.challengeId ? 'challenge' : null,
      setJurisdiction,
      setAge: setAgeState,
      setEmail,
      updateDraft,
      restart,
      retry,
      startOver,
    }),
    [jurisdiction, age, email, draft, ids, updateDraft, restart, retry],
  )

  return (
    <KidCoreProvider publishableKey={KID_PUBLISHABLE_KEY} baseUrl={KID_BASE_URL} declare={KID_DECLARE}>
      {!booted ? (
        <PipLoading />
      ) : (
        <OnboardingContext.Provider value={value}>
          <KidSessionProvider
            key={providerKey}
            jurisdiction={jurisdiction}
            age={age}
            email={email}
            sessionId={ids.sessionId}
            challengeId={ids.challengeId}
            onSession={(sessionId) => {
              kidStorage.setSessionId(sessionId)
              kidStorage.clearChallengeId() // the parent request (if any) is resolved
            }}
            onChallenge={(challengeId) => kidStorage.setChallengeId(challengeId)}
            onClaim={(claimToken) => void sendClaimToBackend(claimToken)}
          >
            <Gate>{children}</Gate>
          </KidSessionProvider>
        </OnboardingContext.Provider>
      )}
    </KidCoreProvider>
  )
}
