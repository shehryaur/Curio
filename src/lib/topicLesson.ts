// Build an ObjectLesson + story for a free-text topic using open models on NVIDIA NIM. Server-only.
import { chat, chatJson } from './llm'
import { TEMPLATES, getTemplateLesson } from './templates'
import { getFallbackLesson } from './fallbackLesson'
import type { AgeMode, ByMode, LearnResponse, ObjectLesson, PartInfo, QuizQuestion, TemplateId } from './types'

const MODES: AgeMode[] = ['child', 'teen', 'adult', 'plainWords']

/** Words that map a topic onto a starter object that already has a real 3D model. */
const TEMPLATE_WORDS: [TemplateId, RegExp][] = [
  ['camera', /\b(camera|dslr|polaroid|webcam|camcorder)s?\b/i],
  ['phone', /\b(phone|smartphone|iphone|android|cellphone|mobile)s?\b/i],
  ['charger', /\b(charger|power adapter|plug adapter|wall plug)s?\b/i],
  ['bottle', /\b(water bottle|bottle|flask)s?\b/i],
  ['mug', /\b(mug|cup|teacup)s?\b/i],
  ['pencil', /\b(pencil)s?\b/i],
  ['book', /\b(book|notebook|novel)s?\b/i],
]

export function cleanTopic(raw: string): string {
  return raw
    .replace(/[<>{}\[\]`"]/g, ' ')
    .replace(/^\s*(what|who|how|why)\s+(is|are|does|do)\s+(an?|the)?\s*/i, '')
    .replace(/^\s*(tell me about|teach me about|show me|explain)\s+(an?|the)?\s*/i, '')
    .replace(/[?!.]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

export function matchTemplate(topic: string): TemplateId | null {
  for (const [id, re] of TEMPLATE_WORDS) if (re.test(topic) && TEMPLATES[id]) return id
  return null
}

const STORY_STYLE: Record<AgeMode, string> = {
  child:
    'a warm, playful story for a 6-10 year old, 4-5 short sentences, starring the learner as the hero, concrete and fun, explaining how it works in simple words',
  teen: 'an engaging how-it-works explainer for a 13-17 year old, 4-5 sentences, cause and effect, one surprising science fact',
  adult: 'a concise story of how it was invented and how it works technically, 4-5 sentences, accurate',
  plainWords: 'a calm, kind explanation in plain everyday words for an older adult, 2-3 short sentences, no jargon',
}

async function makeStory(topic: string, mode: AgeMode, name?: string, interests: string[] = []) {
  const who = [name ? `The learner is ${name}.` : '', interests.length ? `They love ${interests.join(', ')}; weave in one of these naturally.` : '']
    .filter(Boolean)
    .join(' ')
  const r = await chat({
    kind: 'story',
    system: 'You are Pip, a kind pet guide in a learning app. Write only the story text, no title, no markdown, no lists.',
    user: `Write ${STORY_STYLE[mode]} about: "${topic}". ${who} Be factually correct. If the topic is unsafe or not a real-world object or idea, gently pick the closest safe everyday object instead.`,
    maxTokens: 450,
    timeoutMs: 15_000,
  })
  return { text: r.data.replace(/^["'\s]+|["'\s]+$/g, '').slice(0, 1400), provider: r.provider }
}

const LESSON_SHAPE = `{
 "title": {"child":"","teen":"","adult":"","plainWords":""},
 "emoji": "one emoji",
 "intro": {"child":"","teen":"","adult":"","plainWords":""},
 "causeAndEffect": "A -> B -> C",
 "parts": [ {"name": {..4 modes}, "short": {..4 modes}, "learn": {..4 modes}, "safetyTip": {..4 modes} or null,
             "anchor": [x, y, z] } ],
 "quiz": [ {"prompt": {..4 modes}, "answerPart": 1, "hint": {..4 modes}, "praise": {..4 modes}} ]
}`

async function makeLesson(topic: string): Promise<{ lesson: ObjectLesson; provider: 'nvidia' | 'gemini' }> {
  const r = await chatJson<Record<string, unknown>>({
    kind: 'fast',
    system: 'You write accurate, age-adapted lessons about real objects. Reply with one JSON object only, no markdown.',
    user: `Make a lesson about a real "${topic}" as JSON shaped like:
${LESSON_SHAPE}
Rules: exactly 4 parts (its most important physical parts), exactly 3 quiz items (answerPart = 1-based part number).
Every {..4 modes} object has keys child, teen, adult, plainWords:
- child: playful, simple; learn <= 15 words; short 3-5 words; quiz prompt "Can you tap the ...?"
- teen: cause-and-effect science; short 5-8 words; quiz = a troubleshooting scenario
- adult: technical and precise; short <= 12 words
- plainWords: one calm practical sentence; short 3-5 words; quiz prompt starts "Let's try it together: tap"
anchor = where the part sits on the object standing upright, each axis -1..1 (x right, y up, z toward viewer; inner parts z 0).
safetyTip only for genuinely risky parts (friendly advice, never a warning not to learn).`,
    maxTokens: 2600,
    timeoutMs: 20_000,
  })
  return { lesson: normalizeLesson(r.data, topic), provider: r.provider }
}

// ---------- normalization ----------
const str = (v: unknown, max = 400) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '')

function byMode(v: unknown, fallback: string, max = 400): ByMode {
  const o = v && typeof v === 'object' ? (v as Record<string, unknown>) : {}
  const flat = typeof v === 'string' ? str(v, max) : ''
  const out = {} as ByMode
  for (const m of MODES) out[m] = str(o[m], max) || flat
  const any = MODES.map((m) => out[m]).find(Boolean) || fallback
  for (const m of MODES) if (!out[m]) out[m] = m === 'plainWords' || m === 'child' ? out.child || out.plainWords || any : out.adult || out.teen || any
  return out
}

function clampAnchor(v: unknown, i: number, n: number): [number, number, number] {
  const a = Array.isArray(v) ? v.map(Number) : []
  const c = (x: number, d: number) => (Number.isFinite(x) ? Math.max(-1, Math.min(1, x)) : d)
  return [c(a[0], 0), c(a[1], 0.8 - (1.6 * i) / Math.max(1, n - 1)), c(a[2], 0.8)]
}

export function normalizeLesson(raw: Record<string, unknown>, topic: string): ObjectLesson {
  const rawParts = (Array.isArray(raw.parts) ? raw.parts : []).slice(0, 5) as Record<string, unknown>[]
  if (rawParts.length < 3) throw new Error('lesson has too few parts')
  const parts: PartInfo[] = rawParts.map((p, i) => {
    const name = byMode(p.name, `Part ${i + 1}`, 60)
    const tip = p.safetyTip && typeof p.safetyTip === 'object' ? byMode(p.safetyTip, '', 200) : undefined
    return {
      id: `p${i + 1}`,
      name,
      short: byMode(p.short, name.adult, 90),
      learn: byMode(p.learn, name.adult, 400),
      ...(tip && tip.adult ? { safetyTip: tip } : {}),
      anchor: clampAnchor(p.anchor, i, rawParts.length),
    }
  })
  const quizRaw = (Array.isArray(raw.quiz) ? raw.quiz : []) as Record<string, unknown>[]
  const quiz: QuizQuestion[] = []
  for (let i = 0; i < 3; i++) {
    const q = quizRaw[i] ?? {}
    const idx = Math.max(1, Math.min(parts.length, Math.round(Number(q.answerPart) || i + 1))) - 1
    const part = parts[idx]
    quiz.push({
      id: `q${i + 1}`,
      answerPartId: part.id,
      prompt: byMode(q.prompt, `Can you tap the ${part.name.child}?`, 200),
      hint: byMode(q.hint, part.short.child, 160),
      praise: byMode(q.praise, `Yes! That's the ${part.name.child}!`, 200),
    })
  }
  const t = topic.charAt(0).toUpperCase() + topic.slice(1)
  return {
    id: `topic-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${Date.now().toString(36)}`,
    kind: 'photo',
    title: byMode(raw.title, t, 60),
    emoji: str(raw.emoji, 4) || '✨',
    intro: byMode(raw.intro, `Let's explore a ${topic}!`, 300),
    causeAndEffect: str(raw.causeAndEffect, 200) || undefined,
    parts,
    quiz,
    source: 'gemini', // ObjectLesson.source union; the route reports the real provider in LearnResponse.source
  }
}

/** Full topic pipeline: story + lesson in parallel; starter objects reuse their hand-made lesson and real model. */
export async function learnTopic(opts: { topic: string; mode: AgeMode; name?: string; interests?: string[] }): Promise<LearnResponse> {
  const topic = cleanTopic(opts.topic) || 'everyday object'
  const matched = matchTemplate(topic)
  const storyP = makeStory(matched ? (TEMPLATES[matched]?.title.adult ?? topic) : topic, opts.mode, opts.name, opts.interests).catch((e) => {
    console.warn('[learn] story failed:', e instanceof Error ? e.message : e)
    return null
  })
  const lessonP = matched
    ? Promise.resolve({ lesson: getTemplateLesson(matched), provider: 'nvidia' as const })
    : makeLesson(topic).catch((e) => {
        console.warn('[learn] lesson failed:', e instanceof Error ? e.message : e)
        return null
      })
  const [story, lessonRes] = await Promise.all([storyP, lessonP])
  const lesson = lessonRes?.lesson ?? getFallbackLesson(opts.name)
  const fallbackStory: ByMode = {
    child: `Let's discover the ${topic} together! Tap Learn and I'll show you every part.`,
    teen: `Let's figure out how a ${topic} works. Start with Learn to see its parts in action.`,
    adult: `Here is a ${topic}. Use Learn for a part-by-part walkthrough.`,
    plainWords: `This is a ${topic}. Tap Learn and we'll go one step at a time.`,
  }
  return {
    topic,
    story: story?.text || fallbackStory[opts.mode],
    lesson,
    matchedTemplate: matched,
    needsModel: !matched,
    source: story || lessonRes ? (story?.provider ?? lessonRes?.provider ?? 'nvidia') : 'fallback',
  }
}
