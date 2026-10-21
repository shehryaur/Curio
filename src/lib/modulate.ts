// Modulate client helper. Owner: Shehryar
// SERVER-ONLY: reads MODULATE_API_KEY. Never import from a client component.
import type { VoiceResponse } from '@/lib/types'

export const MODULATE_STT_URL = 'https://platform.modulate.ai/api/velma-2-stt-batch'
export const MODULATE_TIMEOUT_MS = 20_000
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024

/** Emotion labels (lower-case) that indicate the user is struggling. */
export const FRUSTRATED_EMOTIONS: ReadonlySet<string> = new Set([
  'angry',
  'disgusted',
  'afraid',
  'sad',
  'frustrated',
  'annoyed',
  'confused',
  'anxious',
])

const FRUSTRATION_PHRASES: readonly RegExp[] = [
  /\btoo many\b/i,
  /\bwhere do i\b/i,
  /\bi (?:don'?t|do not) get\b/i,
  /\b(?:doesn'?t|does not|don'?t|won'?t|isn'?t) work(?:ing)?\b/i,
  /\bconfus(?:ed|ing)\b/i,
  /\bwhat is this\b/i,
  /\bhelp\b/i,
  /\?{2,}/,
  /!{2,}/,
]

export function isFrustratedEmotion(label: string | null | undefined): boolean {
  return !!label && FRUSTRATED_EMOTIONS.has(label.trim().toLowerCase())
}

export function transcriptSoundsFrustrated(text: string): boolean {
  return FRUSTRATION_PHRASES.some((re) => re.test(text))
}

export interface ModulateUtterance {
  utterance_uuid?: string
  text?: string
  start_ms?: number
  duration_ms?: number
  speaker?: number | string
  language?: string
  emotion?: string | null
  accent?: string | null
  deepfake_score?: number | null
}

export interface ModulateSttResponse {
  text?: string
  duration_ms?: number
  utterances?: ModulateUtterance[]
}

/** Label covering the most utterance duration (ties -> first seen). Ignores null/"unknown". */
export function dominantEmotion(utterances: readonly ModulateUtterance[]): string | null {
  const totals = new Map<string, { label: string; ms: number }>()
  for (const u of utterances) {
    const label = u.emotion?.trim()
    if (!label || label.toLowerCase() === 'unknown') continue
    const key = label.toLowerCase()
    const ms = typeof u.duration_ms === 'number' && u.duration_ms > 0 ? u.duration_ms : 1
    const cur = totals.get(key)
    if (cur) cur.ms += ms
    else totals.set(key, { label, ms })
  }
  let best: { label: string; ms: number } | null = null
  for (const v of totals.values()) if (!best || v.ms > best.ms) best = v
  return best ? best.label : null
}

const PII_PAIR = /<(pii|phi)(?::[^>]*)?>[\s\S]*?<\/\1(?::[^>]*)?>/gi
const PII_ORPHAN_OPEN_WITH_TOKEN = /<(?:pii|phi)(?::[^>]*)?>\s*[^\s<.,!?;:]*/gi
const PII_ANY_TAG = /<\/?(?:pii|phi)(?::[^>]*)?>/gi

/**
 * Minors: replace every tagged span (tag + content) with "[hidden]".
 * Adults: just strip the tags, keep the words.
 */
export function redactPii(text: string, isMinor: boolean): { text: string; redacted: boolean } {
  if (!isMinor) return { text: text.replace(PII_ANY_TAG, ''), redacted: false }
  let redacted = false
  let out = text.replace(PII_PAIR, () => {
    redacted = true
    return '[hidden]'
  })
  // Defensive: an unclosed opening tag hides at least the following word.
  out = out.replace(PII_ORPHAN_OPEN_WITH_TOKEN, () => {
    redacted = true
    return '[hidden]'
  })
  out = out.replace(PII_ANY_TAG, '')
  return { text: out.replace(/\s{2,}/g, ' ').trim(), redacted }
}

/** Pick a filename whose extension Modulate accepts, from the blob's content-type. */
export function audioFilename(contentType: string | undefined): string {
  const ct = (contentType ?? '').toLowerCase()
  if (ct.includes('ogg')) return 'speech.ogg'
  if (ct.includes('mp4') || ct.includes('m4a') || ct.includes('aac')) return ct.includes('aac') ? 'speech.aac' : 'speech.mp4'
  if (ct.includes('wav')) return 'speech.wav'
  if (ct.includes('mpeg') || ct.includes('mp3')) return 'speech.mp3'
  if (ct.includes('flac')) return 'speech.flac'
  return 'speech.webm' // MediaRecorder default (webm/opus)
}

export function unavailable(error: string): VoiceResponse {
  return { transcript: '', emotion: null, isFrustrated: false, piiRedacted: false, source: 'unavailable', error }
}

export interface TranscribeOptions {
  isMinor: boolean
  language?: string // ISO 639-1, e.g. "en"
}

/** Full pipeline: Modulate STT -> PII redaction -> emotion/frustration. Never throws. */
export async function transcribeVoice(audio: Blob, opts: TranscribeOptions): Promise<VoiceResponse> {
  const apiKey = process.env.MODULATE_API_KEY
  if (!apiKey) return unavailable('voice service not configured')

  const form = new FormData()
  form.append('upload_file', audio, audioFilename(audio.type))
  form.append('speaker_diarization', 'false')
  form.append('emotion_signal', 'true')
  if (opts.isMinor) form.append('pii_phi_tagging', 'true')
  if (opts.language) form.append('language', opts.language)

  let data: ModulateSttResponse
  try {
    const res = await fetch(MODULATE_STT_URL, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey },
      body: form,
      signal: AbortSignal.timeout(MODULATE_TIMEOUT_MS),
    })
    if (!res.ok) {
      console.warn(`[modulate] STT failed with HTTP ${res.status}`)
      const msg =
        res.status === 401 || res.status === 403
          ? 'voice service auth failed'
          : res.status === 413
            ? 'audio too large'
            : res.status === 400
              ? 'audio could not be processed'
              : 'voice service error'
      return unavailable(msg)
    }
    data = (await res.json()) as ModulateSttResponse
  } catch (err) {
    const name = err instanceof Error ? err.name : ''
    const timedOut = name === 'TimeoutError' || name === 'AbortError'
    console.warn(`[modulate] STT request ${timedOut ? 'timed out' : 'failed'}`)
    return unavailable(timedOut ? 'voice service timed out' : 'voice service unreachable')
  }

  const utterances = Array.isArray(data.utterances) ? data.utterances : []
  const rawText =
    typeof data.text === 'string' && data.text.length > 0
      ? data.text
      : utterances.map((u) => u.text ?? '').join(' ')
  const { text: transcript, redacted } = redactPii(rawText.trim(), opts.isMinor)

  const emotion = dominantEmotion(utterances)
  const isFrustrated =
    isFrustratedEmotion(emotion) ||
    utterances.some((u) => isFrustratedEmotion(u.emotion)) ||
    transcriptSoundsFrustrated(transcript)

  return { transcript, emotion, isFrustrated, piiRedacted: redacted, source: 'modulate' }
}
