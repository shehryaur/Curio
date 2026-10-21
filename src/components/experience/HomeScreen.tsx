'use client'
import { useState } from 'react'
import Pet from '@/components/Pet'
import { useProfile } from '@/components/ProfileProvider'
import { TEMPLATE_ORDER, TEMPLATES } from '@/lib/templates'
import type { AgeMode, PetMood, TemplateId } from '@/lib/types'
import s from './experience.module.css'

interface Props {
  onSnap: () => void
  onTemplate: (id: TemplateId) => void
}

const GREETING: Record<AgeMode, (n: string) => string> = {
  child: (n) => `Hi ${n}! I'm Pip. What should we look at today?`,
  teen: (n) => `Hey ${n}! Pick something and let's see how it works.`,
  adult: (n) => `Welcome, ${n}. Choose an object to explore, or show me one of yours.`,
  plainWords: (n) => `Hello ${n}. Pick one thing to learn about.`,
}

const WAITING = "We're still waiting for your grown-up to say yes — I emailed them! Try a starter object meanwhile."

export default function HomeScreen({ onSnap, onTemplate }: Props) {
  const { profile, kid } = useProfile()
  const mode = profile.mode
  const [pip, setPip] = useState<{ mood: PetMood; message: string } | null>(null)
  // Before a k-ID session exists only the starter shelf works (kids are never locked out).
  const limited = !kid.ready

  return (
    <>
      <section className={s.hero}>
        <Pet mood={pip?.mood ?? 'happy'} size="lg" message={pip?.message ?? GREETING[mode](profile.name || 'friend')} />
        <button
          className={`c-btn ${mode === 'plainWords' ? 'yellow giant' : ''} ${s.cta}`}
          onClick={() => {
            if (limited) setPip({ mood: 'thinking', message: WAITING })
            else onSnap()
          }}
        >
          📸 Show Pip something new
        </button>
      </section>
      <h2 className={s.sectionTitle}>{mode === 'child' ? 'Or pick one of these' : 'Or start with one of these'}</h2>
      <div className={s.grid}>
        {TEMPLATE_ORDER.map((id) => {
          const t = TEMPLATES[id]
          if (!t) return null
          return (
            <button key={id} className={s.tcard} onClick={() => onTemplate(id)}>
              <span className={s.tEmoji} aria-hidden>
                {t.emoji}
              </span>
              <span className={s.tTitle}>{t.title[mode]}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}
