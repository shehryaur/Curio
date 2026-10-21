'use client'

import { useEffect, useState, type ReactNode } from 'react'
import {
  KidCoreProvider,
  KidSessionProvider,
  KidAgeGate,
  KidAgeGatePass,
  KidAgeGatePending,
  KidAgeGateFail,
  KidAgeGateProhibited,
  KidAgeGateError,
} from '@k-id/core'
import { KID_BASE_URL, KID_DECLARE, KID_PUBLISHABLE_KEY } from '@/lib/kidConfig'
import { kidStorage } from '@/lib/kidStorage'

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

export function KidRoot({ children }: { children: ReactNode }) {
  // Read saved IDs after mount (localStorage is browser-only), then mount the gate once.
  const [saved, setSaved] = useState<{ sessionId?: string; challengeId?: string } | null>(null)

  useEffect(() => {
    setSaved({ sessionId: kidStorage.getSessionId(), challengeId: kidStorage.getChallengeId() })
  }, [])

  return (
    <KidCoreProvider publishableKey={KID_PUBLISHABLE_KEY} baseUrl={KID_BASE_URL} declare={KID_DECLARE}>
      {saved === null ? (
        <div className="curio-center">Loading…</div>
      ) : (
        <KidSessionProvider
          jurisdiction="auto"
          sessionId={saved.sessionId}
          challengeId={saved.challengeId}
          onSession={(sessionId) => {
            kidStorage.setSessionId(sessionId)
            kidStorage.clearChallengeId() // the parent request (if any) is resolved
          }}
          onChallenge={(challengeId) => kidStorage.setChallengeId(challengeId)}
          onClaim={(claimToken) => void sendClaimToBackend(claimToken)}
        >
          <div className="curio-gate">
            <KidAgeGate>
              <KidAgeGatePending>
                <div className="curio-card">
                  <h2>Waiting for a grown-up</h2>
                  <p>We emailed your parent or guardian. Curio opens as soon as they say yes.</p>
                </div>
              </KidAgeGatePending>
              <KidAgeGateFail>
                <div className="curio-card">
                  <h2>Not this time</h2>
                  <p>Your grown-up didn&apos;t approve, or the request expired.</p>
                </div>
              </KidAgeGateFail>
              <KidAgeGateProhibited>
                <div className="curio-card">
                  <h2>Curio isn&apos;t available yet</h2>
                  <p>You&apos;re under the minimum age where you live.</p>
                </div>
              </KidAgeGateProhibited>
              <KidAgeGateError>
                <div className="curio-card">
                  <h2>Something went wrong</h2>
                  <p>We couldn&apos;t reach k-ID. Please reload the page.</p>
                </div>
              </KidAgeGateError>
              <KidAgeGatePass>{children}</KidAgeGatePass>
            </KidAgeGate>
          </div>
        </KidSessionProvider>
      )}
    </KidCoreProvider>
  )
}
