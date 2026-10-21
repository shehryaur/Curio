// OPTIONAL stretch: wildcard object -> 3D mesh. Not a sponsor; cut first if short on time.
// POST { imageBase64 } -> { taskId }   GET ?taskId= -> MeshyStatus   GET ?proxy=<taskId> -> GLB stream
import type { MeshyStatus } from '@/lib/types'
import {
  MeshyUnavailableError,
  createImageTo3dTask,
  fetchTaskGlb,
  getImageTo3dTask,
  isMeshyConfigured,
  isValidTaskId,
  safeErrorMessage,
  toImageDataUrl,
} from '@/lib/meshy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type MeshyResponse = MeshyStatus & { proxyUrl?: string; error?: string }

function unavailable(taskId: string, error: string): Response {
  const body: MeshyResponse = { taskId, status: 'UNAVAILABLE', progress: 0, error }
  return Response.json(body, { status: 200 })
}

export async function POST(req: Request) {
  if (!isMeshyConfigured()) return unavailable('', 'MESHY_API_KEY not configured')
  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return unavailable('', 'Invalid JSON body')
  }
  const raw = payload && typeof payload === 'object' ? (payload as { imageBase64?: unknown }).imageBase64 : undefined
  const imageUrl = toImageDataUrl(raw)
  if (!imageUrl) return unavailable('', 'imageBase64 missing, invalid, or larger than 8MB')
  try {
    const taskId = await createImageTo3dTask(imageUrl)
    return Response.json({ taskId }, { status: 201 })
  } catch (err) {
    console.error('[meshy] create failed:', safeErrorMessage(err))
    return unavailable('', safeErrorMessage(err))
  }
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const proxyId = params.get('proxy')

  if (proxyId !== null) {
    if (!isValidTaskId(proxyId)) return Response.json({ error: 'Invalid task id' }, { status: 400 })
    if (!isMeshyConfigured()) return Response.json({ error: 'MESHY_API_KEY not configured' }, { status: 503 })
    try {
      const upstream = await fetchTaskGlb(proxyId)
      const headers = new Headers({
        'Content-Type': 'model/gltf-binary',
        'Cache-Control': 'private, max-age=3600',
      })
      const len = upstream.headers.get('content-length')
      if (len) headers.set('Content-Length', len)
      return new Response(upstream.body, { status: 200, headers })
    } catch (err) {
      console.error('[meshy] proxy failed:', safeErrorMessage(err))
      return Response.json({ error: safeErrorMessage(err) }, { status: 502 })
    }
  }

  const taskId = params.get('taskId') ?? ''
  if (!isValidTaskId(taskId)) return unavailable('', 'Invalid or missing taskId')
  try {
    const info = await getImageTo3dTask(taskId)
    const body: MeshyResponse = { taskId, status: info.status, progress: info.progress }
    if (info.glbUrl) {
      body.glbUrl = info.glbUrl
      body.proxyUrl = `/api/meshy?proxy=${encodeURIComponent(taskId)}`
    }
    return Response.json(body, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    if (!(err instanceof MeshyUnavailableError)) console.error('[meshy] status failed:', safeErrorMessage(err))
    return unavailable(taskId, safeErrorMessage(err))
  }
}
