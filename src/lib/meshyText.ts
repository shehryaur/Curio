// Meshy Text-to-3D (two steps: fast mesh preview, then texture refine). Server-only.
// Docs: https://docs.meshy.ai/en/api/text-to-3d  — preview with meshy-t2 is ~10s, refine 2K ~80s.
import type { MeshyStatus } from './types'

const API = 'https://api.meshy.ai/openapi/v2/text-to-3d'
const TIMEOUT_MS = 15_000

function key(): string {
  const k = process.env.MESHY_API_KEY?.trim()
  if (!k) throw new Error('MESHY_API_KEY not configured')
  if (!k.startsWith('msy_')) throw new Error('MESHY_API_KEY looks wrong (Meshy keys start with msy_)')
  return k
}

export const isTaskId = (v: unknown): v is string => typeof v === 'string' && /^[\w-]{6,100}$/.test(v)

async function call(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null
  if (!res.ok) throw new Error(`Meshy ${res.status}: ${typeof json?.message === 'string' ? json.message : 'request failed'}`)
  return json ?? {}
}

/** A clean, isolated, realistic single-object prompt for a learning model. */
export function objectPrompt(topic: string): string {
  const t = topic.replace(/[^\p{L}\p{N} ,.'-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 120)
  return `A realistic ${t}, a single isolated object, accurate real-world proportions and materials, clean product design, no base, no background, no text`
}

export async function startPreview(topic: string, quality: 'fast' | 'high' = 'fast', rawPrompt?: string): Promise<string> {
  const body =
    quality === 'high'
      ? { mode: 'preview', prompt: (rawPrompt ?? objectPrompt(topic)).slice(0, 800), model_type: 'standard', ai_model: 'meshy-7.1', should_remesh: true, target_polycount: 60000, target_formats: ['glb'], moderation: true }
      : {
    mode: 'preview',
    prompt: objectPrompt(topic),
    model_type: 'smart-topology',
    ai_model: 'meshy-t2',
    target_polycount: 15000,
    target_formats: ['glb'],
    moderation: true,
  }
  const j = await call('', { method: 'POST', body: JSON.stringify(body) })
  if (!isTaskId(j.result)) throw new Error('Meshy returned no task id')
  return j.result
}

async function startRefine(previewTaskId: string, topic: string, quality: 'fast' | 'high' = 'fast'): Promise<string> {
  const body = {
    mode: 'refine',
    preview_task_id: previewTaskId,
    texture_resolution: quality === 'high' ? '4k' : '2k',
    ...(quality === 'high' ? { enable_pbr: true } : {}),
    texture_prompt: `realistic materials and colors of a real ${topic.slice(0, 80)}`,
    target_formats: ['glb'],
  }
  const j = await call('', { method: 'POST', body: JSON.stringify(body) })
  if (!isTaskId(j.result)) throw new Error('Meshy refine returned no task id')
  return j.result
}

async function getTask(id: string) {
  return call(`/${encodeURIComponent(id)}`)
}

function mapStatus(s: unknown): MeshyStatus['status'] {
  switch (String(s).toUpperCase()) {
    case 'SUCCEEDED':
      return 'SUCCEEDED'
    case 'PENDING':
      return 'PENDING'
    case 'IN_PROGRESS':
      return 'IN_PROGRESS'
    default:
      return 'FAILED'
  }
}

export interface TextTaskStatus extends MeshyStatus {
  stage: 'preview' | 'refine'
}

/**
 * Advance a text-to-3D job. Pass the id you were given plus its stage.
 * When the preview finishes, this starts the refine and returns the NEW task id with stage 'refine'.
 * Overall progress: preview = 0-30%, refine = 30-100%.
 */
export async function advance(taskId: string, stage: 'preview' | 'refine', topic: string, quality: 'fast' | 'high' = 'fast'): Promise<TextTaskStatus> {
  const t = await getTask(taskId)
  const status = mapStatus(t.status)
  const p = typeof t.progress === 'number' ? t.progress : 0
  if (stage === 'preview') {
    if (status === 'SUCCEEDED') {
      const refineId = await startRefine(taskId, topic, quality)
      return { taskId: refineId, stage: 'refine', status: 'IN_PROGRESS', progress: 30 }
    }
    return { taskId, stage, status, progress: Math.round(p * 0.3) }
  }
  const progress = status === 'SUCCEEDED' ? 100 : 30 + Math.round(p * 0.7)
  return {
    taskId,
    stage,
    status,
    progress,
    ...(status === 'SUCCEEDED' ? { proxyUrl: `/api/meshy/text?proxy=${encodeURIComponent(taskId)}` } : {}),
  }
}

/** Server-side lookup of the finished GLB url (never trust a client-supplied url). */
export async function finishedGlbUrl(taskId: string): Promise<string> {
  const t = await getTask(taskId)
  const urls = (t.model_urls ?? {}) as Record<string, unknown>
  const glb = typeof urls.glb === 'string' ? urls.glb : ''
  const host = glb ? new URL(glb).hostname : ''
  if (!glb || !(host === 'meshy.ai' || host.endsWith('.meshy.ai'))) throw new Error('model not ready')
  return glb
}
