// Dev-only: list the NVIDIA NIM models this key can use (helps pick NVIDIA_FAST_MODEL / NVIDIA_STORY_MODEL).
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'not available' }, { status: 404 })
  const res = await fetch('https://integrate.api.nvidia.com/v1/models', {
    headers: { Authorization: `Bearer ${process.env.NVIDIA_API_KEY ?? ''}` },
    signal: AbortSignal.timeout(10_000),
  })
  const body = (await res.json().catch(() => null)) as { data?: { id: string }[] } | null
  return NextResponse.json({ status: res.status, models: (body?.data ?? []).map((m) => m.id) })
}

/** Dev-only benchmark: POST { models: string[], prompt } -> latency + reply per model. */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'not available' }, { status: 404 })
  const { models, prompt, extra, maxTokens } = (await req.json()) as { models: string[]; prompt: string; extra?: Record<string, unknown>; maxTokens?: number }
  const results = await Promise.all(
    models.slice(0, 8).map(async (model) => {
      const t0 = Date.now()
      try {
        const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.NVIDIA_API_KEY ?? ''}`, 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(20_000),
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens ?? 300,
            ...(extra ?? {}),
            temperature: 0.6,
            response_format: { type: 'json_object' },
          }),
        })
        const j = (await res.json().catch(() => null)) as { choices?: { message?: { content?: string } }[] } | null
        return { model, status: res.status, ms: Date.now() - t0, reply: (j?.choices?.[0]?.message?.content ?? '').slice(0, 400), raw: j ? undefined : 'no json' }
      } catch (e) {
        return { model, status: 0, ms: Date.now() - t0, reply: String(e).slice(0, 120) }
      }
    }),
  )
  return NextResponse.json(results)
}
