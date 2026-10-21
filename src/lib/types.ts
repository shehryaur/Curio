// SHARED CONTRACT between all frontend components and backend routes.
// Change only with team agreement (propose in docs/AGENT_NOTES.md).

/** How Curio explains things. Chosen from the age typed in onboarding (see profile.ts). */
export type AgeMode = 'child' | 'teen' | 'adult' | 'plainWords' // plainWords = seniors / frustrated

/** The three activities on every object. */
export type Activity = 'learn' | 'quiz' | 'explore'

/** Built-in objects that have a hand-made procedural 3D model (no .glb needed). */
export type TemplateId = 'bottle' | 'camera' | 'book' | 'phone' | 'charger' | 'mug' | 'pencil'

/**
 * Part ids per template. The 3D models (components/three) name their meshes with EXACTLY these ids and
 * the lesson content (lib/templates.ts) uses EXACTLY these ids. Do not rename without updating both.
 */
export const TEMPLATE_PART_IDS: Record<TemplateId, readonly string[]> = {
  bottle: ['cap', 'neck', 'body', 'base'],
  camera: ['lens', 'bellows', 'body', 'back', 'tripod'], // antique bellows camera (real PBR .glb)
  book: ['cover', 'spine', 'pages', 'bookmark'],
  phone: ['screen', 'camera', 'side-button', 'charging-port', 'battery'],
  charger: ['prongs', 'casing', 'usbc-port', 'led'],
  mug: ['handle', 'rim', 'body', 'base'],
  pencil: ['eraser', 'ferrule', 'wood', 'tip'],
} as const

export type ByMode = Record<AgeMode, string>

export interface PartInfo {
  id: string // template part id, or 'p1'..'p5' for photo lessons
  name: ByMode // display name per mode ("Lid" for child, "Screw cap" for adult...)
  short: ByMode // Explore label: child/plainWords 3-5 words, teen 5-8 words (scientific function), adult <= 12 words (spec)
  learn: ByMode // Learn tour script for this part (child <= 20 words; teen cause-and-effect; adult spec; plainWords 1 calm sentence)
  safetyTip?: ByMode // optional friendly safety note (e.g. lithium battery). NEVER a lock — everyone can learn every part.
  /** Photo lessons only: where the part is, normalized to the model's bounding box, each axis -1..1 (x right, y up, z toward viewer). */
  anchor?: [number, number, number]
}

export interface QuizQuestion {
  id: string
  prompt: ByMode // "Can you tap the lid?" (child) / "Which part seals the bottle under pressure?" (teen)
  answerPartId: string
  hint: ByMode
  praise: ByMode // said on correct ("Yay! You found it!")
}

export interface ObjectLesson {
  id: string // stable id (template id, or uuid for photos)
  kind: 'template' | 'photo'
  templateId?: TemplateId // set when kind === 'template' (or when a photo matched a template)
  title: ByMode
  emoji: string
  intro: ByMode // what the pet says when the object opens
  causeAndEffect?: string // teen chain, "A -> B -> C"
  parts: PartInfo[] // templates: one per TEMPLATE_PART_IDS entry; photos: 3-5
  quiz: QuizQuestion[] // exactly 3
  /** Adult Learn: "Learn more" links. Only well-known stable reference pages (e.g. en.wikipedia.org); never invented URLs. */
  sources?: { title: string; url: string }[]
  source: 'template' | 'gemini' | 'fallback'
}

/** POST /api/analyze — identify a photo. */
export interface AnalyzeRequest {
  imageBase64: string // data URL or raw base64 JPEG/PNG/WebP (client shrinks to <= 768px)
  mode: AgeMode
  name?: string
  interests?: string[]
}
export interface AnalyzeResponse {
  lesson: ObjectLesson // if the photo is one of the templates, this IS the template lesson (kind 'template')
  matchedTemplate: TemplateId | null
  /** true => no template matched: frontend should build a 3D model with /api/meshy */
  needsModel: boolean
}

/** POST /api/ask — answer a typed or spoken question about the current object */
export interface AskRequest {
  question: string
  objectTitle: string
  /** Parts of the current object, so the answer can point at one (teen "what-if" rotates the model to it). */
  parts?: { id: string; name: string }[]
  mode: AgeMode
  name?: string
  interests?: string[]
}
export interface AskResponse {
  answer: string
  /** The part the answer is about (one of AskRequest.parts ids), or null. */
  focusPartId?: string | null
  source: 'gemini' | 'fallback'
}

/** POST /api/tts */
export interface TtsRequest {
  text: string // <= 2000 chars
  mode: AgeMode
}
export interface TtsResponse {
  audioDataUri: string | null
  source: 'inworld' | 'unavailable'
  error?: string
}

/** POST /api/voice  (multipart: "audio" blob, "isMinor" "true"|"false") */
export interface VoiceResponse {
  transcript: string
  emotion: string | null
  isFrustrated: boolean
  piiRedacted: boolean
  source: 'modulate' | 'unavailable'
  error?: string
}

/** POST /api/meshy { imageBase64 } -> { taskId }   GET /api/meshy?taskId= -> MeshyStatus; model via GET /api/meshy?proxy=<taskId> */
export interface MeshyStatus {
  taskId: string
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'UNAVAILABLE'
  progress: number
  glbUrl?: string
  proxyUrl?: string
  error?: string
}

export interface ApiError {
  error: string
}

/** Saved after onboarding (localStorage via lib/profile.ts). */
export interface Profile {
  name: string
  age: number
  mode: AgeMode
  interests: string[]
  isMinor: boolean
}

// ---- Component contracts (implemented by different agents) ----

/** components/three/ObjectViewer.tsx (default export) */
export interface ObjectViewerProps {
  lesson: ObjectLesson
  mode: AgeMode
  /** Meshy model for photo lessons. If absent and lesson.templateId is set, the procedural model is used. */
  glbUrl?: string | null
  /** Shown as a 2D image with part pins when there is no 3D model yet (Meshy generating / unavailable). */
  photoUrl?: string | null
  /** Learn: camera eases toward this part and it glows. */
  focusPartId?: string | null
  /** Extra highlight (e.g. hovered or correct quiz answer). */
  highlightPartId?: string | null
  /** 'none' = Learn (auto camera), 'click' = Quiz, 'hover' = Explore (hover shows label, drag to spin). */
  interaction: 'none' | 'click' | 'hover'
  /** Explore: floating label (part name + short text) on hover. */
  showLabels?: boolean
  /** Explore: 0..1 pulls the parts apart (exploded view). Procedural models only. */
  explode?: number
  /**
   * Age-specific visual guide drawn AT the focused part (Learn) or the hovered part:
   * 'pet' = little Pip flies part-to-part (child) · 'reticle' = sci-fi HUD target ring (teen) ·
   * 'finger' = giant high-contrast yellow "👆 TOUCH HERE" badge (plainWords) · 'none' (adult).
   */
  guide?: 'pet' | 'reticle' | 'finger' | 'none'
  /** plainWords: hide every part pin/label except the focused one and zoom ~2x closer on it. */
  singlePart?: boolean
  /** Adult Explore: show every part label at once (CAD-style numbered callouts). */
  showAllLabels?: boolean
  /** Teen: X-ray / wireframe look (translucent shell, internal parts visible). */
  xray?: boolean
  onPartHover?: (partId: string | null) => void
  onPartClick?: (partId: string) => void
}

/** components/Pet.tsx (default export) — Curio's original pet guide "Pip". */
export type PetMood = 'idle' | 'talking' | 'happy' | 'thinking' | 'oops'
export interface PetProps {
  mood: PetMood
  message?: string // speech bubble text
  size?: 'sm' | 'md' | 'lg'
}

/** POST /api/learn — "What do you want to learn about?" (typed or spoken topic, e.g. "what is a camera?") */
export interface LearnRequest {
  topic: string
  mode: AgeMode
  name?: string
  interests?: string[]
}
export interface LearnResponse {
  topic: string // cleaned object name, e.g. "camera"
  story: string // age-adapted story Pip tells (child: playful tale; teen: how-it-works; adult: history + engineering; plainWords: calm 2-3 sentences)
  lesson: ObjectLesson // Learn / Quiz / Explore content (kind 'template' if a starter object matched, else 'photo' with anchors)
  matchedTemplate: TemplateId | null
  /** true => no starter model: start Meshy text-to-3D with POST /api/meshy/text { topic } and poll GET ?taskId=&stage=&topic= */
  needsModel: boolean
  source: 'nvidia' | 'gemini' | 'fallback'
}
