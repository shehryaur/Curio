// Meshy image-to-3D client (server-only; reads MESHY_API_KEY). Owner: Shehryar (Meshy agent)
// NOTE: endpoint shapes written from memory of the Meshy OpenAPI v1 docs; parsed defensively.
import type { MeshyStatus } from '@/lib/types'

const API_BASE = 'https://api.meshy.ai/openapi/v1/image-to-3d'
const CALL_TIMEOUT_MS = 15_000
const DOWNLOAD_TIMEOUT_MS = 90_000
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024

export class MeshyUnavailableError extends Error {}

function apiKey(): string {
  const key = process.env.MESHY_API_KEY
  if (!key || !key.trim()) throw new MeshyUnavailableError('MESHY_API_KEY not configured')
  return key.trim()
}

export function isMeshyConfigured(): boolean {
  const key = process.env.MESHY_API_KEY
  return !!key && !!key.trim()
}

/** Loose task id check: alnum / dash / underscore, 1..100 chars. */
export function isValidTaskId(id: unknown): id is string {
  return typeof id === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(id)
}

/** Normalize a data URL or raw base64 to a data URL; returns null if invalid or too large. */
export function toImageDataUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null
  let s = input.trim()
  let mime = 'image/jpeg'
  const m = /^data:(image\/(?:jpeg|jpg|png|webp));base64,(.*)$/is.exec(s)
  if (m) {
    mime = m[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : m[1].toLowerCase()
    s = m[2]
  } else if (s.startsWith('data:')) {
    return null
  }
  s = s.replace(/\s+/g, '')
  if (!s || !/^[A-Za-z0-9+/]+={0,2}$/.test(s)) return null
  const approxBytes = Math.floor((s.length * 3) / 4)
  if (approxBytes > MAX_IMAGE_BYTES) return null
  if (!m) {
    // sniff PNG signature in raw base64
    if (s.startsWith('iVBORw0KGgo')) mime = 'image/png'
    else if (s.startsWith('UklGR')) mime = 'image/webp'
  }
  return `data:${mime};base64,${s}`
}

async function fetchWithTimeout(url: string, init: RequestInit, ms = CALL_TIMEOUT_MS): Promise<Response> {
  return fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(ms) })
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

/**
 * Generation presets, fastest first (Meshy docs, Sept 2026 medians, image->3D with 2K texture):
 *   meshy-t2 (smart topology)  ~60s, 15 credits, clean mesh with natively separated parts  <- default
 *   meshy-6-lite (standard)    ~75s, 15 credits                                            <- fallback
 * PBR maps are off on purpose: they add 30-60s, and our studio environment lighting already makes the
 * base-color texture look realistic. Override the model with MESHY_AI_MODEL (e.g. "meshy-7.1" for max quality, ~2 min).
 */
function buildPresets(imageDataUrl: string): Record<string, unknown>[] {
  const common = { image_url: imageDataUrl, should_texture: true, texture_resolution: '2k', target_formats: ['glb'] }
  const override = process.env.MESHY_AI_MODEL?.trim()
  if (override) {
    const smart = override.startsWith('meshy-t')
    return [
      smart
        ? { ...common, model_type: 'smart-topology', ai_model: override }
        : { ...common, model_type: 'standard', ai_model: override },
    ]
  }
  return [
    { ...common, model_type: 'smart-topology', ai_model: 'meshy-t2', target_polycount: 15000 },
    { ...common, model_type: 'standard', ai_model: 'meshy-6-lite' },
  ]
}

/** Create an image-to-3D task. Returns the Meshy task id. Tries the fastest preset, falls back on a 400. */
export async function createImageTo3dTask(imageDataUrl: string): Promise<string> {
  const key = apiKey()
  let lastError = 'Meshy create failed'
  for (const body of buildPresets(imageDataUrl)) {
    const res = await fetchWithTimeout(API_BASE, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = asRecord(await res.json().catch(() => null))
    if (res.ok) {
      const id = json?.result ?? json?.id ?? asRecord(json?.result)?.id
      if (!isValidTaskId(id)) throw new Error('Meshy create returned no task id')
      return id
    }
    const msg = typeof json?.message === 'string' ? json.message : `HTTP ${res.status}`
    lastError = `Meshy create failed: ${msg}`
    // Only a 400 (bad parameter combination) is worth retrying with the next preset.
    if (res.status !== 400) break
    console.warn('[meshy] preset rejected, trying fallback:', msg)
  }
  throw new Error(lastError)
}

export interface MeshyTaskInfo extends MeshyStatus {
  remoteGlbUrl?: string
}

function mapStatus(raw: unknown): MeshyStatus['status'] {
  const s = typeof raw === 'string' ? raw.toUpperCase() : ''
  switch (s) {
    case 'SUCCEEDED':
      return 'SUCCEEDED'
    case 'IN_PROGRESS':
      return 'IN_PROGRESS'
    case 'PENDING':
      return 'PENDING'
    case 'FAILED':
    case 'CANCELED':
    case 'CANCELLED':
    case 'EXPIRED':
      return 'FAILED'
    default:
      return 'PENDING'
  }
}

/** Fetch task status from Meshy. glbUrl is the raw (possibly signed, cross-origin) Meshy URL. */
export async function getImageTo3dTask(taskId: string): Promise<MeshyTaskInfo> {
  const key = apiKey()
  const res = await fetchWithTimeout(`${API_BASE}/${encodeURIComponent(taskId)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${key}` },
  })
  const json = asRecord(await res.json().catch(() => null))
  if (!res.ok || !json) {
    const msg = typeof json?.message === 'string' ? json.message : `HTTP ${res.status}`
    throw new Error(`Meshy status failed: ${msg}`)
  }
  const status = mapStatus(json.status)
  const p = Number(json.progress)
  let progress = Number.isFinite(p) ? Math.max(0, Math.min(100, Math.round(p))) : 0
  if (status === 'SUCCEEDED') progress = 100
  const glb = asRecord(json.model_urls)?.glb
  const remoteGlbUrl = typeof glb === 'string' && glb ? glb : undefined
  const info: MeshyTaskInfo = { taskId, status, progress }
  if (status === 'SUCCEEDED' && remoteGlbUrl) {
    info.glbUrl = remoteGlbUrl
    info.remoteGlbUrl = remoteGlbUrl
  }
  return info
}

/** Only https URLs on Meshy-owned hosts may be proxied. */
export function isAllowedAssetUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:') return false
    const host = u.hostname.toLowerCase()
    return host === 'meshy.ai' || host.endsWith('.meshy.ai')
  } catch {
    return false
  }
}

/** Fetch the finished GLB for a task (URL re-resolved server-side, never client supplied). */
export async function fetchTaskGlb(taskId: string): Promise<Response> {
  const info = await getImageTo3dTask(taskId)
  if (info.status !== 'SUCCEEDED' || !info.remoteGlbUrl) throw new Error('Model not ready')
  if (!isAllowedAssetUrl(info.remoteGlbUrl)) throw new Error('Model host not allowed')
  const res = await fetchWithTimeout(info.remoteGlbUrl, { method: 'GET' }, DOWNLOAD_TIMEOUT_MS)
  if (!res.ok || !res.body) throw new Error(`Model download failed: HTTP ${res.status}`)
  return res
}

/** Error message safe to return to the client (never contains the key). */
export function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') return 'Meshy request timed out'
    return err.message.slice(0, 200)
  }
  return 'Meshy request failed'
}
