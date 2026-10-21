'use client'
// Asks k-ID for missing permissions (one real email to the grown-up), then waits until they are approved.
// Demo mode only: a clearly labelled "Demo: approve as parent" button simulates the parent's yes.
import { useEffect, useRef, useState } from 'react'
import type { PermissionName } from '@k-id/core'
import Pet from '@/components/Pet'
import { useProfile } from '@/components/ProfileProvider'
import { useGrownupAsk } from '@/hooks/useGrownupAsk'
import { clearDemoRequest } from '@/hooks/useDemoRequests'
import s from './experience.module.css'

interface Props {
  names: readonly PermissionName[]
  /** Continue as soon as these are on (default: all of `names`). */
  waitFor?: readonly PermissionName[]
  /** What Pip says before asking. */
  question: string
  onApproved: () => void
  onCancel: () => void
}

const STATUS_TEXT: Record<string, string> = {
  idle: 'Waiting for an answer…',
  sending: 'Sending…',
  pending: 'Waiting for your grown-up to say yes…',
  error: 'Something went wrong with the note.',
}

export default function GrownupAsk({ names, waitFor, question, onApproved, onCancel }: Props) {
  const g = useGrownupAsk(names)
  const { isDemo, demoApprove } = useProfile()
  const [email, setEmail] = useState('')
  const fired = useRef(false)
  const approved = (waitFor ?? names).every((n) => g.isOn(n))

  useEffect(() => {
    if (approved && !fired.current) {
      fired.current = true
      onApproved()
    }
  }, [approved, onApproved])

  const demoButton = isDemo ? (
    <div className={s.demoBox}>
      <span className="c-badge info">DEMO ONLY</span>
      <button
        className="c-btn yellow sm"
        type="button"
        onClick={() => {
          demoApprove(g.missing)
          clearDemoRequest(g.missing)
        }}
      >
        Demo: approve as parent
      </button>
    </div>
  ) : null

  if (approved) {
    return (
      <div className={`${s.panel} ${s.center}`}>
        <Pet mood="happy" size="md" message="Yay! Your grown-up said yes. Let's go!" />
      </div>
    )
  }

  const onlyProhibited = g.missing.length > 0 && g.prohibited.length === g.missing.length
  if (onlyProhibited) {
    return (
      <div className={`${s.panel} ${s.center}`}>
        <Pet mood="oops" size="md" message="This isn't available where you live. Let's pick one of my objects instead!" />
        <button className="c-btn block" onClick={onCancel}>
          Pick an object
        </button>
      </div>
    )
  }

  if (g.phase === 'waiting') {
    return (
      <div className={`${s.panel} ${s.center}`}>
        <Pet
          mood="thinking"
          size="md"
          message={
            g.noSession
              ? "We're still waiting for your grown-up to say yes — I emailed them! Try a starter object meanwhile."
              : 'Pip sent a note to your grown-up ✉️'
          }
        />
        <span className={s.waitDots} aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <p className={s.note}>
          <span className="c-badge">k-ID · {g.noSession ? 'consent pending' : (STATUS_TEXT[g.challengeStatus] ?? g.challengeStatus)}</span>
        </p>
        <p className={s.note}>When they say yes, we&apos;ll keep going by ourselves.</p>
        {demoButton}
        <div className={s.actions}>
          <button className="c-btn secondary" onClick={() => void g.refresh()}>
            Check again
          </button>
          <button className="c-btn secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  const sending = g.phase === 'sending'
  const askEmail = g.guardianNeeded && g.needsEmail
  const emailOk = !askEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  return (
    <form
      className={`${s.panel} ${s.center}`}
      onSubmit={(e) => {
        e.preventDefault()
        if (!sending && emailOk) void g.ask(askEmail ? email : undefined)
      }}
    >
      <Pet
        mood={g.phase === 'error' ? 'oops' : 'talking'}
        size="md"
        message={g.guardianNeeded ? question : 'Let’s switch this on first!'}
      />
      {askEmail && (
        <label className={s.field}>
          <span className={s.note}>Your grown-up&apos;s email</span>
          <input
            className="c-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="grownup@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
      )}
      {g.error && <p className={s.error}>{g.error}</p>}
      <div className={s.actions}>
        <button className="c-btn" type="submit" disabled={sending || !emailOk}>
          {sending ? 'Sending…' : g.guardianNeeded ? '✉️ Ask my grown-up' : 'Turn it on'}
        </button>
        <button className="c-btn secondary" type="button" onClick={onCancel}>
          Not now
        </button>
      </div>
      {g.phase === 'error' && demoButton}
    </form>
  )
}
