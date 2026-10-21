// XP + daily streak, kept in localStorage (per browser). Owner: experience agent.
// Subscribe with useProgress() (src/hooks/useProgress.ts). Every storage access is wrapped in try/catch.

export interface Progress {
  xp: number
  streak: number
  /** Local date (YYYY-MM-DD) of the last day the streak counted. */
  lastDay: string | null
}

const KEY = 'curio.progress'
export const EMPTY_PROGRESS: Progress = { xp: 0, streak: 0, lastDay: null }

let cache: Progress | null = null
const listeners = new Set<() => void>()

function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
function today(): string {
  return dayKey(new Date())
}
function yesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dayKey(d)
}

function read(): Progress {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return EMPTY_PROGRESS
    const p = JSON.parse(raw) as Partial<Progress>
    return {
      xp: typeof p.xp === 'number' && p.xp >= 0 ? p.xp : 0,
      streak: typeof p.streak === 'number' && p.streak >= 0 ? p.streak : 0,
      lastDay: typeof p.lastDay === 'string' ? p.lastDay : null,
    }
  } catch {
    return EMPTY_PROGRESS
  }
}

function write(p: Progress) {
  cache = p
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* private mode: progress lasts for this visit only */
  }
  listeners.forEach((l) => l())
}

export function getProgress(): Progress {
  if (typeof window === 'undefined') return EMPTY_PROGRESS
  if (!cache) cache = read()
  return cache
}

/** The streak to display: a streak that missed a whole day is shown as 0. */
export function visibleStreak(p: Progress): number {
  return p.lastDay === today() || p.lastDay === yesterday() ? p.streak : 0
}

export function addXp(amount: number) {
  const p = getProgress()
  write({ ...p, xp: p.xp + Math.max(0, Math.round(amount)) })
}

/** Count today towards the streak (once per day). */
export function recordStreakDay() {
  const p = getProgress()
  const t = today()
  if (p.lastDay === t) return
  const streak = p.lastDay === yesterday() ? p.streak + 1 : 1
  write({ ...p, streak, lastDay: t })
}

export function subscribeProgress(fn: () => void): () => void {
  listeners.add(fn)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = read()
      fn()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(fn)
    window.removeEventListener('storage', onStorage)
  }
}
