'use client'
// Learn: Pip walks through the intro and every part in order (camera focuses each part).
// child: karaoke subtitles · teen: cause-and-effect stepper + X-ray · adult: sources + export ·
// plainWords: one part at a time with giant Repeat / Next step buttons.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { addXp } from '@/lib/progress'
import type { PartInfo } from '@/lib/types'
import { downloadLesson } from './exportLesson'
import Karaoke from './Karaoke'
import { wait, type PanelProps } from './shared'
import s from './experience.module.css'

interface Step {
  part: PartInfo | null // null = intro
  text: string
}

interface Props extends PanelProps {
  onGoQuiz: () => void
  xray: boolean
  setXray: (v: boolean) => void
}

const FINISH = {
  child: 'You did it! You learned every part! Want to play the quiz?',
  teen: 'Nice, that’s the whole chain. Ready to troubleshoot in the quiz?',
  adult: 'That covers every part. Run the check in the quiz to confirm.',
  plainWords: 'Well done. You saw every part. You can try the quiz now.',
} as const

function splitChain(c: string | undefined): string[] {
  return c ? c.split(/\s*(?:->|→)\s*/).filter(Boolean) : []
}

export default function LearnPanel(props: Props) {
  const { lesson, mode, speaker, pip, setFocus, partHandlers, onGoQuiz, xray, setXray } = props
  const steps = useMemo<Step[]>(
    () => [{ part: null, text: lesson.intro[mode] }, ...lesson.parts.map((p) => ({ part: p, text: p.learn[mode] }))],
    [lesson, mode],
  )
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [done, setDone] = useState(false)
  const run = useRef(0)
  const awarded = useRef(false)
  const stepsRef = useRef(steps)
  stepsRef.current = steps

  const show = useCallback(
    (i: number, mood: 'talking' | 'idle') => {
      const st = stepsRef.current[i]
      if (!st) return
      setIdx(i)
      setFocus(st.part?.id ?? null)
      pip(mood, st.text)
    },
    [pip, setFocus],
  )

  useEffect(() => {
    show(0, 'idle')
    partHandlers.current = {}
    return () => {
      run.current++
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-show the current line when the mode changes (e.g. switched to plain words).
  useEffect(() => {
    if (!playing) show(Math.min(idx, stepsRef.current.length - 1), 'idle')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  function finish() {
    run.current++
    setPlaying(false)
    setDone(true)
    setFocus(null)
    if (!awarded.current) {
      awarded.current = true
      addXp(10)
    }
    pip('happy', FINISH[mode])
    void speaker.say(FINISH[mode], mode)
  }

  /** Play from `start`; with `once`, only that one step (plain words: Repeat / Next step). */
  const playFrom = async (start: number, once = false) => {
    const id = ++run.current
    setPlaying(true)
    setDone(false)
    const end = once ? start + 1 : stepsRef.current.length
    for (let j = start; j < end; j++) {
      if (run.current !== id) return
      show(j, 'talking')
      const ok = await speaker.say(stepsRef.current[j].text, mode)
      if (run.current !== id) return
      if (!ok) {
        setPlaying(false) // something else (Ask Pip) took the voice
        return
      }
      if (!once) await wait(400)
    }
    if (run.current !== id) return
    if (once) {
      setPlaying(false)
      return
    }
    finish()
  }

  const pause = () => {
    run.current++
    speaker.stop()
    setPlaying(false)
    show(idx, 'idle')
  }

  const go = (to: number) => {
    const n = Math.max(0, Math.min(steps.length - 1, to))
    const wasPlaying = playing
    run.current++
    speaker.stop()
    setDone(false)
    if (wasPlaying) void playFrom(n)
    else show(n, 'idle')
  }

  const cur = steps[idx]
  const last = idx >= steps.length - 1
  const tip = cur?.part?.safetyTip?.[mode]
  const plain = mode === 'plainWords'
  const chain = mode === 'teen' ? splitChain(lesson.causeAndEffect) : []
  // Current chain link follows the tour: intro = link 0, last part = last link.
  const link = chain.length > 1 ? Math.round((idx / Math.max(1, steps.length - 1)) * (chain.length - 1)) : 0
  const pct = steps.length > 1 ? Math.round((idx / (steps.length - 1)) * 100) : 100
  const sources = mode === 'adult' ? (lesson.sources ?? []) : []

  const extras = (
    <>
      {sources.length > 0 && (
        <div className={s.sources}>
          <h4>Learn more</h4>
          <ul>
            {sources.map((src) => (
              <li key={src.url}>
                <a href={src.url} target="_blank" rel="noopener noreferrer">
                  {src.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {mode === 'adult' && (
        <button className="c-btn secondary sm" onClick={() => downloadLesson(lesson, mode)}>
          ⬇ Export lesson (.md)
        </button>
      )}
    </>
  )

  if (done) {
    return (
      <div className={`${s.panel} ${s.center}`}>
        <span className="c-pill xp">+10 XP</span>
        <h3>{mode === 'child' ? 'Lesson complete! 🎉' : 'Lesson complete'}</h3>
        <div className={s.actions}>
          <button className={`c-btn ${plain ? 'giant' : ''}`} onClick={onGoQuiz}>
            {mode === 'child' ? '🎯 Play the quiz' : plain ? 'Try the quiz ➡' : 'Take the quiz'}
          </button>
          <button className={`c-btn secondary ${plain ? 'giant' : ''}`} onClick={() => go(0)}>
            ↺ Again
          </button>
        </div>
        {extras}
      </div>
    )
  }

  if (plain) {
    return (
      <div className={s.panel}>
        <p className={s.plainStep}>{cur?.part ? cur.part.name[mode] : 'Welcome'}</p>
        <p className={s.plainText}>{cur?.text}</p>
        {tip && (
          <div className={s.safety} role="note">
            <b>⚠️ Safety tip:</b> {tip}
          </div>
        )}
        <div className={s.giantRow}>
          <button className="c-btn secondary giant" onClick={() => void playFrom(idx, true)}>
            ⬅ Repeat
          </button>
          <button
            className="c-btn yellow giant"
            onClick={() => (last ? finish() : void playFrom(idx + 1, true))}
          >
            {last ? 'Finish ✓' : 'Next step ➡'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={s.panel}>
      <div className={s.stepLabel}>
        <span>{cur?.part ? cur.part.name[mode] : mode === 'child' ? 'Hello!' : 'Intro'}</span>
        <span>
          {idx}/{steps.length - 1}
        </span>
      </div>
      <div className="c-progress" aria-hidden>
        <span style={{ width: `${pct}%` }} />
      </div>
      {mode === 'child' && cur && <Karaoke text={cur.text} playing={playing && speaker.speaking} />}
      {mode !== 'child' && cur && <p className={s.subtitle}>{cur.text}</p>}
      {chain.length > 1 && (
        <div className={s.chain} aria-label="Cause and effect chain">
          {chain.map((c, i) => (
            <span key={i} className={s.chainItem}>
              {i > 0 && <span className={s.chainArrow}>→</span>}
              <span className={`${s.chainStep} ${i === link ? s.chainNow : i < link ? s.chainDone : ''}`}>{c}</span>
            </span>
          ))}
        </div>
      )}
      {tip && (
        <div className={s.safety} role="note">
          <b>⚠️ Safety tip:</b> {tip}
        </div>
      )}
      <div className={s.controls}>
        <button className="c-btn secondary" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Previous">
          ◀
        </button>
        {playing ? (
          <button className="c-btn" onClick={pause}>
            ❚❚ Pause
          </button>
        ) : (
          <button className="c-btn" onClick={() => void playFrom(idx)}>
            ▶ {idx === 0 && mode === 'child' ? 'Start!' : 'Play'}
          </button>
        )}
        <button
          className="c-btn secondary"
          onClick={() => (last ? finish() : go(idx + 1))}
          aria-label={last ? 'Finish' : 'Next'}
        >
          {last ? '✓' : '▶'}
        </button>
      </div>
      {mode === 'teen' && (
        <label className={s.toggle}>
          <input type="checkbox" checked={xray} onChange={(e) => setXray(e.target.checked)} />
          <span className={s.toggleTrack} aria-hidden />
          <span>🩻 X-ray view</span>
        </label>
      )}
      {mode === 'adult' && <div className={s.adultExtras}>{extras}</div>}
    </div>
  )
}
