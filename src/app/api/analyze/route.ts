// Gemini vision: match a photo to a built-in template, or build a photo ObjectLesson. Owner: Shehryar (backend agent)
import { NextResponse } from 'next/server'
import { getFallbackLesson } from '@/lib/fallbackLesson'
import {
  AGE_MODES,
  buildAnalyzePrompt,
  buildAnalyzeSchema,
  cleanInterests,
  cleanName,
  generateJson,
  devErrorHeader,
  hasGeminiKey,
  isAgeMode,
  isTemplateId,
  parseImage,
  TEMPLATE_IDS,
} from '@/lib/gemini'
import { getTemplateLesson, TEMPLATES } from '@/lib/templates'
import type { AgeMode, AnalyzeResponse, ByMode, ObjectLesson, PartInfo, QuizQuestion, TemplateId } from '@/lib/types'

export const runtime = 'nodejs'

const GEMINI_TIMEOUT_MS = 25_000
const MAX_IMAGE_CHARS = 10_000_000 // ~7.5 MB decoded

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

/** Templates whose lesson content actually exists right now (content agent may still be filling them). */
const availableTemplates = (): TemplateId[] =>
  TEMPLATE_IDS.filter((id) => {
    const t = (TEMPLATES as Partial<Record<TemplateId, ObjectLesson>>)[id]
    return Boolean(t && Array.isArray(t.parts) && t.parts.length)
  })

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || typeof body !== 'object' || Array.isArray(body)) return bad('body must be a JSON object')

  const { imageBase64, mode } = body
  if (!isAgeMode(mode)) return bad('mode must be child | teen | adult | plainWords')
  if (typeof imageBase64 !== 'string' || !imageBase64) return bad('imageBase64 is required')
  if (body.name !== undefined && typeof body.name !== 'string') return bad('name must be a string')
  if (body.interests !== undefined && !Array.isArray(body.interests)) return bad('interests must be an array of strings')
  if (imageBase64.length > MAX_IMAGE_CHARS) return bad('image too large', 413)
  const image = parseImage(imageBase64)
  if (!image) return bad('imageBase64 is not valid base64 image data')

  const name = cleanName(body.name)
  const interests = cleanInterests(body.interests)
  const fallback = (): AnalyzeResponse => ({ lesson: getFallbackLesson(name), matchedTemplate: null, needsModel: true })

  if (!hasGeminiKey()) {
    console.error('[analyze] GEMINI_API_KEY not set; serving fallback')
    return NextResponse.json(fallback())
  }

  const available = availableTemplates()
  const t0 = Date.now()
  try {
    const raw = await generateJson({
      prompt: buildAnalyzePrompt({ available, name, interests }),
      schema: buildAnalyzeSchema(available),
      image,
      timeoutMs: GEMINI_TIMEOUT_MS,
      maxOutputTokens: 3000,
    })
    const res = toResponse(raw, available, name)
    console.log(`[analyze] ok ${res.matchedTemplate ?? 'photo'} in ${Date.now() - t0}ms`)
    return NextResponse.json(res)
  } catch (err) {
    console.error(
      `[analyze] Gemini failed after ${Date.now() - t0}ms; serving fallback:`,
      err instanceof Error ? err.message : String(err),
    )
    return NextResponse.json(fallback(), { headers: devErrorHeader(err) })
  }
}

// ---------- normalization: make Gemini output satisfy the contract no matter what ----------

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const clamp = (n: unknown, lo = -1, hi = 1): number =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : 0

/** Fill order when a mode is missing: nearest audience first. */
const CLOSEST: Record<AgeMode, AgeMode[]> = {
  child: ['plainWords', 'teen', 'adult'],
  teen: ['adult', 'child', 'plainWords'],
  adult: ['teen', 'plainWords', 'child'],
  plainWords: ['child', 'teen', 'adult'],
}

const DANGLING = /^(a|an|the|and|or|but|so|to|of|for|from|with|in|on|at|by|as|like|just|your|my|our|its|it's|that|which|is|are|be|can|very|too)$/i

function clampWords(text: string, max: number): string {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length <= max) return text
  const cut = words.slice(0, max)
  // End on a full sentence if one fits; otherwise drop dangling filler words ("for your" -> "").
  const full = cut.join(' ')
  const lastStop = Math.max(full.lastIndexOf('. '), full.lastIndexOf('! '), full.lastIndexOf('? '))
  if (lastStop > full.length / 2) return full.slice(0, lastStop + 1)
  while (cut.length > 3 && DANGLING.test(cut[cut.length - 1])) cut.pop()
  return cut.join(' ').replace(/[,;:\-]+$/, '') + '.'
}

/** Returns a fully-filled ByMode, or null if no mode has text. */
function toByMode(v: unknown, limits?: Partial<Record<AgeMode, number>>): ByMode | null {
  const o = obj(v)
  const got = Object.fromEntries(AGE_MODES.map((m) => [m, str(o[m])])) as ByMode
  if (!AGE_MODES.some((m) => got[m])) return null
  const out = {} as ByMode
  for (const m of AGE_MODES) {
    const text = got[m] || CLOSEST[m].map((c) => got[c]).find(Boolean) || ''
    const max = limits?.[m]
    out[m] = max ? clampWords(text, max) : text
  }
  return out
}


function personalizeIntro(intro: ByMode, name: string): ByMode {
  if (!name) return intro
  const out = { ...intro }
  for (const m of AGE_MODES) {
    if (!out[m].toLowerCase().includes(name.toLowerCase())) out[m] = `Hi ${name}! ${out[m]}`
  }
  return out
}

function toResponse(raw: unknown, available: TemplateId[], name: string): AnalyzeResponse {
  const r = obj(raw)

  // 1) Template match -> hand-made lesson + procedural model.
  const matched = r.matchedTemplate
  if (isTemplateId(matched) && available.includes(matched)) {
    const lesson = getTemplateLesson(matched)
    lesson.intro = personalizeIntro(lesson.intro, name)
    return { lesson, matchedTemplate: matched, needsModel: false }
  }

  // 2) Photo lesson.
  const fb = getFallbackLesson(name)
  const seenNames = new Set<string>()
  const parts: PartInfo[] = []
  for (const p of arr(r.parts).map(obj)) {
    if (parts.length >= 5) break
    const pname = toByMode(p.name, { child: 6, plainWords: 6 })
    const learn = toByMode(p.learn, { child: 15, teen: 40, adult: 40, plainWords: 25 })
    if (!pname || !learn) continue
    const key = pname.adult.toLowerCase()
    if (seenNames.has(key)) continue // dedupe repeated parts
    seenNames.add(key)
    const safetyTip = toByMode(p.safetyTip) ?? undefined
    const part: PartInfo = {
      id: `p${parts.length + 1}`,
      name: pname,
      short: toByMode(p.short, { child: 5, teen: 8, adult: 12, plainWords: 5 }) ?? pname,
      learn,
      anchor: [clamp(p.x), clamp(p.y), p.internal === true ? 0 : 0.8],
    }
    if (safetyTip) part.safetyTip = safetyTip
    parts.push(part)
  }
  // Pad to 3 parts with generic top/middle/bottom (renumbered to stay unique).
  for (const fp of fb.parts) {
    if (parts.length >= 3) break
    parts.push({ ...fp, id: `p${parts.length + 1}` })
  }

  const partIds = new Set(parts.map((p) => p.id))
  const quiz: QuizQuestion[] = []
  const used = new Set<string>()
  for (const q of arr(r.quiz).map(obj)) {
    if (quiz.length >= 3) break
    const idx = typeof q.part === 'number' ? Math.round(q.part) : NaN
    const answerPartId = `p${idx}`
    if (!partIds.has(answerPartId) || used.has(answerPartId)) continue
    const prompt = toByMode(q.prompt)
    if (!prompt) continue
    const part = parts[idx - 1]
    used.add(answerPartId)
    quiz.push({
      id: `q${quiz.length + 1}`,
      answerPartId,
      prompt,
      hint: part.short,
      praise: praiseFor(part),
    })
  }
  // Pad to exactly 3 questions, preferring visible parts not yet asked about.
  const candidates = [...parts].sort((a, b) => (b.anchor?.[2] ?? 0) - (a.anchor?.[2] ?? 0))
  for (const part of candidates) {
    if (quiz.length >= 3) break
    if (used.has(part.id)) continue
    used.add(part.id)
    quiz.push(questionFor(part, `q${quiz.length + 1}`))
  }
  for (let i = 0; quiz.length < 3; i++) quiz.push(questionFor(parts[i % parts.length], `q${quiz.length + 1}`))

  const title = toByMode(r.title, { child: 5, plainWords: 5 }) ?? fb.title
  const lesson: ObjectLesson = {
    id: crypto.randomUUID(),
    kind: 'photo',
    title,
    emoji: str(r.emoji).slice(0, 8) || '✨',
    intro: personalizeIntro(toByMode(r.intro, { child: 25, plainWords: 25 }) ?? introFor(title), name),
    causeAndEffect: str(r.causeAndEffect) || undefined,
    parts,
    quiz,
    source: 'gemini',
  }
  if (!lesson.causeAndEffect) delete lesson.causeAndEffect
  return { lesson, matchedTemplate: null, needsModel: true }
}

const praiseFor = (part: PartInfo): ByMode => ({
  child: `Yay! You found the ${part.name.child.toLowerCase()}!`,
  teen: `Correct, it's the ${part.name.teen.toLowerCase()}.`,
  adult: `Correct: ${part.name.adult.toLowerCase()}.`,
  plainWords: `Well done. That is the ${part.name.plainWords.toLowerCase()}.`,
})

function introFor(title: ByMode): ByMode {
  return {
    child: `Ooh, a ${title.child}! Let's explore it together!`,
    teen: `This is a ${title.teen}. Let's see how its parts work together.`,
    adult: `${title.adult}: a walkthrough of its main components.`,
    plainWords: `Let's look at this ${title.plainWords}.`,
  }
}

function questionFor(part: PartInfo, id: string): QuizQuestion {
  return {
    id,
    answerPartId: part.id,
    prompt: {
      child: `Can you tap the ${part.name.child.toLowerCase()}?`,
      teen: `Something seems wrong with the ${part.name.teen.toLowerCase()}. Which part should you check?`,
      adult: `Before use, inspect the ${part.name.adult.toLowerCase()}. Select it.`,
      plainWords: `Let's try it together: tap the ${part.name.plainWords.toLowerCase()}.`,
    },
    hint: part.short,
    praise: praiseFor(part),
  }
}

