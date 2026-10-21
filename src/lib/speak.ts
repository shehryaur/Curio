// Speak one line: POST /api/tts -> play the MP3, or (no audio) wait ~350ms/word so subtitles stay readable. Owner: Sruthi
import type { AgeMode, TtsRequest, TtsResponse } from './types'
import { postJson } from './api'

export interface SpeakResult {
  /** Set when audio could not be produced/played; the text was still shown as a subtitle. */
  error?: string
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve()
    const t = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => { clearTimeout(t); resolve() }, { once: true })
  })
}

export function subtitleDelay(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1500, words * 350)
}

function playAudio(uri: string, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve(true)
    const audio = new Audio(uri)
    const done = (played: boolean) => {
      audio.onended = null
      audio.onerror = null
      resolve(played)
    }
    audio.onended = () => done(true)
    audio.onerror = () => done(false)
    signal.addEventListener('abort', () => { audio.pause(); done(true) }, { once: true })
    audio.play().catch(() => done(false)) // autoplay blocked etc.
  })
}

export async function speak(text: string, mode: AgeMode, signal: AbortSignal): Promise<SpeakResult> {
  const body: TtsRequest = { text: text.slice(0, 2000), mode }
  const res = await postJson<TtsResponse>('/api/tts', body, signal)
  if (signal.aborted) return {}
  if (res.ok && res.data.audioDataUri) {
    const played = await playAudio(res.data.audioDataUri, signal)
    if (played) return {}
    await wait(subtitleDelay(text), signal)
    return { error: 'Audio could not play (browser blocked it?) - subtitles only.' }
  }
  await wait(subtitleDelay(text), signal)
  const why = res.ok ? res.data.error ?? 'voice unavailable' : res.error
  return { error: `Voice unavailable (${why}) - subtitles only.` }
}

export function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return wait(ms, signal)
}
