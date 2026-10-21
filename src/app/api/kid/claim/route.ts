import { NextResponse } from 'next/server'

// Trades the one-time claimToken from <KidSessionProvider onClaim> for the trusted result.
// The secret key (kgs_test_...) lives ONLY here on the server, never in the app.
const KID_API = process.env.KID_API_HOST ?? 'https://kai-api.test.k-id.com'

export async function POST(req: Request) {
  const secret = process.env.KID_SECRET_KEY
  if (!secret) {
    return NextResponse.json({ error: 'KID_SECRET_KEY is not set' }, { status: 500 })
  }

  const { claimToken } = (await req.json().catch(() => ({}))) as { claimToken?: string }
  if (!claimToken) {
    return NextResponse.json({ error: 'claimToken is required' }, { status: 400 })
  }

  const res = await fetch(`${KID_API}/api/v1/client/claim`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ claimToken }),
  })
  const result = await res.json().catch(() => null)

  if (!res.ok) {
    console.error('[k-id] claim failed', res.status, result)
    return NextResponse.json({ error: 'claim failed' }, { status: 502 })
  }

  // result: { type: 'session' | 'challenge', status, sessionId | challengeId }
  // TODO: store these IDs against the user server-side; unlock nothing until this succeeds.
  console.log('[k-id] claim ok', result)
  return NextResponse.json({ ok: true, type: result?.type, status: result?.status })
}
