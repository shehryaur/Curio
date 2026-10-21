'use client'

import { KidSettings, KidSettingsProvider, useKidSession } from '@k-id/core'
import { kidStorage } from '@/lib/kidStorage'

// Lets players turn permissions on/off later; guardian-managed ones ask a grown-up to approve.
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { sessionId } = useKidSession()

  return (
    <div className="curio-card">
      <div className="curio-row">
        <h2>Settings</h2>
        <button className="curio-btn ghost" onClick={onClose}>
          Done
        </button>
      </div>
      {sessionId ? (
        <KidSettingsProvider
          sessionId={sessionId}
          challengeId={kidStorage.getSettingsChallengeId()}
          onChallenge={(id) => kidStorage.setSettingsChallengeId(id)}
        >
          <KidSettings />
        </KidSettingsProvider>
      ) : (
        <p>Loading your session…</p>
      )}
    </div>
  )
}
