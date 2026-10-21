// Meshy Text-to-3D for "what do you want to learn about?" topics.
// POST { topic } -> { taskId, stage:'preview' }
// GET  ?taskId=&stage=&topic= -> TextTaskStatus (auto-starts the refine; follow the returned taskId/stage)
// GET  ?proxy=<refineTaskId> -> the finished .glb, same-origin for the 3D viewer
import { NextResponse } from 'next/server'
import { advance, finishedGlbUrl, isTaskId, startPreview } from '@/lib/meshyText'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const unavailable = (error: string, taskId = '') =>
  NextResponse.json({ taskId, stage: 'preview', status: 'UNAVAILABLE', progress: 0, error: error.slice(0, 200) })

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { topic?: unknown; quality?: unknown; prompt?: unknown } | null
  const topic = typeof body?.topic === 'string' ? body.topic.trim().slice(0, 120) : ''
  if (!topic) return NextResponse.json({ error: 'topic is required' }, { status: 400 })
  try {
    const quality = body?.quality === 'high' ? 'high' : 'fast'
    const taskId = await startPreview(topic, quality, typeof body?.prompt === 'string' ? body.prompt : undefined)
    return NextResponse.json({ taskId, stage: 'preview', status: 'PENDING', progress: 0 }, { status: 201 })
  } catch (e) {
    console.warn('[meshy/text] create failed:', e instanceof Error ? e.message : e)
    return unavailable(e instanceof Error ? e.message : 'Meshy unavailable')
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const proxy = url.searchParams.get('proxy')
  if (proxy !== null) {
    if (!isTaskId(proxy)) return NextResponse.json({ error: 'bad task id' }, { status: 400 })
    try {
      const glb = await finishedGlbUrl(proxy)
      const res = await fetch(glb, { signal: AbortSignal.timeout(90_000) })
      if (!res.ok || !res.body) return NextResponse.json({ error: 'download failed' }, { status: 502 })
      return new Response(res.body, {
        headers: { 'Content-Type': 'model/gltf-binary', 'Cache-Control': 'private, max-age=3600' },
      })
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : 'unavailable' }, { status: 503 })
    }
  }
  const taskId = url.searchParams.get('taskId')
  const stage = url.searchParams.get('stage') === 'refine' ? 'refine' : 'preview'
  const topic = (url.searchParams.get('topic') ?? 'object').slice(0, 120)
  if (!isTaskId(taskId)) return NextResponse.json({ error: 'taskId is required' }, { status: 400 })
  try {
    return NextResponse.json(await advance(taskId, stage, topic, url.searchParams.get('quality') === 'high' ? 'high' : 'fast'))
  } catch (e) {
    return unavailable(e instanceof Error ? e.message : 'Meshy unavailable', taskId)
  }
}
