import type { MutableRefObject } from 'react'
import type { Speaker } from '@/hooks/useSpeaker'
import type { AgeMode, ObjectLesson, PetMood } from '@/lib/types'

export interface PipSay {
  (mood: PetMood, message: string): void
}

/** What an activity panel can drive on the Object screen. */
export interface PanelProps {
  lesson: ObjectLesson
  mode: AgeMode
  speaker: Speaker
  pip: PipSay
  setFocus: (partId: string | null) => void
  setHighlight: (partId: string | null) => void
  /** The panel puts its part click/hover handlers here; the viewer calls them. */
  partHandlers: MutableRefObject<PartHandlers>
}

export interface PartHandlers {
  click?: (partId: string) => void
  hover?: (partId: string | null) => void
}

export function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export function partName(lesson: ObjectLesson, id: string, mode: AgeMode): string {
  return lesson.parts.find((p) => p.id === id)?.name[mode] ?? id
}
