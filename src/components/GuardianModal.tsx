// k-ID parental consent challenge (QR/OTP) for locked hazard pins. Owner: Sruthi
// Implementation: a grown-up proves they are an adult via <KidSessionVerifyAge> (k-ID emails a link);
// on Pass the hazard lessons unlock for this browser session only (state in useCurioSession).
'use client'

import { useEffect, useRef } from 'react'
import {
  KidSessionVerifyAge,
  KidSessionVerifyAgeError,
  KidSessionVerifyAgeFail,
  KidSessionVerifyAgePass,
  KidSessionVerifyAgePending,
} from '@k-id/core'

function UnlockOnPass({ onUnlock }: { onUnlock: () => void }) {
  const cb = useRef(onUnlock)
  cb.current = onUnlock
  useEffect(() => {
    const t = setTimeout(() => cb.current(), 800) // brief "verified" flash, then close
    return () => clearTimeout(t)
  }, [])
  return <p>Grown-up verified! Unlocking the safety lesson…</p>
}

interface Props {
  partName?: string
  onUnlock: () => void
  onCancel: () => void
}

export function GuardianModal({ partName, onUnlock, onCancel }: Props) {
  return (
    <div className="curio-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="curio-guardian-title">
      <div className="curio-card curio-modal">
        <h2 id="curio-guardian-title">🔒 Grown-up needed</h2>
        <p>
          {partName ? <strong>{partName}</strong> : 'This part'} is a safety lesson (it can be hot, sharp or carry
          electricity). A grown-up can unlock it by confirming they&apos;re an adult with k-ID.
        </p>
        <KidSessionVerifyAge>
          <KidSessionVerifyAgePass>
            <UnlockOnPass onUnlock={onUnlock} />
          </KidSessionVerifyAgePass>
          <KidSessionVerifyAgePending>
            <p>Check the grown-up&apos;s email and tap the link. This unlocks as soon as they finish.</p>
          </KidSessionVerifyAgePending>
          <KidSessionVerifyAgeFail>
            <p className="curio-error">We couldn&apos;t confirm an adult. The lesson stays locked.</p>
          </KidSessionVerifyAgeFail>
          <KidSessionVerifyAgeError>
            <p className="curio-error">We couldn&apos;t reach k-ID. Try again later.</p>
          </KidSessionVerifyAgeError>
        </KidSessionVerifyAge>
        <button className="curio-btn ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
