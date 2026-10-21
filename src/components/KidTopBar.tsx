// Persona switcher (Child 8 US / Teen 14 UK / Adult / Senior) + live k-ID JSON inspector. Owner: Sruthi
'use client'

import { useKidSession } from '@k-id/core'
import { PERSONAS } from '@/lib/personas'
import type { AgeMode } from '@/lib/types'

const MODE_LABEL: Record<AgeMode, string> = {
  child: 'Child',
  teen: 'Teen',
  adult: 'Adult',
  plainWords: 'Plain words',
}

interface Props {
  personaId: string | null
  onPersona: (id: string | null) => void
  kidMode: AgeMode
  mode: AgeMode
  personalized: boolean
  onSettings: () => void
}

export function KidTopBar({ personaId, onPersona, kidMode, mode, personalized, onSettings }: Props) {
  const { session, permissions, sessionId } = useKidSession()

  return (
    <header className="curio-card curio-topbar">
      <div className="curio-row">
        <h1>Curio</h1>
        <button className="curio-btn ghost" onClick={onSettings}>
          Settings
        </button>
      </div>
      <div className="curio-row curio-wrap">
        <label className="curio-field">
          <span>Who&apos;s watching (demo)</span>
          <select
            className="curio-input"
            value={personaId ?? ''}
            onChange={(e) => onPersona(e.target.value || null)}
          >
            <option value="">k-ID default ({MODE_LABEL[kidMode]})</option>
            {PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <span className="curio-badge">
          Mode: {MODE_LABEL[mode]}
          {!personalized && ' (standard)'}
        </span>
      </div>
      <details className="curio-inspector">
        <summary>k-ID inspector</summary>
        <pre>
          {JSON.stringify(
            {
              sessionId,
              ageStatus: session?.ageStatus ?? null,
              jurisdiction: session?.jurisdiction ?? null,
              ageVerification: session?.ageVerification ?? null,
              permissions,
            },
            null,
            2,
          )}
        </pre>
      </details>
    </header>
  )
}
