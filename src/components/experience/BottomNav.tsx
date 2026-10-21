'use client'
import Icon from '@/components/icons/Icon'
import s from './experience.module.css'

interface Props {
  active: 'explore' | 'deck' | 'family'
  cardsCount: number
  isAdult?: boolean
  onExplore: () => void
  onDeck: () => void
  onFamily?: () => void
}

export default function BottomNav({ active, cardsCount, isAdult, onExplore, onDeck, onFamily }: Props) {
  return (
    <nav className={s.bottomNav} aria-label="Main Navigation">
      <button
        className={`${s.navTab} ${active === 'explore' ? s.navTabActive : ''}`}
        onClick={onExplore}
      >
        <span className={s.navIcon} aria-hidden>
          <Icon name="explore" size={22} />
        </span>
        <span className={s.navLabel}>Explore</span>
      </button>

      <button
        className={`${s.navTab} ${active === 'deck' ? s.navTabActive : ''}`}
        onClick={onDeck}
        data-tour="mycards"
      >
        <span className={s.navIcon} aria-hidden>
          <Icon name="cards" size={22} />
        </span>
        <span className={s.navLabel}>
          My cards
          {cardsCount > 0 && <span className={s.navBadge}>{cardsCount}</span>}
        </span>
      </button>

      {isAdult && onFamily && (
        <button
          className={`${s.navTab} ${active === 'family' ? s.navTabActive : ''}`}
          onClick={onFamily}
        >
          <span className={s.navIcon} aria-hidden>
            <Icon name="family" size={22} />
          </span>
          <span className={s.navLabel}>Family</span>
        </button>
      )}
    </nav>
  )
}
