'use client'
// Pip — Curio's original pet guide: a round leaf-green sprout-blob with two leaf "ears".
// Flat SVG, moods animated with CSS (respects prefers-reduced-motion).
import type { PetProps } from '@/lib/types'
import styles from './Pet.module.css'

const INK = '#1d1b29'

function Sparkle({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      className={styles.sparkle}
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6 Z"
      fill="#ffc800"
    />
  )
}

export default function Pet({ mood, message, size = 'md' }: PetProps) {
  const happy = mood === 'happy'
  const thinking = mood === 'thinking'
  const talking = mood === 'talking'
  const oops = mood === 'oops'

  return (
    <div className={`${styles.wrap} ${styles[size]}`} data-mood={mood}>
      <svg
        className={`${styles.pet} ${styles[mood]}`}
        viewBox="0 0 120 120"
        role="img"
        aria-label={`Pip is ${mood === 'oops' ? 'saying oops' : mood}`}
      >
        {/* Pip the cardinal — flat, matches the Curio brand art */}
        <g className={styles.char}>
          {/* perch */}
          <path d="M14 104 L 104 96" stroke={INK} strokeWidth="4" strokeLinecap="round" />
          {/* legs */}
          <path d="M55 88 L 53 101 M 64 88 L 63 100" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
          {/* tail */}
          <g className={styles.leafL}>
            <path d="M42 74 L 12 103 L 46 90 Z" fill="#a31a26" />
          </g>
          {/* body */}
          <circle cx="60" cy="66" r="27" fill="#d7263d" />
          {/* crest */}
          <g className={styles.leafR}>
            <path d="M56 42 L 50 14 L 74 40 Z" fill="#d7263d" />
          </g>
          {/* wing */}
          <path d="M40 72 C 46 56, 66 54, 74 60 C 66 74, 52 80, 40 72 Z" fill="#a31a26" />
          {/* mask */}
          <path d="M70 50 C 80 46, 88 52, 88 60 C 86 66, 78 68, 72 64 C 68 60, 67 54, 70 50 Z" fill={INK} />
          {/* eye */}
          {happy ? (
            <path d="M74 56 Q 77 52 80 56" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          ) : (
            <g className={styles.eyes}>
              <g className={styles.pupils}>
                <circle cx="77" cy="55" r="2.6" fill="#fff" />
              </g>
            </g>
          )}
          {/* beak (opens when talking) */}
          {talking ? (
            <g className={styles.mouthTalk}>
              <path d="M86 54 L 100 57 L 86 59 Z" fill="#f29a2e" />
              <path d="M86 60 L 97 62 L 86 64 Z" fill="#d97f1c" />
            </g>
          ) : (
            <path d={oops ? 'M86 56 L 96 62 L 86 62 Z' : 'M86 54 L 101 59 L 86 63 Z'} fill="#f29a2e" />
          )}
          {happy && (
            <g>
              <Sparkle x={22} y={40} s={0.9} />
              <Sparkle x={100} y={34} s={1} />
            </g>
          )}
          {oops && <path className={styles.drop} d="M100 36 C 96 42 96 46 100 47 C 104 46 104 42 100 36 Z" fill="#8fd7f2" />}
        </g>
        {thinking && (
          <g className={styles.dots}>
            <circle cx="96" cy="32" r="3" fill="#a09c92" />
            <circle cx="105" cy="23" r="3.6" fill="#a09c92" />
            <circle cx="114" cy="13" r="4.2" fill="#a09c92" />
          </g>
        )}
      </svg>
      {message && (
        <div className={styles.bubble} aria-live="polite">
          {message}
        </div>
      )}
    </div>
  )
}
