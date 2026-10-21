// Gemini vision: identify prop + return 3-step tour JSON per age mode. Owner: Shehryar
import { NextResponse } from 'next/server'
import { getFallbackTour } from '@/lib/fallbackTours'
import {
  analyzeSchema,
  buildAnalyzePrompt,
  generateJson,
  hasGeminiKey,
  isAgeMode,
  isPropType,
  parseImage,
} from '@/lib/gemini'
import type { AnalyzeResponse, PropType, StepScripts, TourStep } from '@/lib/types'

export const runtime = 'nodejs'

const GEMINI_TIMEOUT_MS = 12_000
const MAX_IMAGE_CHARS = 10_000_000 // ~7.5 MB decoded

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || typeof body !== 'object') return bad('body must be JSON')

  const { imageBase64, propHint, mode, jurisdiction } = body
  if (!isAgeMode(mode)) return bad('mode must be child | teen | adult | plainWords')
  if (propHint !== undefined && !isPropType(propHint)) return bad('propHint must be charger | phone | bottle | wildcard')
  if (imageBase64 !== undefined && typeof imageBase64 !== 'string') return bad('imageBase64 must be a string')
  if (jurisdiction !== undefined && typeof jurisdiction !== 'string') return bad('jurisdiction must be a string')
  if (!imageBase64 && !propHint) return bad('imageBase64 or propHint is required')
  if (typeof imageBase64 === 'string' && imageBase64.length > MAX_IMAGE_CHARS) return bad('image too large', 413)

  // Manual "pick an object" path: instant canned tour, never touches the network.
  if (propHint && propHint !== 'wildcard') return NextResponse.json(getFallbackTour(propHint))

  const bestGuess: PropType = propHint ?? 'wildcard'
  const image = imageBase64 ? parseImage(imageBase64) : null
  if (!image) {
    if (imageBase64) return bad('imageBase64 is not valid base64 image data')
    return NextResponse.json(getFallbackTour(bestGuess)) // wildcard hint without an image
  }
  if (!hasGeminiKey()) {
    console.error('[analyze] GEMINI_API_KEY not set; serving fallback')
    return NextResponse.json(getFallbackTour(bestGuess))
  }

  try {
    const raw = await generateJson({
      prompt: buildAnalyzePrompt(mode, jurisdiction),
      schema: analyzeSchema,
      image,
      timeoutMs: GEMINI_TIMEOUT_MS,
    })
    return NextResponse.json(normalizeTour(raw))
  } catch (err) {
    console.error('[analyze] Gemini failed; serving fallback:', err instanceof Error ? err.message : String(err))
    return NextResponse.json(getFallbackTour(bestGuess))
  }
}

// ---------- normalization: make Gemini output satisfy the contract no matter what ----------

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}

function clampWords(text: string, max: number): string {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length <= max) return text
  return words.slice(0, max).join(' ').replace(/[,;:\-]+$/, '') + '.'
}

function normalizeTour(raw: unknown): AnalyzeResponse {
  const r = obj(raw)
  const detected: PropType = isPropType(r.detectedPropType) ? r.detectedPropType : 'wildcard'
  const fb = getFallbackTour(detected)

  // Order by stepNumber when present, otherwise keep array order; take 3, pad from fallback.
  const rawSteps = (Array.isArray(r.steps) ? r.steps : [])
    .map(obj)
    .map((s, i) => ({ s, key: typeof s.stepNumber === 'number' ? s.stepNumber : i + 1 }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.s)

  const steps: TourStep[] = ([1, 2, 3] as const).map((n, i) => {
    const s = rawSteps[i] ?? {}
    const fbStep = fb.steps[i]
    const sc = obj(s.scripts)
    const scripts: StepScripts = {
      child: clampWords(str(sc.child) || fbStep.scripts.child, 14),
      teen: str(sc.teen) || fbStep.scripts.teen,
      adult: str(sc.adult) || fbStep.scripts.adult,
      plainWords: str(sc.plainWords) || fbStep.scripts.plainWords,
    }
    return {
      stepNumber: n,
      partName: str(s.partName) || fbStep.partName,
      isHazardForChild: n === 3 ? true : s.isHazardForChild === true,
      scripts,
    }
  })

  const q = obj(r.childSpatialTapQuestion)
  const correct = q.correctStepNumber
  const correctStepNumber: 1 | 2 | 3 = correct === 1 || correct === 2 || correct === 3 ? correct : 1
  const prompt = str(q.prompt)

  return {
    detectedPropType: detected,
    objectTitle: str(r.objectTitle) || fb.objectTitle,
    causeAndEffectChainForTeen: str(r.causeAndEffectChainForTeen) || fb.causeAndEffectChainForTeen,
    steps,
    childSpatialTapQuestion: prompt ? { prompt, correctStepNumber } : fb.childSpatialTapQuestion,
    source: 'gemini',
  }
}
