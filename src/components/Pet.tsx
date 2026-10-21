'use client'
// Pip — Curio's original pet guide: a round leaf-green sprout-blob with two leaf "ears".
// Flat SVG, moods animated with CSS (respects prefers-reduced-motion).
import type { PetProps } from '@/lib/types'
import styles from './Pet.module.css'

const INK = '#37352f'

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
        <ellipse cx="60" cy="112" rx="30" ry="4" fill="#37352f" opacity="0.08" />
        <g className={styles.char}>
          {/* leaf ears */}
          <g className={styles.leafL}>
            <path d="M57 31 C 46 12, 27 12, 22 19 C 29 31, 45 35, 57 31 Z" fill="#3d8a00" />
            <path d="M55 30 C 45 22, 34 19, 26 19" stroke="#8ee04a" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
          <g className={styles.leafR}>
            <path d="M63 31 C 74 12, 93 12, 98 19 C 91 31, 75 35, 63 31 Z" fill="#3d8a00" />
            <path d="M65 30 C 75 22, 86 19, 94 19" stroke="#8ee04a" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
          {/* body */}
          <path
            d="M60 28 C 88 28 103 48 103 72 C 103 96 85 108 60 108 C 35 108 17 96 17 72 C 17 48 32 28 60 28 Z"
            fill="#58cc02"
          />
          <ellipse cx="60" cy="88" rx="25" ry="15" fill="#7fd93a" />
          {/* cheeks */}
          <ellipse cx="33" cy="80" rx="6.5" ry="4" fill="#ff9aa2" opacity="0.6" />
          <ellipse cx="87" cy="80" rx="6.5" ry="4" fill="#ff9aa2" opacity="0.6" />
          {/* eyes */}
          {happy ? (
            <g>
              <path d="M34 68 Q 44 56 54 68" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
              <path d="M66 68 Q 76 56 86 68" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
              <Sparkle x={24} y={52} s={0.9} />
              <Sparkle x={97} y={50} s={1.1} />
              <Sparkle x={90} y={36} s={0.6} />
            </g>
          ) : (
            <g className={styles.eyes}>
              <ellipse cx="44" cy="66" rx="11" ry="12" fill="#fff" />
              <ellipse cx="76" cy="66" rx="11" ry="12" fill="#fff" />
              <g className={styles.pupils}>
                <circle cx="45" cy="68" r="6.2" fill={INK} />
                <circle cx="77" cy="68" r="6.2" fill={INK} />
                <circle cx="47.2" cy="65.4" r="2" fill="#fff" />
                <circle cx="79.2" cy="65.4" r="2" fill="#fff" />
              </g>
            </g>
          )}
          {/* mouth */}
          {talking ? (
            <ellipse className={styles.mouthTalk} cx="60" cy="86" rx="6" ry="4.5" fill={INK} />
          ) : oops ? (
            <circle cx="60" cy="87" r="3.6" fill={INK} />
          ) : happy ? (
            <path d="M51 82 Q 60 94 69 82 Z" fill={INK} />
          ) : thinking ? (
            <path d="M55 86 L 66 85" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
          ) : (
            <path d="M54 84 Q 60 90 66 84" stroke={INK} strokeWidth="3.2" fill="none" strokeLinecap="round" />
          )}
          {oops && <path className={styles.drop} d="M96 44 C 92 50 92 54 96 55 C 100 54 100 50 96 44 Z" fill="#8fd7f2" />}
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
