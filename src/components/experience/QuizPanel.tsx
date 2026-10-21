'use client'
// Quiz: Pip asks, the learner taps the part on the model. 3 questions, +10 XP each, streak +1 at the end.
import { useCallback, useEffect, useRef, useState } from 'react'
import { celebrate } from '@/lib/celebrate'
import { addXp, recordStreakDay } from '@/lib/progress'
import { partName, wait, type PanelProps } from './shared'
import s from './experience.module.css'

interface Props extends PanelProps {
  onExplore: () => void
}

const END = {
  child: (n: number, t: number) => `Quiz done! You got ${n} out of ${t} on the first try!`,
  teen: (n: number, t: number) => `Done! ${n}/${t} first try.`,
  adult: (n: number, t: number) => `Quiz complete: ${n} of ${t} correct on the first try.`,
  plainWords: (n: number, t: number) => `All done. You found ${n} of ${t} right away.`,
} as const

export default function QuizPanel({ lesson, mode, speaker, pip, setHighlight, partHandlers, onExplore }: Props) {
  const questions = lesson.quiz.slice(0, 3)
  const [qi, setQi] = useState(0)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [round, setRound] = useState(0)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  /** Teen: science explanation shown after a correct answer, with a Next button. */
  const [science, setScience] = useState<string | null>(null)
  const st = useRef({ qi: 0, misses: 0, score: 0, busy: false, gen: 0 })
  const modeRef = useRef(mode)
  modeRef.current = mode

  const ask = useCallback(
    (i: number) => {
      const q = questions[i]
      if (!q) return
      setHighlight(null)
      setHighlightId(null)
      pip('talking', q.prompt[modeRef.current])
      void speaker.say(q.prompt[modeRef.current], modeRef.current)
    },
    [questions, pip, setHighlight, speaker],
  )

  const click = useCallback(
    async (partId: string) => {
      const S = st.current
      if (S.busy || finished) return
      const q = questions[S.qi]
      if (!q) return
      const m = modeRef.current
      const gen = S.gen
      if (partId === q.answerPartId) {
        S.busy = true
        if (m !== 'plainWords') celebrate()
        addXp(10)
        if (S.misses === 0) {
          S.score++
          setScore(S.score)
        }
        setHighlight(q.answerPartId)
        setHighlightId(q.answerPartId)
        pip('happy', q.praise[m])
        if (m === 'teen') {
          setScience(q.praise[m])
          void speaker.say(q.praise[m], m)
          return // advanced by the "Next" button
        }
        await Promise.all([speaker.say(q.praise[m], m), wait(1100)])
        if (st.current.gen !== gen) return
        advance()
        return
      }
      S.misses++
      const msg =
        m === 'plainWords'
          ? `That's okay. Let's look again together. ${q.hint[m]}`
          : `That’s the ${partName(lesson, partId, m)}. ${q.hint[m]}`
      pip(m === 'plainWords' ? 'talking' : 'oops', msg)
      if (S.misses >= (m === 'plainWords' ? 1 : 2)) {
        setHighlight(q.answerPartId)
        setHighlightId(q.answerPartId)
      }
      void speaker.say(msg, m)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questions, finished, lesson, mode, pip, setHighlight, speaker, ask],
  )

  function advance() {
    const S = st.current
    const m = modeRef.current
    setScience(null)
    S.busy = false
    S.misses = 0
    if (S.qi + 1 >= questions.length) {
      setFinished(true)
      recordStreakDay()
      setHighlight(null)
      setHighlightId(null)
      const line = END[m](S.score, questions.length)
      pip('happy', line)
      void speaker.say(line, m)
      return
    }
    S.qi++
    setQi(S.qi)
    ask(S.qi)
  }

  useEffect(() => {
    partHandlers.current = { click: (id) => void click(id) }
  }, [click, partHandlers])

  // Start (and restart) a round.
  useEffect(() => {
    st.current = { qi: 0, misses: 0, score: 0, busy: false, gen: st.current.gen + 1 }
    setQi(0)
    setScore(0)
    setFinished(false)
    setScience(null)
    ask(0)
    return () => {
      st.current.gen++
      partHandlers.current = {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  if (questions.length === 0) {
    return (
      <div className={`${s.panel} ${s.center}`}>
        <p>No quiz for this one yet. Try Explore!</p>
        <button className="c-btn" onClick={onExplore}>
          Explore
        </button>
      </div>
    )
  }

  const dots = (
    <div className={s.dotsRow} aria-label={`Question ${qi + 1} of ${questions.length}`}>
      {questions.map((q, i) => (
        <span key={q.id} className={`${s.qdot} ${i < qi || finished ? s.qdotOn : i === qi ? s.qdotNow : ''}`} />
      ))}
    </div>
  )

  if (finished) {
    return (
      <div className={`${s.panel} ${s.center}`}>
        {dots}
        <span className={s.score}>
          {score}/{questions.length}
        </span>
        <div className={s.actions} style={{ gap: 8 }}>
          <span className="c-pill xp">+{questions.length * 10} XP</span>
          <span className="c-pill streak">🔥 Streak +1</span>
        </div>
        <div className={s.actions}>
          <button className="c-btn" onClick={() => setRound((r) => r + 1)}>
            ↺ Play again
          </button>
          <button className="c-btn secondary" onClick={onExplore}>
            {mode === 'child' ? '🔍 Explore' : 'Explore'}
          </button>
        </div>
      </div>
    )
  }

  const q = questions[qi]
  if (science) {
    return (
      <div className={s.panel}>
        {dots}
        <div className={s.science}>
          <b>🔬 The science</b>
          <p>{science}</p>
        </div>
        <button className="c-btn blue block" onClick={advance}>
          {qi + 1 >= questions.length ? 'See my score' : 'Next problem ➡'}
        </button>
      </div>
    )
  }
  return (
    <div className={s.panel}>
      {dots}
      {mode === 'teen' && <span className={`c-badge info ${s.selfStart}`}>🛠 Troubleshoot</span>}
      {mode === 'adult' && <span className={`c-badge ${s.selfStart}`}>Operational check</span>}
      <p className={mode === 'plainWords' ? s.plainText : s.prompt}>{q.prompt[mode]}</p>

      {/* Choice Buttons (Page 2 of PDF) */}
      <div className={s.quizChoices}>
        {lesson.parts.slice(0, 4).map((p) => {
          const isTarget = p.id === q.answerPartId
          const isHighlighted = highlightId === p.id
          return (
            <button
              key={p.id}
              className={`${s.quizChoiceBtn} ${isHighlighted && isTarget ? s.quizChoiceCorrect : ''}`}
              onClick={() => click(p.id)}
            >
              <span>{partName(lesson, p.id, mode)}</span>
              {isHighlighted && isTarget && <span className={s.quizChoiceTick}>✓</span>}
            </button>
          )
        })}
      </div>

      <p className={s.hint}>
        {mode === 'child'
          ? '👆 Tap the part on the model!'
          : mode === 'teen'
            ? 'Tap the component that would cause this.'
            : mode === 'plainWords'
              ? 'Take your time. If you need help, look for the glowing part.'
              : 'Tap the part on the model.'}
      </p>
      {mode !== 'plainWords' && (
        <div className={s.controls}>
          <button className="c-btn secondary sm" onClick={() => ask(qi)}>
            🔊 Hear it again
          </button>
        </div>
      )}
    </div>
  )
}
