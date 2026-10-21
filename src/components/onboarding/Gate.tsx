'use client'

import { useState, type ReactNode } from 'react'
import { useKidAgeGate } from '@k-id/core'
import Pet from '@/components/Pet'
import { ProfileProvider } from '@/components/ProfileProvider'
import { kidStorage } from '@/lib/kidStorage'
import { clearProfile, loadProfile, saveProfile } from '@/lib/profile'
import type { Profile } from '@/lib/types'
import { useOnboarding } from './OnboardingContext'
import { OnboardingChat } from './OnboardingChat'
import styles from './Onboarding.module.css'

export function PipLoading({ text = 'Loading…' }: { text?: string }) {
  return (
    <div className={styles.loading}>
      <Pet mood="thinking" size="md" />
      <p className="c-muted">{text}</p>
    </div>
  )
}

function PipScreen({ text, actions }: { text: string; actions: ReactNode }) {
  return (
    <div className={styles.loading}>
      <Pet mood="oops" size="md" />
      <p className={styles.centerText}>{text}</p>
      <div className={styles.actions}>{actions}</div>
    </div>
  )
}

/**
 * Saved profile + k-ID session/consent -> the app; otherwise the onboarding chat.
 * The app also opens while consent is 'pending' (limited mode), and upgrades in place when it passes.
 */
export function Gate({ children }: { children: ReactNode }) {
  const ob = useOnboarding()
  const gate = useKidAgeGate()
  // KidRoot only keeps a stored profile when a session or pending consent is saved alongside it.
  const [profile, setProfile] = useState<Profile | null>(() => (ob.resuming ? loadProfile() : null))

  if (profile) {
    const resumingSession = ob.resuming === 'session'
    const inApp =
      (gate.status === 'pass' && !!gate.sessionId) ||
      gate.status === 'pending' ||
      (gate.status === 'error' && !resumingSession)
    if (inApp) return <ProfileProvider profile={profile}>{children}</ProfileProvider>

    if (gate.status === 'running' || gate.status === 'pass') return <PipLoading text={`Welcome back, ${profile.name}!`} />

    const tryAgain = () => {
      clearProfile()
      setProfile(null)
      ob.restart({ keepAnswers: true })
    }
    if (gate.status === 'fail') {
      return (
        <PipScreen
          text="Your grown-up didn't approve this time. That's okay! We can ask again."
          actions={
            <>
              <button className={`c-btn ${styles.big}`} onClick={tryAgain}>
                Try again
              </button>
              <button className={`c-btn secondary ${styles.big}`} onClick={ob.startOver}>
                Start over
              </button>
            </>
          }
        />
      )
    }
    if (gate.status === 'prohibited') {
      return (
        <PipScreen
          text="Aww, Curio isn't open for kids your age where you live yet. Ask a grown-up to help you find other fun ways to learn! 💚"
          actions={
            <button className={`c-btn secondary ${styles.big}`} onClick={ob.startOver}>
              Start over
            </button>
          }
        />
      )
    }
    // error while resuming a saved session
    return (
      <PipScreen
        text="Oops! I couldn't open your saved spot."
        actions={
          <>
            <button className={`c-btn ${styles.big}`} onClick={ob.retry}>
              Try again
            </button>
            <button className={`c-btn secondary ${styles.big}`} onClick={ob.startOver}>
              Start over
            </button>
          </>
        }
      />
    )
  }

  return (
    <OnboardingChat
      onComplete={(p, { pending }) => {
        saveProfile(p)
        if (!pending) kidStorage.clearDraft() // pending: the draft keeps the email for Resend after a reload
        setProfile(p)
      }}
    />
  )
}
