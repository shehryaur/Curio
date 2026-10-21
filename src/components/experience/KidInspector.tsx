'use client'
// Compact k-ID inspector pill: age status, jurisdiction and the permission map, in mono.
import { useState } from 'react'
import { useKidSession } from '@k-id/core'
import { useProfile } from '@/components/ProfileProvider'
import s from './experience.module.css'

export default function KidInspector() {
  const [open, setOpen] = useState(false)
  const { session } = useKidSession()
  const { kid, effectiveCan, demoApproved } = useProfile()
  const ageStatus = session?.ageStatus ?? (kid.status === 'pending' ? 'PENDING' : '—')
  const perms = session?.permissions ?? []
  return (
    <div className={s.popWrap}>
      <button className={s.kidPill} onClick={() => setOpen((o) => !o)} aria-expanded={open} title="k-ID session">
        k-ID · {kid.jurisdiction ?? '??'}
      </button>
      {open && (
        <div className={s.popover} role="dialog" aria-label="k-ID inspector">
          <div className={s.monoGrid}>
            <span>status</span>
            <b>{kid.status}</b>
            <span>ageStatus</span>
            <b>{ageStatus}</b>
            <span>jurisdiction</span>
            <b>{kid.jurisdiction ?? 'unknown'}</b>
            <span>session</span>
            <b>{kid.sessionId ? `${kid.sessionId.slice(0, 8)}…` : 'none yet'}</b>
          </div>
          <div className={s.badges}>
            {perms.length === 0 && <span className="c-badge off">no permissions yet</span>}
            {perms.map((p) => {
              const on = effectiveCan(p.name)
              const demo = !p.enabled && demoApproved.includes(p.name)
              return (
                <span key={p.name} className={`c-badge ${on ? 'on' : 'off'}`} title={p.managedBy ?? ''}>
                  {p.name}: {on ? 'on' : 'off'}
                  {demo ? ' (demo)' : ''}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
