'use client'
import { useProfile } from '@/components/ProfileProvider'
import { useProgress } from '@/hooks/useProgress'
import KidInspector from './KidInspector'
import { privacyBadge } from './tiers'
import s from './experience.module.css'

interface Props {
  onSettings: () => void
  onDashboard: () => void
}

export default function TopBar({ onSettings, onDashboard }: Props) {
  const { xp, streak } = useProgress()
  const { profile, isModeOverridden, resetMode, isDemo, demoPersonas, demoPersonaId, switchDemoPersona, kid } = useProfile()
  const mode = profile.mode
  return (
    <header className={s.topbar}>
      <div className={s.topbarInner}>
        <span className={s.wordmark}>Curio</span>
        <span className={s.hi}>Hi {profile.name || 'friend'}</span>
        <div className={s.pills}>
          <span className="c-pill xp" title="XP">
            ⚡ {xp}
          </span>
          <span className="c-pill streak" title="Day streak">
            🔥 {streak}
          </span>
        </div>
        <button className={s.iconBtn} onClick={onSettings} aria-label="Settings" title="Settings">
          ⚙️
        </button>
      </div>
      <div className={s.subBar}>
        {isDemo && (
          <label className={s.demoPill} title="Demo only: switch test user">
            <span>🧪 Switch test user</span>
            <select
              value={demoPersonaId ?? ''}
              onChange={(e) => switchDemoPersona(e.target.value || null)}
              aria-label="Switch test user (demo)"
            >
              <option value="">My profile</option>
              {demoPersonas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <KidInspector />
        {mode === 'adult' && (
          <button className={s.dashBtn} onClick={onDashboard}>
            👪 Grown-up dashboard
          </button>
        )}
        {isModeOverridden && mode === 'plainWords' && (
          <span className={s.modePill}>
            Plain words mode
            <button onClick={resetMode}>back to normal</button>
          </span>
        )}
      </div>
      {mode === 'teen' && (
        <div className={s.subBar}>
          <span className={`c-badge info ${s.lawBadge}`}>{privacyBadge(kid.jurisdiction)}</span>
        </div>
      )}
    </header>
  )
}
