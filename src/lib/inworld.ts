// Inworld client helper. Owner: Shehryar
// SERVER-ONLY: reads INWORLD_API_KEY. Never import from a client component.

import type { AgeMode, TtsResponse } from '@/lib/types'

const INWORLD_TTS_URL = 'https://api.inworld.ai/tts/v1/voice'
const TIMEOUT_MS = 15_000
export const MAX_TTS_CHARS = 2000
const CACHE_MAX = 50

type DeliveryMode = 'STABLE' | 'BALANCED' | 'CREATIVE'

interface ModeStyle {
  speakingRate: number
  prefix: string
  deliveryMode: DeliveryMode
}

const MODE_STYLE: Record<AgeMode, ModeStyle> = {
  child: { speakingRate: 0.95, prefix: '[say warmly and playfully] ', deliveryMode: 'BALANCED' },
  teen: { speakingRate: 1.05, prefix: '', deliveryMode: 'STABLE' },
  adult: { speakingRate: 1.05, prefix: '', deliveryMode: 'STABLE' },
  plainWords: { speakingRate: 0.85, prefix: '[say slowly and calmly] ', deliveryMode: 'STABLE' },
}

export const AGE_MODES: readonly AgeMode[] = ['child', 'teen', 'adult', 'plainWords']

export function isAgeMode(v: unknown): v is AgeMode {
  return typeof v === 'string' && (AGE_MODES as readonly string[]).includes(v)
}

/** Simple LRU on Map insertion order. Keyed by mode + text. */
const cache = new Map<string, string>()

function cacheGet(key: string): string | undefined {
  const v = cache.get(key)
  if (v !== undefined) {
    cache.delete(key)
    cache.set(key, v)
  }
  return v
}

function cacheSet(key: string, value: string): void {
  if (cache.has(key)) cache.delete(key)
  cache.set(key, value)
  while (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value
    if (oldest === undefined) break
    cache.delete(oldest)
  }
}

class InworldError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message)
  }
}

async function callInworld(apiKey: string, payload: Record<string, unknown>): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(INWORLD_TTS_URL, {
      method: 'POST',
      headers: {
        // Portal key is already Base64 — use as-is.
        Authorization: `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new InworldError(`Inworld TTS HTTP ${res.status}`, res.status, body)
    }
    const json = (await res.json()) as { audioContent?: unknown }
    if (typeof json.audioContent !== 'string' || json.audioContent.length === 0) {
      throw new InworldError('Inworld TTS returned no audio', res.status, '')
    }
    return json.audioContent
  } finally {
    clearTimeout(timer)
  }
}

/** Normalize text: trim + truncate so prefix + text stays within Inworld's 2000 UTF-16 unit limit. */
export function normalizeTtsText(text: string, mode: AgeMode): string {
  const room = MAX_TTS_CHARS - MODE_STYLE[mode].prefix.length
  return text.trim().slice(0, room).trim()
}

/** Synthesize speech. Never throws; returns the TtsResponse contract shape. */
export async function synthesizeSpeech(rawText: string, mode: AgeMode): Promise<TtsResponse> {
  const apiKey = process.env.INWORLD_API_KEY?.trim()
  if (!apiKey) {
    return { audioDataUri: null, source: 'unavailable', error: 'TTS not configured' }
  }

  const text = normalizeTtsText(rawText, mode)
  const cacheKey = `${mode}\u0000${text}`
  const cached = cacheGet(cacheKey)
  if (cached) return { audioDataUri: cached, source: 'inworld' }

  const style = MODE_STYLE[mode]
  const voiceId = process.env.INWORLD_VOICE_ID?.trim() || 'Ashley'
  const modelId = process.env.INWORLD_TTS_MODEL?.trim() || 'inworld-tts-2'
  const isTts2 = modelId.startsWith('inworld-tts-2')

  const payload: Record<string, unknown> = {
    text: isTts2 ? `${style.prefix}${text}` : text,
    voiceId,
    modelId,
    audioConfig: { audioEncoding: 'MP3', speakingRate: style.speakingRate },
  }
  if (isTts2) payload.deliveryMode = style.deliveryMode

  try {
    let audio: string
    try {
      audio = await callInworld(apiKey, payload)
    } catch (err) {
      if (err instanceof InworldError && err.status === 400 && /speakingRate|speaking_rate/i.test(err.body)) {
        audio = await callInworld(apiKey, { ...payload, audioConfig: { audioEncoding: 'MP3' } })
      } else {
        throw err
      }
    }
    const uri = `data:audio/mpeg;base64,${audio}`
    cacheSet(cacheKey, uri)
    return { audioDataUri: uri, source: 'inworld' }
  } catch (err) {
    let error = 'TTS request failed'
    if (err instanceof Error && err.name === 'AbortError') error = 'TTS timed out'
    else if (err instanceof InworldError) error = err.status === 401 || err.status === 403 ? 'TTS auth failed' : `TTS error (${err.status})`
    console.warn(`[tts] ${error}`) // no key, no text, no response body
    return { audioDataUri: null, source: 'unavailable', error }
  }
}
