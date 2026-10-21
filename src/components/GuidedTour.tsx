'use client'
// First-run guided tour: dims the screen, spotlights one section at a time, Pip explains it.
// Shown once after sign-up (localStorage flag). Targets are elements with data-tour="<id>".
// Replay from anywhere: window.dispatchEvent(new Event('curio:tour')).
import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import Pet from '@/components/Pet'
import type { AgeMode } from '@/lib/types'

const DONE_KEY = 'curio.tourDone'

interface Step {
  target: string
  title: string
  text: Record<'kid' | 'grown', string>
}

const STEPS: Step[] = [
  {
    target: 'pip',
    title: 'Meet Pip',
    text: {
      kid: "That's me! Tap “Ask anything” to type or talk to me about anything you're curious about.",
      grown: 'Pip is your guide. Tap “Ask anything” to type or speak a question, or ask to learn about any topic.',
    },
  },
  {
    target: 'camera',
    title: 'Point your camera',
    text: {
      kid: "Snap a photo of something near you and I'll turn it into a 3D lesson! A grown-up says yes first.",
      grown: 'Take a photo of any object. Curio identifies it and builds an interactive 3D model to learn from.',
    },
  },
  {
    target: 'cards',
    title: 'Starter objects',
    text: {
      kid: 'Tap any card to jump right in: learn its parts, play a quiz, or explore it in 3D.',
      grown: 'Ready-made 3D objects. Each one has Learn, Quiz and Explore modes adapted to you.',
    },
  },
  {
    target: 'mycards',
    title: 'My cards',
    text: {
      kid: 'Everything you discover is saved here, so you can come back to it anytime.',
      grown: 'Every object you scan or explore is saved here to revisit later.',
    },
  },
  {
    target: 'settings',
    title: 'Settings',
    text: {
      kid: 'Your profile and the grown-up settings live here.',
      grown: 'Your profile, privacy, k-ID permissions and age verification live here.',
    },
  },
]

interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** Rect relative to the containing block of position:fixed (the phone frame on desktop, the viewport on phones). */
function measure(el: Element): Box {
  const r = el.getBoundingClientRect()
  const frame = el.closest('.phone-frame')
  let ox = 0
  let oy = 0
  if (frame && getComputedStyle(frame).transform !== 'none') {
    const f = frame.getBoundingClientRect()
    ox = f.left
    oy = f.top
  }
  return { x: r.left - ox, y: r.top - oy, w: r.width, h: r.height }
}

export default function GuidedTour({ mode }: { mode: AgeMode }) {
  const [open, setOpen] = useState(false)
  const [i, setI] = useState(0)
  const [box, setBox] = useState<Box | null>(null)
  const [vh, setVh] = useState(800)
  const who = mode === 'child' ? 'kid' : 'grown'

  // Show once after sign-up; can be replayed with the curio:tour event.
  useEffect(() => {
    let done = false
    try {
      done = localStorage.getItem(DONE_KEY) === '1'
    } catch {
      /* storage blocked: show once per visit */
    }
    const t = done ? undefined : setTimeout(() => setOpen(true), 700)
    const replay = () => {
      setI(0)
      setOpen(true)
    }
    window.addEventListener('curio:tour', replay)
    return () => {
      if (t) clearTimeout(t)
      window.removeEventListener('curio:tour', replay)
    }
  }, [])

  // Steps whose target exists on this screen.
  const steps = STEPS.filter((s) => typeof document !== 'undefined' && document.querySelector(`[data-tour="${s.target}"]`))
  const step = steps[Math.min(i, steps.length - 1)]

  const place = useCallback(() => {
    if (!step) return
    const el = document.querySelector(`[data-tour="${step.target}"]`)
    if (!el) return setBox(null)
    const frame = el.closest('.phone-frame')
    setVh(frame && getComputedStyle(frame).transform !== 'none' ? frame.getBoundingClientRect().height : window.innerHeight)
    setBox(measure(el))
  }, [step])

  useLayoutEffect(() => {
    if (!open || !step) return
    const el = document.querySelector(`[data-tour="${step.target}"]`)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    place()
    const t = setTimeout(place, 420) // after the smooth scroll settles
    window.addEventListener('resize', place)
    document.querySelector('.phone-scroll')?.addEventListener('scroll', place, { passive: true })
    window.addEventListener('scroll', place, { passive: true })
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', place)
      document.querySelector('.phone-scroll')?.removeEventListener('scroll', place)
      window.removeEventListener('scroll', place)
    }
  }, [open, step, place])

  const finish = () => {
    setOpen(false)
    try {
      localStorage.setItem(DONE_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  if (!open || !step) return null
  const last = i >= steps.length - 1
  const pad = 8
  const hole = box && { x: box.x - pad, y: box.y - pad, w: box.w + pad * 2, h: box.h + pad * 2 }
  // Card goes below the spotlight when there's room, else above.
  const below = !hole || hole.y + hole.h + 220 < vh
  const cardTop = hole ? (below ? hole.y + hole.h + 12 : Math.max(12, hole.y - 212)) : vh / 2 - 100

  return (
    <div role="dialog" aria-modal="true" aria-label={`Tour: ${step.title}`} style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
      {/* dim + spotlight (giant shadow around the hole) */}
      <div
        onClick={finish}
        style={
          hole
            ? {
                position: 'absolute',
                left: hole.x,
                top: hole.y,
                width: hole.w,
                height: hole.h,
                borderRadius: 18,
                boxShadow: '0 0 0 9999px rgba(29,27,41,0.62)',
                outline: '3px solid #fff',
                transition: 'all .3s ease',
              }
            : { position: 'absolute', inset: 0, background: 'rgba(29,27,41,0.62)' }
        }
      />
      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          top: cardTop,
          background: '#fff',
          borderRadius: 20,
          padding: 16,
          boxShadow: '0 20px 48px rgba(29,27,41,0.3)',
          display: 'grid',
          gap: 10,
          transition: 'top .3s ease',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Pet mood="talking" size="sm" />
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
              {i + 1} of {steps.length}
            </div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{step.title}</div>
          </div>
        </div>
        <p style={{ margin: 0, lineHeight: 1.5 }}>{step.text[who]}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={finish} style={{ background: 'none', border: 0, color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}>
            Skip tour
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {i > 0 && (
              <button className="c-btn secondary sm" onClick={() => setI(i - 1)}>
                Back
              </button>
            )}
            <button className="c-btn sm" onClick={() => (last ? finish() : setI(i + 1))}>
              {last ? "Let's go!" : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
