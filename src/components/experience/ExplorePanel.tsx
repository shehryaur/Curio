'use client'
// Explore: free spin, hover/tap a part to hear about it; templates can be pulled apart.
// plainWords: a large high-contrast card for the chosen part + big part buttons (no hovering needed).
import { useCallback, useEffect, useState } from 'react'
import { type PanelProps } from './shared'
import s from './experience.module.css'

interface Props extends PanelProps {
  canExplode: boolean
  explode: number
  setExplode: (v: number) => void
}

export default function ExplorePanel({
  lesson,
  mode,
  speaker,
  pip,
  setHighlight,
  partHandlers,
  canExplode,
  explode,
  setExplode,
}: Props) {
  const [picked, setPicked] = useState<string | null>(null)
  const plain = mode === 'plainWords'

  const hover = useCallback(
    (id: string | null) => {
      setHighlight(id)
      const p = id ? lesson.parts.find((x) => x.id === id) : null
      if (p) pip('idle', `${p.name[mode]}: ${p.short[mode]}`)
    },
    [lesson, mode, pip, setHighlight],
  )
  const click = useCallback(
    (id: string) => {
      const p = lesson.parts.find((x) => x.id === id)
      if (!p) return
      setHighlight(id)
      setPicked(id)
      const line = mode === 'adult' ? p.learn[mode] : `${p.name[mode]}! ${p.short[mode]}`
      pip('talking', line)
      void speaker.say(line, mode)
    },
    [lesson, mode, pip, setHighlight, speaker],
  )

  useEffect(() => {
    partHandlers.current = { hover, click }
  }, [hover, click, partHandlers])

  useEffect(() => {
    pip(
      'idle',
      mode === 'child'
        ? 'Spin me around! Tap a part to hear about it.'
        : mode === 'plainWords'
          ? 'Touch a part to hear about it.'
          : mode === 'adult'
            ? 'All parts are labelled. Tap one for its full spec.'
            : 'Drag to spin. Hover or tap a part.',
    )
    return () => {
      partHandlers.current = {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const chosen = lesson.parts.find((p) => p.id === picked)

  return (
    <div className={s.panel}>
      {plain ? (
        <>
          {chosen && (
            <div className={s.bigCard} aria-live="polite">
              <p className={s.bigCardName}>{chosen.name[mode]}</p>
              <p className={s.bigCardText}>{chosen.short[mode]}</p>
              {chosen.safetyTip?.[mode] && (
                <div className={s.safety}>
                  <b>⚠️ Safety tip:</b> {chosen.safetyTip[mode]}
                </div>
              )}
            </div>
          )}
          <div className={s.bigParts}>
            {lesson.parts.map((p) => (
              <button
                key={p.id}
                className={`c-btn ${picked === p.id ? 'yellow' : 'secondary'} giant`}
                onClick={() => click(p.id)}
              >
                {p.name[mode]}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className={s.hint}>🖐️ Drag to spin · hover (or tap) a part</p>
      )}
      {!plain && chosen?.safetyTip?.[mode] && (
        <div className={s.safety}>
          <b>⚠️ Safety tip:</b> {chosen.safetyTip[mode]}
        </div>
      )}
      {canExplode && !plain && (
        <label className={s.field}>
          <span className={s.stepLabel}>
            <span>Pull apart</span>
            <span>{Math.round(explode * 100)}%</span>
          </span>
          <input
            className={s.slider}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={explode}
            onChange={(e) => setExplode(Number(e.target.value))}
          />
        </label>
      )}
    </div>
  )
}
