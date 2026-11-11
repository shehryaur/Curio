import { NextResponse } from 'next/server'
import { fetchTierForSession, setAgeCookie, tierFromAgeCategory, type Tier } from '@/lib/kidServer'

// Trades the one-time claimToken from <KidSessionProvider onClaim> for the trusted result,
// then records the user's verified age tier in a signed, httpOnly cookie. Feature routes read
// that cookie and never trust the `mode` a request carries. Unlock nothing until this succeeds.
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
  const result = (await res.json().catch(() => null)) as
    | { type?: string; status?: string; sessionId?: string; challengeId?: string; ageCategory?: string }
    | null

  if (!res.ok || !result) {
    console.error('[k-id] claim failed', res.status, result)
    return NextResponse.json({ error: 'claim failed' }, { status: 502 })
  }

  // Decide the verified tier. Prefer ageCategory if the claim already carries it; otherwise ask
  // k-ID's server API directly with the session id. If neither works, fall back to the safest tier.
  let tier: Tier = 'child'
  let minor = true
  if (result.type === 'session' && typeof result.sessionId === 'string') {
    if (result.ageCategory) {
      tier = tierFromAgeCategory(result.ageCategory)
      minor = tier !== 'adult'
    } else {
      const verified = await fetchTierForSession(result.sessionId)
      if (verified) {
        tier = verified.tier
        minor = verified.minor
      } else {
        console.warn('[k-id] could not verify tier for session; defaulting to child/minor')
      }
    }
  }
  // A challenge (minor awaiting guardian consent) stays child/minor until a session is established.

  const out = NextResponse.json({ ok: true, type: result.type, status: result.status, tier })
  setAgeCookie(out, tier, minor)
  return out
}
