// SHARED CONTRACT between frontend and all backend routes. Change only with team agreement.

/** How Curio explains things. Derived from k-ID ageStatus, overridable by the persona switcher. */
export type AgeMode = 'child' | 'teen' | 'adult' | 'plainWords'

export type PropType = 'charger' | 'phone' | 'bottle' | 'wildcard'

export interface StepScripts {
  child: string // <= 14 words, concrete, playful
  teen: string // cause-and-effect STEM
  adult: string // full technical detail
  plainWords: string // very short, calm, one instruction (senior / frustrated)
}

export interface TourStep {
  stepNumber: 1 | 2 | 3
  partName: string
  isHazardForChild: boolean // true => locked for minors until guardian approves
  scripts: StepScripts
}

/** POST /api/analyze */
export interface AnalyzeRequest {
  imageBase64?: string // data URL or raw base64 JPEG/PNG; omit when propHint is given
  propHint?: PropType // manual "pick an object" fallback; skips vision
  mode: AgeMode
  jurisdiction?: string // e.g. "US-CA", "GB"
}
export interface AnalyzeResponse {
  detectedPropType: PropType
  objectTitle: string
  causeAndEffectChainForTeen: string // "A -> B -> C"
  steps: TourStep[] // always exactly 3
  childSpatialTapQuestion: { prompt: string; correctStepNumber: 1 | 2 | 3 }
  source: 'gemini' | 'fallback' // fallback = canned tour (no key / API error / propHint)
}

/** POST /api/tts */
export interface TtsRequest {
  text: string // <= 2000 chars
  mode: AgeMode
}
export interface TtsResponse {
  audioDataUri: string | null // "data:audio/mpeg;base64,..." or null when TTS unavailable
  source: 'inworld' | 'unavailable'
  error?: string
}

/** POST /api/voice  (multipart/form-data: field "audio" = recorded blob, field "isMinor" = "true"|"false") */
export interface VoiceResponse {
  transcript: string // PII tags removed/replaced with "[hidden]" when isMinor
  emotion: string | null // raw Modulate label, e.g. "Angry", "Neutral"
  isFrustrated: boolean // true => frontend switches to plainWords mode
  piiRedacted: boolean
  source: 'modulate' | 'unavailable'
  error?: string
}

/** POST /api/meshy  { imageBase64 } -> { taskId }   GET /api/meshy?taskId=... -> status */
export interface MeshyStatus {
  taskId: string
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'UNAVAILABLE'
  progress: number // 0-100
  glbUrl?: string
}

/** Standard error body for any route */
export interface ApiError {
  error: string
}

/** POST /api/ask  — answer a typed or spoken question about the current object */
export interface AskRequest {
  question: string
  objectTitle: string
  mode: AgeMode
}
export interface AskResponse {
  answer: string // length/style adapted to mode
  source: 'gemini' | 'fallback'
}
