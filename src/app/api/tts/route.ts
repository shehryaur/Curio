// Inworld TTS: speak each tour step; speakingRate by mode. Owner: Shehryar

import { isAgeMode, synthesizeSpeech } from '@/lib/inworld'
import type { ApiError, TtsResponse } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request): Promise<Response> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Body must be JSON' } satisfies ApiError, { status: 400 })
  }
  const { text, mode } = (body ?? {}) as { text?: unknown; mode?: unknown }
  if (typeof text !== 'string' || text.trim().length === 0) {
    return Response.json({ error: 'Missing "text"' } satisfies ApiError, { status: 400 })
  }
  if (!isAgeMode(mode)) {
    return Response.json(
      { error: 'Invalid "mode" (child | teen | adult | plainWords)' } satisfies ApiError,
      { status: 400 },
    )
  }
  const result: TtsResponse = await synthesizeSpeech(text, mode)
  return Response.json(result, { status: 200 })
}
