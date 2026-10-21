// Ask the owl: short, mode-adapted answer about the current object via Gemini. Owner: Shehryar
import { NextResponse } from 'next/server'
import { askSchema, buildAskPrompt, generateJson, hasGeminiKey, isAgeMode } from '@/lib/gemini'
import type { AgeMode, AskResponse } from '@/lib/types'

export const runtime = 'nodejs'

const GEMINI_TIMEOUT_MS = 10_000
const MAX_QUESTION_CHARS = 500
const MAX_SENTENCES: Record<AgeMode, number> = { child: 2, teen: 4, adult: 4, plainWords: 1 }

const FALLBACK_ANSWER: Record<AgeMode, string> = {
  child: 'Hoot, great question! Let\'s ask a grown-up to find out together.',
  teen: 'Great question. I can\'t reach my knowledge right now, so try asking again in a moment or check with a teacher.',
  adult: 'I can\'t reach the answer service right now. Please try again in a moment or check the manufacturer\'s documentation.',
  plainWords: 'Let\'s try that again in a moment.',
}

const bad = (error: string) => NextResponse.json({ error }, { status: 400 })

/** Keep at most n sentences so the answer stays short when spoken aloud. */
function limitSentences(text: string, n: number): string {
  const parts = text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g)
  if (!parts || parts.length <= n) return text
  return parts.slice(0, n).join('').trim()
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || typeof body !== 'object') return bad('body must be JSON')

  const { question, objectTitle, mode } = body
  if (!isAgeMode(mode)) return bad('mode must be child | teen | adult | plainWords')
  if (typeof question !== 'string' || !question.trim()) return bad('question is required')
  if (objectTitle !== undefined && typeof objectTitle !== 'string') return bad('objectTitle must be a string')

  const q = question.trim().slice(0, MAX_QUESTION_CHARS)
  const title = (typeof objectTitle === 'string' && objectTitle.trim().slice(0, 100)) || 'this object'
  const fallback: AskResponse = { answer: FALLBACK_ANSWER[mode], source: 'fallback' }

  if (!hasGeminiKey()) {
    console.error('[ask] GEMINI_API_KEY not set; serving fallback')
    return NextResponse.json(fallback)
  }

  try {
    const raw = (await generateJson({
      prompt: buildAskPrompt(q, title, mode),
      schema: askSchema,
      timeoutMs: GEMINI_TIMEOUT_MS,
    })) as { answer?: unknown } | null
    const answer = typeof raw?.answer === 'string' ? raw.answer.trim() : ''
    if (!answer) throw new Error('empty answer')
    const res: AskResponse = { answer: limitSentences(answer, MAX_SENTENCES[mode]).slice(0, 800), source: 'gemini' }
    return NextResponse.json(res)
  } catch (err) {
    console.error('[ask] Gemini failed; serving fallback:', err instanceof Error ? err.message : String(err))
    return NextResponse.json(fallback)
  }
}
