// Server-side age enforcement. The browser age gate (@k-id/core) decides what the UI shows,
// but the API routes must NOT trust the `mode` / `isMinor` a request carries: anyone can POST
// `mode: "adult"` directly. After the k-ID age gate passes, /api/kid/claim verifies the session
// with k-ID (server key) and writes a signed, httpOnly cookie recording the user's real tier.
// The feature routes then clamp what the request asked for down to what that cookie allows.
//
// Demo mode (NEXT_PUBLIC_DEMO_MODE=true) bypasses enforcement so judges can switch personas live.
import crypto from 'node:crypto'
import type { NextResponse } from 'next/server'
import type { AgeMode } from './types'

export type Tier = 'child' | 'teen' | 'adult'

// How much each explanation style exposes. `plainWords` is a *simplification* (seniors / frustrated),
// so it is always allowed; it never exposes more than `child`.
const MODE_RANK: Record<AgeMode, number> = { plainWords: 0, child: 0, teen: 1, adult: 2 }
const TIER_RANK: Record<Tier, number> = { child: 0, teen: 1, adult: 2 }

const COOKIE = 'curio_age'
const TTL_MS = 12 * 60 * 60 * 1000
const GAME_API = process.env.KID_GAME_API_HOST ?? 'https://game-api.test.k-id.com'

const isDemo = () => process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
const secret = () => process.env.KID_SECRET_KEY ?? ''

/** Map a k-ID ageCategory (e.g. "adult", "digital-teen", "digital-youth") to a Curio tier. */
export function tierFromAgeCategory(cat: string | null | undefined): Tier {
  const c = (cat ?? '').toLowerCase()
  if (c.includes('adult')) return 'adult'
  if (c.includes('teen')) return 'teen'
  return 'child' // digital-youth / child / minor / unknown -> youngest, safest
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex')
}

function cookieValue(tier: Tier, minor: boolean): string {
  const payload = `${tier}.${minor ? 1 : 0}.${Date.now() + TTL_MS}`
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`
}

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null
  for (const part of header.split(';')) {
    const eq = part.indexOf('=')
    if (eq > -1 && part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim()
  }
  return null
}

export interface AgeContext {
  tier: Tier
  minor: boolean
  /** true when enforcement is bypassed (demo mode): routes should honour the request as-is. */
  demo: boolean
}

/** The authoritative age context for a request: demo bypass, a verified cookie, or the safe default. */
export function ageContext(req: Request): AgeContext {
  if (isDemo()) return { tier: 'adult', minor: false, demo: true }
  const fallback: AgeContext = { tier: 'child', minor: true, demo: false } // fail safe: youngest
  const raw = readCookie(req.headers.get('cookie'), COOKIE)
  if (!raw || !secret()) return fallback

  const dot = raw.lastIndexOf('.')
  if (dot < 1) return fallback
  let payload: string
  try {
    payload = Buffer.from(raw.slice(0, dot), 'base64url').toString('utf8')
  } catch {
    return fallback
  }
  const sig = raw.slice(dot + 1)
  const expected = sign(payload)
  if (sig.length !== expected.length) return fallback
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return fallback

  const [tier, minor, exp] = payload.split('.')
  if (Number(exp) < Date.now()) return fallback
  if (tier !== 'child' && tier !== 'teen' && tier !== 'adult') return fallback
  return { tier, minor: minor === '1', demo: false }
}

/** Clamp the requested explanation style down to what this user's verified tier may see. */
export function clampMode(req: Request, requested: AgeMode): AgeMode {
  const { tier, demo } = ageContext(req)
  if (demo) return requested
  if (MODE_RANK[requested] <= TIER_RANK[tier]) return requested
  return tier // child | teen | adult are all valid AgeMode values
}

/** Server-authoritative minor flag (ignores whatever the request claimed), except in demo mode. */
export function isMinor(req: Request, requested: boolean): boolean {
  const { minor, demo } = ageContext(req)
  return demo ? requested : minor
}

/** Ask k-ID (server key) what tier a freshly claimed session really is. null if it can't be verified. */
export async function fetchTierForSession(sessionId: string): Promise<{ tier: Tier; minor: boolean } | null> {
  if (!secret()) return null
  try {
    const r = await fetch(`${GAME_API}/api/v1/session/get?sessionId=${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${secret()}` },
    })
    if (!r.ok) return null
    const data = (await r.json()) as { ageCategory?: string }
    const tier = tierFromAgeCategory(data.ageCategory)
    return { tier, minor: tier !== 'adult' }
  } catch {
    return null
  }
}

/** Write the signed age cookie onto a response. Call this from /api/kid/claim after verifying the session. */
export function setAgeCookie(res: NextResponse, tier: Tier, minor: boolean): void {
  res.cookies.set(COOKIE, cookieValue(tier, minor), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(TTL_MS / 1000),
  })
}
