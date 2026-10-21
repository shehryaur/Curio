'use client'
// "Verify I'm an adult" — sends the k-ID age-verification link by email (k-ID's page may offer a face
// age estimate or an ID check, depending on the country). Curio never sees the face or ID; it only gets
// the verified result on the session (useKidSession().ageVerification). Self-contained: drop it into the
// grown-up dashboard or settings.
import { useState } from 'react'
import {
  KidSessionVerifyAge,
  KidSessionVerifyAgeError,
  KidSessionVerifyAgeFail,
  KidSessionVerifyAgePass,
  KidSessionVerifyAgePending,
  useKidAgeGate,
  useKidSession,
} from '@k-id/core'
import Icon from '@/components/icons/Icon'

/** True once k-ID has verified this session's age is at least the jurisdiction's adult age. */
export function useVerifiedAdult(): { verified: boolean; verifiedAge: number | null; civilAge: number | null } {
  const { ageVerification } = useKidSession()
  const { requirements } = useKidAgeGate()
  const civilAge = requirements?.civilAge ?? 18
  const verifiedAge = ageVerification?.verifiedAge ?? null
  return { verified: verifiedAge !== null && verifiedAge >= civilAge, verifiedAge, civilAge }
}

export default function VerifyAdultCard({ onVerified }: { onVerified?: () => void }) {
  const { verified } = useVerifiedAdult()
  const { sessionId } = useKidSession()
  const [open, setOpen] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const box: React.CSSProperties = {
    background: '#fff',
    border: '1.5px solid var(--border, #E6E4DD)',
    borderRadius: 12,
    padding: 16,
    display: 'grid',
    gap: 10,
  }

  if (verified) {
    return (
      <div style={box}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 700 }}>
          <Icon name="shield" /> Verified adult (k-ID)
        </div>
      </div>
    )
  }

  if (!sessionId) {
    return (
      <div style={box}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 700 }}>
          <Icon name="shield" /> Verify you&apos;re an adult
        </div>
        <p style={{ margin: 0, color: 'var(--text-muted, #6f6b62)' }}>Available once your Curio account is set up.</p>
      </div>
    )
  }

  return (
    <div style={box}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 700 }}>
        <Icon name="shield" /> Verify you&apos;re an adult
      </div>
      <p style={{ margin: 0, color: 'var(--text-muted, #6f6b62)' }}>
        Grown-up tools (approving kids&apos; requests) need a verified adult. k-ID emails you a secure link; Curio never
        sees your face or ID.
      </p>
      {!open ? (
        <button className="c-btn" onClick={() => setOpen(true)}>
          Verify with k-ID
        </button>
      ) : (
        // key remount = retry with a new email after a fail / error
        <div key={attempt}>
          <KidSessionVerifyAge onSent={({ email }) => setSentTo(email)}>
            <KidSessionVerifyAgePending>
              <p style={{ margin: 0 }}>
                Check your email{sentTo ? ` (${sentTo})` : ''} and follow k-ID&apos;s link. This updates by itself when you&apos;re done.
              </p>
            </KidSessionVerifyAgePending>
            <KidSessionVerifyAgePass>
              <PassNotice onVerified={onVerified} />
            </KidSessionVerifyAgePass>
            <KidSessionVerifyAgeFail>
              <p style={{ margin: 0 }}>We couldn&apos;t verify an adult age.</p>
              <button className="c-btn secondary sm" onClick={() => setAttempt((n) => n + 1)}>
                Try again
              </button>
            </KidSessionVerifyAgeFail>
            <KidSessionVerifyAgeError>
              <p style={{ margin: 0 }}>k-ID couldn&apos;t be reached.</p>
              <button className="c-btn secondary sm" onClick={() => setAttempt((n) => n + 1)}>
                Retry
              </button>
            </KidSessionVerifyAgeError>
          </KidSessionVerifyAge>
        </div>
      )}
    </div>
  )
}

function PassNotice({ onVerified }: { onVerified?: () => void }) {
  const [done] = useState(() => {
    onVerified?.()
    return true
  })
  return done ? (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 700 }}>
      <Icon name="check" /> Verified adult
    </div>
  ) : null
}
