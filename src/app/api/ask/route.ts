// Ask Pip: short, mode-adapted, personalized answer about the current object via Gemini. Owner: Shehryar (backend agent)
import { NextResponse } from 'next/server'
import { buildAskPrompt, devErrorHeader, cleanInterests, cleanName, isAgeMode } from '@/lib/gemini'
import { chatJson } from '@/lib/llm'
import type { AgeMode, AskResponse } from '@/lib/types'

export const runtime = 'nodejs'

const ASK_TIMEOUT_MS = 14_000
const MAX_QUESTION_CHARS = 500
const MAX_SENTENCES: Record<AgeMode, number> = { child: 2, teen: 4, adult: 4, plainWords: 1 }

const FALLBACK_ANSWER: Record<AgeMode, string> = {
  child: 'Ooh, great question! Let\'s ask a grown-up to find out together.',
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

/** Up to 12 parts with safe short ids/names; duplicates dropped. */
function cleanParts(v: unknown): { id: string; name: string }[] {
  const out: { id: string; name: string }[] = []
  for (const p of Array.isArray(v) ? v : []) {
    const o = p && typeof p === 'object' ? (p as Record<string, unknown>) : {}
    const id = typeof o.id === 'string' ? o.id.trim().slice(0, 40) : ''
    const name = typeof o.name === 'string' ? o.name.replace(/[<>"\n\r]/g, ' ').trim().slice(0, 60) : ''
    if (!id || !/^[\w-]+$/.test(id) || out.some((x) => x.id === id)) continue
    out.push({ id, name: name || id })
    if (out.length >= 12) break
  }
  return out
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || typeof body !== 'object') return bad('body must be JSON')

  const { question, objectTitle, mode } = body
  if (!isAgeMode(mode)) return bad('mode must be child | teen | adult | plainWords')
  if (typeof question !== 'string' || !question.trim()) return bad('question is required')
  if (objectTitle !== undefined && typeof objectTitle !== 'string') return bad('objectTitle must be a string')
  if (body.name !== undefined && typeof body.name !== 'string') return bad('name must be a string')
  if (body.interests !== undefined && !Array.isArray(body.interests)) return bad('interests must be an array of strings')
  if (body.parts !== undefined && !Array.isArray(body.parts)) return bad('parts must be an array of { id, name }')
  const name = cleanName(body.name)
  const interests = cleanInterests(body.interests)
  const parts = cleanParts(body.parts)

  const q = question.trim().slice(0, MAX_QUESTION_CHARS)
  const title = (typeof objectTitle === 'string' && objectTitle.trim().slice(0, 100)) || 'this object'
  const fallback: AskResponse = { answer: FALLBACK_ANSWER[mode], source: 'fallback', focusPartId: null }

  if (!process.env.NVIDIA_API_KEY && !process.env.GEMINI_API_KEY) {
    console.error('[ask] no NVIDIA_API_KEY or GEMINI_API_KEY; serving fallback')
    return NextResponse.json(fallback)
  }

  const t0 = Date.now()
  try {
    const llm = await chatJson<{ answer?: unknown; message?: unknown; response?: unknown; text?: unknown; focusPartId?: unknown }>({
      kind: 'fast',
      system:
        'You are Pip, a friendly pet guide in a learning app. Reply with a JSON object only: {"answer": string' +
        (parts.length ? ', "focusPartId": string}' : '}') +
        '. No markdown.',
      user: buildAskPrompt({ question: q, objectTitle: title, mode, name, interests, parts }),
      maxTokens: 350,
      timeoutMs: ASK_TIMEOUT_MS,
    })
    const raw = llm.data
    const rawAnswer = raw?.answer || raw?.message || raw?.response || raw?.text
    const answer = typeof rawAnswer === 'string' ? rawAnswer.trim() : ''
    if (!answer) throw new Error('empty answer')
    const focus = raw?.focusPartId
    const focusPartId = typeof focus === 'string' && parts.some((p) => p.id === focus) ? focus : null
    const res: AskResponse = {
      answer: limitSentences(answer, MAX_SENTENCES[mode]).slice(0, 800),
      source: 'gemini',
      focusPartId,
    }
    console.log(`[ask] ok via ${llm.provider}/${llm.model} in ${llm.ms}ms focus=${focusPartId ?? 'none'}`)
    return NextResponse.json(res, { headers: { 'x-curio-model': `${llm.provider}/${llm.model}` } })
  } catch (err) {
    console.error(`[ask] all models failed after ${Date.now() - t0}ms; serving fallback:`, err instanceof Error ? err.message : String(err))
    return NextResponse.json(fallback, { headers: devErrorHeader(err) })
  }
}
