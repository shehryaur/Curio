// Fast text LLM client for Pip (ask) and topic stories (learn). Server-only.
// NVIDIA NIM (OpenAI-compatible, open-source models) first, Gemini as a backup.
// Kept separate from gemini.ts (vision/analyze) on purpose.
import { GoogleGenAI } from '@google/genai'

const NIM_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'

/**
 * Open models on NVIDIA NIM, picked by live benchmark (Oct 2026, Pip question / kid story):
 *   nvidia/nemotron-3.5-lightning-30b-a3b  ~0.9s  (thinking off)  <- Pip answers
 *   nvidia/nemotron-3-ultra-550b-a55b      ~3.3s  best writing     <- stories
 *   z-ai/glm-5.3-flash                     ~2.8s  short answers only (long ones are slow)
 * Override the first choice with NVIDIA_FAST_MODEL / NVIDIA_STORY_MODEL.
 */
const LIGHTNING = 'nvidia/nemotron-3.5-lightning-30b-a3b'
const ULTRA = 'nvidia/nemotron-3-ultra-550b-a55b'
const GLM_FLASH = 'z-ai/glm-5.3-flash'
const FAST_MODELS = () => uniq([process.env.NVIDIA_FAST_MODEL, LIGHTNING, GLM_FLASH])
const STORY_MODELS = () => uniq([process.env.NVIDIA_STORY_MODEL, ULTRA, LIGHTNING])

/** Per-model request extras. Reasoning models must have thinking switched off or they burn the token budget. */
function extrasFor(model: string): Record<string, unknown> {
  if (model.includes('nemotron-3.5') || model.includes('nemotron-nano') || model.includes('lightning'))
    return { chat_template_kwargs: { enable_thinking: false, thinking: false } }
  return {}
}

function uniq(xs: (string | undefined)[]): string[] {
  return [...new Set(xs.map((x) => x?.trim()).filter((x): x is string => !!x))]
}

export interface LlmResult<T> {
  data: T
  provider: 'nvidia' | 'gemini'
  model: string
  ms: number
}

/** Pull the first JSON object out of a model reply (handles ```json fences and chatter). */
export function extractJson(text: string): unknown {
  let s = text.trim()
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(s)
  if (fence) s = fence[1].trim()
  try {
    return JSON.parse(s)
  } catch {
    const start = s.indexOf('{')
    const end = s.lastIndexOf('}')
    if (start >= 0 && end > start) return JSON.parse(s.slice(start, end + 1))
    throw new Error('model did not return JSON')
  }
}

async function nimChat(model: string, system: string, user: string, maxTokens: number, timeoutMs: number, json: boolean) {
  const key = process.env.NVIDIA_API_KEY?.trim()
  if (!key) throw new Error('NVIDIA_API_KEY not set')
  const res = await fetch(NIM_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.6,
      top_p: 0.9,
      max_tokens: maxTokens,
      stream: false,
      ...extrasFor(model),
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
  })
  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 160).replace(/nvapi-[\w-]+/g, '[key]')
    throw new Error(`NIM ${model} HTTP ${res.status} ${detail}`)
  }
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const text = body.choices?.[0]?.message?.content?.trim() ?? ''
  if (!text) throw new Error(`NIM ${model} empty reply`)
  return text
}

async function geminiChat(system: string, user: string, maxTokens: number, timeoutMs: number, json: boolean) {
  const key = process.env.GEMINI_API_KEY?.trim()
  if (!key) throw new Error('GEMINI_API_KEY not set')
  const ai = new GoogleGenAI({ apiKey: key })
  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: [{ text: `${system}\n\n${user}` }],
    config: {
      maxOutputTokens: maxTokens,
      temperature: 0.6,
      thinkingConfig: { thinkingBudget: 0 },
      abortSignal: AbortSignal.timeout(timeoutMs),
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  })
  const text = res.text?.trim() ?? ''
  if (!text) throw new Error('Gemini empty reply')
  return text
}

/**
 * One chat completion. Tries each NVIDIA model in order, then Gemini.
 * `kind` picks the model list: 'fast' for Pip answers, 'story' for richer storytelling.
 */
export async function chat(opts: {
  system: string
  user: string
  kind?: 'fast' | 'story'
  json?: boolean
  maxTokens?: number
  timeoutMs?: number
}): Promise<LlmResult<string>> {
  const t0 = Date.now()
  const maxTokens = opts.maxTokens ?? 400
  const timeoutMs = opts.timeoutMs ?? 15_000
  const errors: string[] = []
  const models = opts.kind === 'story' ? STORY_MODELS() : FAST_MODELS()
  if (process.env.NVIDIA_API_KEY) {
    for (const model of models) {
      const left = timeoutMs - (Date.now() - t0)
      if (left < 1500) break
      try {
        const data = await nimChat(model, opts.system, opts.user, maxTokens, left, !!opts.json)
        return { data, provider: 'nvidia', model, ms: Date.now() - t0 }
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e))
      }
    }
  }
  try {
    const left = Math.max(4000, timeoutMs - (Date.now() - t0))
    const data = await geminiChat(opts.system, opts.user, maxTokens, left, !!opts.json)
    return { data, provider: 'gemini', model: 'gemini-2.5-flash-lite', ms: Date.now() - t0 }
  } catch (e) {
    errors.push((e instanceof Error ? e.message : String(e)).replace(/AIza[\w-]+/g, '[key]'))
  }
  throw new Error(errors.join(' | ').slice(0, 500))
}

/** chat() + JSON parsing. */
export async function chatJson<T = unknown>(opts: Parameters<typeof chat>[0]): Promise<LlmResult<T>> {
  const r = await chat({ ...opts, json: true })
  return { ...r, data: extractJson(r.data) as T }
}
