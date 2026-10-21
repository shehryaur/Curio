'use client'
// Child Learn: karaoke subtitles — words light up one by one while Pip talks.
import { useEffect, useState } from 'react'
import s from './experience.module.css'

const MS_PER_WORD = 380

export default function Karaoke({ text, playing }: { text: string; playing: boolean }) {
  const words = text.split(/\s+/).filter(Boolean)
  const [lit, setLit] = useState(0)

  useEffect(() => {
    setLit(playing ? 0 : words.length)
    if (!playing) return
    let i = 0
    const t = setInterval(() => {
      i++
      setLit(i)
      if (i >= words.length) clearInterval(t)
    }, MS_PER_WORD)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, playing])

  return (
    <p className={s.karaoke} aria-live="polite">
      {words.map((w, i) => (
        <span key={i} className={i < lit ? s.kOn : s.kOff}>
          {w}{' '}
        </span>
      ))}
    </p>
  )
}
