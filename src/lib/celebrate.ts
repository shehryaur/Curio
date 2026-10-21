'use client'
import confetti from 'canvas-confetti'

/** Quiz win: a quick burst of confetti in the design's signal colors. */
export function celebrate() {
  const colors = ['#58cc02', '#1cb0f6', '#ff9600', '#ffffff']
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.65 }, colors })
  setTimeout(() => confetti({ particleCount: 60, spread: 110, origin: { y: 0.6 }, colors }), 180)
}
