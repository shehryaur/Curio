'use client'

import { useState } from 'react'
import { KidSettings, KidSettingsProvider } from '@k-id/core'
import { useProfile } from '@/components/ProfileProvider'
import { kidStorage } from '@/lib/kidStorage'
import styles from './onboarding/Onboarding.module.css'

// Profile + k-ID permission settings. <KidSettings/> needs a KidSettingsProvider; ProfileProvider's one is a sibling
// (so the app never remounts), so this panel mounts its own while open — only once a k-ID session exists.
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { profile, baseMode, startOver, kid } = useProfile()
  const [settingsChallengeId] = useState(() => kidStorage.getSettingsChallengeId())

  return (
    <div className="c-stack" style={{ padding: '16px' }}>
      <div className="c-spread">
        <h2 style={{ margin: 0 }}>Settings</h2>
        <button className="c-btn secondary sm" onClick={onClose}>
          Done
        </button>
      </div>

      <section className="c-card">
        <h3 style={{ marginTop: 0 }}>{profile.name}</h3>
        <p className="c-muted" style={{ margin: '0 0 12px' }}>
          Age {profile.age} · {baseMode === 'plainWords' ? 'plain words' : baseMode} mode
          {kid.jurisdiction ? ` · ${kid.jurisdiction}` : ''}
        </p>
        <div className={styles.chips}>
          {profile.interests.length > 0 ? (
            profile.interests.map((i) => (
              <span key={i} className="c-pill soft">
                {i}
              </span>
            ))
          ) : (
            <span className="c-dim">No interests picked</span>
          )}
        </div>
      </section>

      <section className="c-card">
        {kid.sessionId ? (
          <KidSettingsProvider
            sessionId={kid.sessionId}
            challengeId={settingsChallengeId}
            onChallenge={kidStorage.setSettingsChallengeId}
          >
            <KidSettings />
          </KidSettingsProvider>
        ) : (
          <p className="c-muted" style={{ margin: 0 }}>
            {kid.status === 'pending'
              ? 'Permission settings open once your grown-up says yes ✉️'
              : 'Connecting to k-ID…'}
          </p>
        )}
      </section>

      <button
        className="c-btn secondary block"
        onClick={() => {
          if (window.confirm('Start over? This clears your name, age and grown-up approval on this device.')) startOver()
        }}
      >
        Start over
      </button>
    </div>
  )
}
