// "What do you want to learn about?" — topic -> age-adapted story + Learn/Quiz/Explore lesson.
// Story + lesson come from open models on NVIDIA NIM (Nemotron), with Gemini as backup.
// If no starter model matches, the client builds one with POST /api/meshy/text { topic }.
import { NextResponse } from 'next/server'
import { learnTopic } from '@/lib/topicLesson'
import { cleanInterests, cleanName, isAgeMode } from '@/lib/gemini'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: 'body must be JSON' }, { status: 400 })
  const topic = typeof body.topic === 'string' ? body.topic.trim() : ''
  if (!topic) return NextResponse.json({ error: 'topic is required' }, { status: 400 })
  if (!isAgeMode(body.mode)) return NextResponse.json({ error: 'mode must be child | teen | adult | plainWords' }, { status: 400 })
  const t0 = Date.now()
  const res = await learnTopic({
    topic: topic.slice(0, 200),
    mode: body.mode,
    name: cleanName(body.name),
    interests: cleanInterests(body.interests),
  })
  console.log(`[learn] "${res.topic}" via ${res.source} in ${Date.now() - t0}ms template=${res.matchedTemplate ?? 'none'}`)
  return NextResponse.json(res)
}
