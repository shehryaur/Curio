// Modulate: voice in -> transcript, PII redaction (minors), emotion (frustrated -> Plain Words). Owner: Shehryar
import type { VoiceResponse } from '@/lib/types'
import { MAX_AUDIO_BYTES, transcribeVoice, unavailable } from '@/lib/modulate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request): Promise<Response> {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return Response.json({ error: 'expected multipart/form-data with an "audio" field' }, { status: 400 })
  }

  const audio = form.get('audio')
  if (!audio || typeof audio === 'string' || audio.size === 0) {
    return Response.json({ error: 'missing or empty "audio" field' }, { status: 400 })
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return Response.json({ error: 'audio too large (max 10MB)' }, { status: 413 })
  }

  // Default to the safest setting: treat as a minor unless explicitly "false".
  const isMinor = String(form.get('isMinor') ?? 'true').trim().toLowerCase() !== 'false'
  const langRaw = form.get('language')
  const language = typeof langRaw === 'string' && /^[a-z]{2}$/i.test(langRaw.trim()) ? langRaw.trim().toLowerCase() : undefined

  let result: VoiceResponse
  try {
    result = await transcribeVoice(audio, { isMinor, language })
  } catch {
    result = unavailable('voice service error')
  }
  // Note: never log transcripts or audio here.
  return Response.json(result satisfies VoiceResponse)
}
