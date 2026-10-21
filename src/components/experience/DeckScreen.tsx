'use client'
import { useState } from 'react'
import type { AgeMode } from '@/lib/types'
import { CARD_COLORS, type SavedCard } from '@/lib/cards'
import s from './experience.module.css'

interface Props {
  cards: SavedCard[]
  mode: AgeMode
  onOpenCard: (card: SavedCard) => void
  onSnap: () => void
}

function cardTitle(card: SavedCard, mode: AgeMode): string {
  if (typeof card.title === 'string') return card.title
  return card.title[mode] || card.title.child || 'Discovery'
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function DeckScreen({ cards, mode, onOpenCard, onSnap }: Props) {
  const [filter, setFilter] = useState<'all' | 'scans' | 'starter'>('all')

  const filtered = cards.filter((c) => {
    if (filter === 'scans') return c.kind === 'photo'
    if (filter === 'starter') return c.kind === 'template'
    return true
  })

  return (
    <div className={s.deckWrap}>
      <header className={s.deckHeader}>
        <div>
          <h1 className={s.deckTitle}>My Cards</h1>
          <p className={s.deckSub}>
            {cards.length} {cards.length === 1 ? 'discovery' : 'discoveries'} saved in your deck
          </p>
        </div>
        <button className={s.deckSnapBtn} onClick={onSnap} title="Scan a new object">
          📸 Scan
        </button>
      </header>

      <div className={s.filterRow}>
        <button
          className={`${s.filterChip} ${filter === 'all' ? s.filterActive : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({cards.length})
        </button>
        <button
          className={`${s.filterChip} ${filter === 'scans' ? s.filterActive : ''}`}
          onClick={() => setFilter('scans')}
        >
          Scanned ({cards.filter((c) => c.kind === 'photo').length})
        </button>
        <button
          className={`${s.filterChip} ${filter === 'starter' ? s.filterActive : ''}`}
          onClick={() => setFilter('starter')}
        >
          Starters ({cards.filter((c) => c.kind === 'template').length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className={s.emptyDeck}>
          <span className={s.emptyEmoji} aria-hidden>
            🪪
          </span>
          <h3>No cards here yet!</h3>
          <p>Point your camera at anything around you to add a new card to your deck.</p>
          <button className={`c-btn ${s.emptySnapBtn}`} onClick={onSnap}>
            📸 Point your camera
          </button>
        </div>
      ) : (
        <div className={s.deckGrid}>
          {filtered.map((card, idx) => {
            const title = cardTitle(card, mode)
            const bg = card.color || CARD_COLORS[idx % CARD_COLORS.length]
            return (
              <button
                key={card.id}
                className={s.deckCard}
                style={{ backgroundColor: bg }}
                onClick={() => onOpenCard(card)}
              >
                <div className={s.deckCardTop}>
                  <span className={s.deckCardEmoji} aria-hidden>
                    {card.emoji}
                  </span>
                  <span className={s.deckCardTime}>{timeAgo(card.discoveredAt)}</span>
                </div>
                <div className={s.deckCardBottom}>
                  <span className={s.deckCardName}>{title}</span>
                  <span className={s.deckCardBadge}>
                    {card.kind === 'photo' ? '📷 Scanned' : '✨ 3D Model'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
