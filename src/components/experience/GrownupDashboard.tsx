'use client'
// Adult: Grown-up dashboard — the k-ID session, how child approvals work, and (demo) pending requests.
import { useKidSession, type PermissionName } from '@k-id/core'
import { useGrownupSettings, useProfile } from '@/components/ProfileProvider'
import { clearDemoRequest, useDemoRequests } from '@/hooks/useDemoRequests'
import s from './experience.module.css'

const LABEL: Partial<Record<PermissionName, string>> = {
  'camera-access': 'Use the camera',
  'ai-media-upload': 'Send a photo to the AI',
  'ai-media-generation': 'Make a 3D model from a photo',
  'ai-chat': 'Type questions to Pip',
  'ai-voice-mode': 'Talk to Pip',
  'personalized-recommendations': 'Lessons adapted to the learner',
}

export default function GrownupDashboard({ onClose }: { onClose: () => void }) {
  const { session } = useKidSession()
  const settings = useGrownupSettings()
  const { kid, isDemo, demoApprove, demoApproved, effectiveCan } = useProfile()
  const demoPending = useDemoRequests().filter((n) => !effectiveCan(n))
  const perms = session?.permissions ?? settings?.permissions ?? []
  const realPending = settings?.challenge.status === 'pending' ? settings.challenge.permissions : []

  return (
    <div className={s.dash}>
      <div className={s.dashHead}>
        <h2>Grown-up dashboard</h2>
        <button className="c-btn secondary sm" onClick={onClose}>
          Done
        </button>
      </div>

      <section className={s.panel}>
        <h3>k-ID session</h3>
        <div className={s.badges}>
          <span className="c-badge">status: {kid.status}</span>
          <span className="c-badge">ageStatus: {session?.ageStatus ?? '—'}</span>
          <span className="c-badge">jurisdiction: {kid.jurisdiction ?? 'unknown'}</span>
          <span className="c-badge">session: {kid.sessionId ? `${kid.sessionId.slice(0, 8)}…` : 'none'}</span>
        </div>
        <div className={s.permList}>
          {perms.length === 0 && <p className={s.note}>No permissions yet (the session starts after the age check).</p>}
          {perms.map((p) => {
            const on = effectiveCan(p.name)
            return (
              <div key={p.name} className={s.permRow}>
                <span>{LABEL[p.name] ?? p.name}</span>
                <span className={s.badges}>
                  <span className={`c-badge ${on ? 'on' : 'off'}`}>
                    {p.name}: {on ? 'on' : 'off'}
                    {on && !p.enabled && demoApproved.includes(p.name) ? ' (demo)' : ''}
                  </span>
                  {p.managedBy && <span className="c-badge info">{p.managedBy.toLowerCase()}</span>}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <section className={s.panel}>
        <h3>How child approvals work</h3>
        <ol className={s.steps}>
          <li>A child asks to use something new, like snapping a photo of their own object.</li>
          <li>Curio asks k-ID. k-ID emails the parent or guardian, with nothing shared yet; the photo stays on the device.</li>
          <li>The parent approves in k-ID&apos;s email. Curio checks every few seconds and carries on by itself.</li>
          <li>Built-in objects always work, so a child is never locked out while waiting.</li>
        </ol>
        {realPending.length > 0 && (
          <div className={s.badges}>
            <span className="c-badge info">waiting on email:</span>
            {realPending.map((n) => (
              <span key={n} className="c-badge">
                {n}
              </span>
            ))}
          </div>
        )}
      </section>

      {isDemo && (
        <section className={`${s.panel} ${s.demoPanel}`}>
          <h3>
            <span className="c-badge info">DEMO ONLY</span> Pending requests
          </h3>
          {demoPending.length === 0 ? (
            <p className={s.note}>No pending requests. Switch to Leo and tap &ldquo;Show Pip something new&rdquo; to make one.</p>
          ) : (
            demoPending.map((n) => (
              <div key={n} className={s.permRow}>
                <span>{LABEL[n] ?? n}</span>
                <button
                  className="c-btn sm"
                  onClick={() => {
                    demoApprove([n])
                    clearDemoRequest([n])
                  }}
                >
                  Approve
                </button>
              </div>
            ))
          )}
        </section>
      )}
    </div>
  )
}
