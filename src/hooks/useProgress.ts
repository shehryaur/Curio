'use client'
import { useSyncExternalStore } from 'react'
import { EMPTY_PROGRESS, getProgress, subscribeProgress, visibleStreak, type Progress } from '@/lib/progress'

const serverSnapshot = (): Progress => EMPTY_PROGRESS

export function useProgress(): { xp: number; streak: number } {
  const p = useSyncExternalStore(subscribeProgress, getProgress, serverSnapshot)
  return { xp: p.xp, streak: visibleStreak(p) }
}
