'use client'
import { useProfile } from '@/components/ProfileProvider'
import Icon from '@/components/icons/Icon'
import s from './experience.module.css'

interface Props {
  onSettings: () => void
  onDashboard: () => void
  onDeck?: () => void
  cardsCount?: number
}

export default function TopBar({ onSettings, onDeck, cardsCount }: Props) {
  const { profile, isModeOverridden, resetMode } = useProfile()
  const mode = profile.mode
  return (
    <header className={s.topbar}>
      <div className={s.topbarInner} style={{ justifyContent: 'flex-end', gap: 8 }}>
        {cardsCount !== undefined && onDeck && (
          <button className={s.cardsPill} onClick={onDeck} title="View my cards">
            <Icon name="cards" size={16} /> {cardsCount} {cardsCount === 1 ? 'card' : 'cards'}
          </button>
        )}
        <button
          onClick={onSettings}
          aria-label="Settings"
          title="Settings"
          style={{ background: 'none', border: 0, padding: 6, cursor: 'pointer', color: 'var(--text)', display: 'grid', placeItems: 'center' }}
        >
          <Icon name="settings" size={22} />
        </button>
      </div>
      {isModeOverridden && mode === 'plainWords' && (
        <div className={s.subBar}>
          <span className={s.modePill}>
            Plain words mode
            <button onClick={resetMode}>back to normal</button>
          </span>
        </div>
      )}
    </header>
  )
}
