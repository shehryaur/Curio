'use client'
import { useState } from 'react'
import { useProfile } from '@/components/ProfileProvider'
import { TEMPLATE_ORDER, TEMPLATES } from '@/lib/templates'
import type { AgeMode, TemplateId } from '@/lib/types'
import { CARD_COLORS, type SavedCard } from '@/lib/cards'
import PetCloud from './PetCloud'
import Icon, { type IconName } from '@/components/icons/Icon'
import s from './experience.module.css'

interface Props {
  onSnap: () => void
  onTemplate: (id: TemplateId) => void
  onOpenCard?: (card: SavedCard) => void
  cards?: SavedCard[]
}

const GREETING: Record<AgeMode, (n: string) => string> = {
  child: (n) => `Hi ${n}! Tap my thought cloud to ask anything, or pick a card below!`,
  teen: (n) => `Hey ${n}! What are you curious about today? Ask me or tap a card.`,
  adult: (n) => `Welcome, ${n}. Tap a discovery card or point your camera to inspect an object.`,
  plainWords: (n) => `Hello ${n}. Tap any card below to learn about it.`,
}

// Built-in cards shown on explore screen (inspired by Page 1 of PDF)
const EXPLORE_ITEMS: Array<{
  id: string
  name: string
  emoji: string
  color: string
  templateId?: TemplateId
}> = [
  { id: 'autumn-leaf', name: 'Autumn leaf', emoji: '🍂', color: '#EA580C' },
  { id: 'the-moon', name: 'The Moon', emoji: '🌙', color: '#1E293B' },
  { id: 'honeybee', name: 'Honeybee', emoji: '🐝', color: '#EAB308' },
  { id: 'bottle', name: 'Water bottle', emoji: '💧', color: '#0284C7', templateId: 'bottle' },
  { id: 'camera', name: 'Antique camera', emoji: '📷', color: '#D97706', templateId: 'camera' },
  { id: 'book', name: 'Book', emoji: '📖', color: '#4F46E5', templateId: 'book' },
  { id: 'phone', name: 'Phone', emoji: '📱', color: '#7C3AED', templateId: 'phone' },
  { id: 'charger', name: 'Wall charger', emoji: '🔌', color: '#059669', templateId: 'charger' },
  { id: 'mug', name: 'Mug', emoji: '☕', color: '#E11D48', templateId: 'mug' },
  { id: 'pencil', name: 'Pencil', emoji: '✏️', color: '#F59E0B', templateId: 'pencil' },
]

const ITEM_ICONS: Record<string, IconName> = {
  'autumn-leaf': 'leaf', 'the-moon': 'moon', honeybee: 'bee', bottle: 'bottle', camera: 'camera',
  book: 'book', phone: 'phone', charger: 'plug', mug: 'mug', pencil: 'pencil',
}

export default function HomeScreen({ onSnap, onTemplate, onOpenCard, cards }: Props) {
  const { profile, kid, effectiveCan } = useProfile()
  const mode = profile.mode
  const canCamera = effectiveCan('camera-access')

  const handleCardClick = (item: (typeof EXPLORE_ITEMS)[0]) => {
    if (item.templateId) {
      onTemplate(item.templateId)
      return
    }
    // Check if matching card exists in saved cards
    const matched = cards?.find((c) => c.id === item.id)
    if (matched && onOpenCard) {
      onOpenCard(matched)
      return
    }
    // Fallback template
    onTemplate('bottle')
  }

  return (
    <div className={s.homeContainer}>
      {/* Title Section (Page 1) */}
      <section className={s.headerHero}>
        <h1 className={s.mainHeadline}>Hi, {profile.name || 'explorer'}!</h1>
        <p className={s.mainSubhead}>Tap something to discover it.</p>
      </section>

      {/* Pip with Interactive Thought Cloud */}
      <section className={s.pipSection} style={{ position: 'relative' }}>
        <button
          onClick={onSnap}
          aria-label={canCamera ? 'Point your camera' : 'Use my camera (a grown-up says yes first)'}
          title={canCamera ? 'Point your camera' : 'A grown-up needs to say yes first'}
          style={{
            position: 'absolute', left: 24, bottom: 22, zIndex: 2, width: 60, height: 60, padding: 0,
            border: 0, background: 'none', color: 'var(--text, #1d1b29)', display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}
        >
          <Icon name={canCamera ? 'camera' : 'lock'} size={46} />
        </button>
        <PetCloud
          mode={mode}
          profile={profile}
          initialMessage={GREETING[mode](profile.name || 'friend')}
          size="md"
        />
      </section>

      {/* Grid of Discovery Cards (Page 1) */}
      <div className={s.discoveryGrid}>
        {EXPLORE_ITEMS.map((item) => (
          <button
            key={item.id}
            className={s.discoveryCard}
            style={{ backgroundColor: item.color }}
            onClick={() => handleCardClick(item)}
          >
            <span className={s.discoveryEmoji} aria-hidden>
              <Icon name={ITEM_ICONS[item.id] ?? 'sparkle'} size={30} />
            </span>
            <span className={s.discoveryTitle}>{item.name}</span>
          </button>
        ))}
      </div>


    </div>
  )
}
