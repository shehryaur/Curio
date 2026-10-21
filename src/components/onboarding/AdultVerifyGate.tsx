'use client'
// Required k-ID adult verification for anyone who signs up as 18+.
// Kids/teens pass straight through (kids use the parent-email consent flow instead).
// Skipped when NEXT_PUBLIC_DEMO_MODE=true so the live demo isn't blocked by email.
import type { ReactNode } from 'react'
import { useKidSession } from '@k-id/core'
import Pet from '@/components/Pet'
import VerifyAdultCard, { useVerifiedAdult } from '@/components/VerifyAdultCard'
import { IS_DEMO } from '@/lib/demo'
import type { Profile } from '@/lib/types'

export function AdultVerifyGate({ profile, children }: { profile: Profile; children: ReactNode }) {
  const { verified } = useVerifiedAdult()
  const { isLoaded } = useKidSession()
  if (IS_DEMO || profile.isMinor || verified) return <>{children}</>
  if (!isLoaded) return <div className="c-center">Checking your account…</div>
  return (
    <div className="c-page">
      <div className="c-stack">
        <Pet mood="talking" size="md" message={`One last step, ${profile.name}! Grown-ups confirm their age with k-ID before using Curio.`} />
        <VerifyAdultCard />
        <p className="c-dim">If you can&apos;t verify as an adult, use Start over in Settings and enter your real age.</p>
      </div>
    </div>
  )
}
