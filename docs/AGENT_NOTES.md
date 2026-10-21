# Agent notes (shared log)

Each agent appends a short section here when done: files touched, endpoint contract, env vars used,
anything another agent must know. The contract of record is `src/lib/types.ts`.

## Inworld TTS agent
**Files:** `src/lib/inworld.ts` (server-only helper), `src/app/api/tts/route.ts`.
**Contract:** `POST /api/tts` body `TtsRequest { text, mode }` -> `TtsResponse`. No changes to types.ts.
- 400 `{ error }` only for a bad body: not JSON, missing or empty `text`, or `mode` not in child|teen|adult|plainWords.
- Otherwise always **200**: `{ audioDataUri: 'data:audio/mpeg;base64,...', source: 'inworld' }`, or
  `{ audioDataUri: null, source: 'unavailable', error }` when the key is missing, Inworld returns an error, or the call takes over 15s.
  Frontend: on `null`, show subtitles only and keep the tour going.
**Env:** `INWORLD_API_KEY` (required; the portal key is already Base64 and is sent as `Authorization: Basic <key>`),
`INWORLD_VOICE_ID` (default `Ashley`), `INWORLD_TTS_MODEL` (default `inworld-tts-2`).
**Behavior:**
- Calls `POST https://api.inworld.ai/tts/v1/voice` and asks for MP3.
- Settings per mode:
  - child: rate 0.95, `[say warmly and playfully]`, BALANCED
  - teen/adult: rate 1.05, no prefix, STABLE
  - plainWords: rate 0.85, `[say slowly and calmly]`, STABLE
- The prefix and `deliveryMode` are only sent on tts-2 models.
- If Inworld rejects `speakingRate` (a 400 that mentions it), it retries once without it.
- Text is trimmed and cut so prefix + text is at most 2000 chars.
- An in-memory LRU cache (50 entries, keyed by mode + text) makes replaying the tour instant. It is per server process.
- Never logs the key, the text or the Inworld response body. Only a short warning line is logged.
- `runtime = 'nodejs'`.
- Not live-tested (no network to Inworld from the agent shell); type-check passes.

## Modulate voice agent (POST /api/voice)
Files: `src/lib/modulate.ts` (server-only helper), `src/app/api/voice/route.ts` (`runtime = 'nodejs'`).
Env: `MODULATE_API_KEY` (server only). Upstream: `POST https://platform.modulate.ai/api/velma-2-stt-batch`
(transcript + per-utterance emotion + PII/PHI tagging, one call, 20s timeout).

Browser call:
```ts
const fd = new FormData()
fd.append('audio', blob)            // MediaRecorder blob (webm/opus ok; ogg/mp4/wav/mp3 also)
fd.append('isMinor', isMinor ? 'true' : 'false') // default "true" when omitted (safest)
// optional: fd.append('language', 'en')
const r: VoiceResponse = await (await fetch('/api/voice', { method: 'POST', body: fd })).json()
if (r.isFrustrated) setMode('plainWords')
```
Do NOT set a Content-Type header yourself (the browser adds the multipart boundary).

Behavior:
- 400 missing/empty `audio` or non-multipart body; 413 if audio > 10MB. Otherwise always HTTP 200 `VoiceResponse`.
- No key / Modulate error / timeout -> `{transcript:'', emotion:null, isFrustrated:false, piiRedacted:false, source:'unavailable', error}`.
- isMinor: `pii_phi_tagging` on; every `<pii:*>…</pii:*>` / `<phi>…</phi>` span -> `[hidden]`, `piiRedacted=true`. Adults: tags stripped, words kept.
- `emotion` = label with most utterance duration (raw Modulate casing, e.g. "Angry"), null if none.
- `isFrustrated` = dominant or any utterance emotion in {angry, disgusted, afraid, sad, frustrated, annoyed, confused, anxious}
  OR transcript heuristic ("too many", "where do i", "i don't get", "doesn't work", "confused", "what is this", "help", `??`, `!!`).
- Reusable exports in modulate.ts: `transcribeVoice`, `isFrustratedEmotion`, `transcriptSoundsFrustrated`, `FRUSTRATED_EMOTIONS`,
  `dominantEmotion`, `redactPii`, `audioFilename`.
- Never logs key, audio, or transcripts (only HTTP status / timeout).
- Not live-tested against Modulate (no network from the dev VM); type-checked and unit-sanity-checked locally.
- Contract proposal (optional, not applied): `VoiceResponse.language?: string` if the UI wants detected language.

## Meshy agent (optional stretch: wildcard photo -> 3D .glb)
Files: `src/lib/meshy.ts` (new, server-only), `src/app/api/meshy/route.ts` (stub replaced). `runtime = 'nodejs'`.
Env: `MESHY_API_KEY` (optional), `MESHY_AI_MODEL` (optional, e.g. `meshy-5`; unset => field omitted, Meshy default).

Contract:
- `POST /api/meshy` `{ imageBase64 }` (data URL or raw base64 JPEG/PNG/WebP, max ~8MB) -> **201** `{ taskId }`.
  On no key / bad input / Meshy error -> **200** `{ taskId: '', status: 'UNAVAILABLE', progress: 0, error }`.
- `GET /api/meshy?taskId=...` -> `MeshyStatus` (+ `proxyUrl` when SUCCEEDED, + `error` when UNAVAILABLE).
  CANCELED/EXPIRED map to FAILED. `glbUrl` = raw Meshy URL (signed, cross-origin, may expire).
- `GET /api/meshy?proxy=<taskId>` -> streams the finished GLB same-origin (`model/gltf-binary`).
  The URL is re-resolved server-side from the task status and only https `*.meshy.ai` hosts are proxied;
  clients can never pass a URL. Errors here are real HTTP errors (400/502/503) so `<model-viewer>` fails cleanly.
- **Frontend: load `proxyUrl` in `<model-viewer>`, not `glbUrl`.**

Polling advice: poll GET every ~5s; generation typically takes 1-3 min. Show the progress % and keep the
preset/placeholder model on screen meanwhile; swap in only on SUCCEEDED. Stop on FAILED/UNAVAILABLE and keep the preset.
Every Meshy call has a 15s timeout (GLB download 90s). Keys are never logged or returned.

Caveat: Meshy endpoint/field names (`/openapi/v1/image-to-3d`, `result`, `status`, `progress`, `model_urls.glb`)
were written from memory and NOT verified against live Meshy today (no network from the build shell); parsing is
defensive. If GLB proxying fails with "Model host not allowed", Meshy is serving assets from a non-`meshy.ai`
host — add it in `isAllowedAssetUrl` in `src/lib/meshy.ts`. Type-checked with `tsc --noEmit` (clean).

## Gemini backend (/api/analyze, /api/ask) — Gemini agent

**Files:** `src/lib/gemini.ts` (server-only client, schemas, prompts, `parseImage`, `isAgeMode`/`isPropType`),
`src/lib/fallbackTours.ts` (canned tours for charger / phone / bottle / wildcard, all 4 modes; `getFallbackTour(prop)`),
`src/app/api/analyze/route.ts`, `src/app/api/ask/route.ts` (new). Both routes: `runtime = 'nodejs'`. No change to `types.ts`.

**Env:** `GEMINI_API_KEY` (required for live vision), `GEMINI_MODEL` (optional, default `gemini-2.5-flash`).

**POST /api/analyze** — body `AnalyzeRequest`, returns `AnalyzeResponse` (always HTTP 200 unless input is bad).
```json
{ "imageBase64": "data:image/jpeg;base64,/9j/...", "mode": "teen", "jurisdiction": "GB" }
{ "propHint": "charger", "mode": "child" }
```
Response: `{ detectedPropType, objectTitle, causeAndEffectChainForTeen, steps:[3], childSpatialTapQuestion:{prompt,correctStepNumber}, source }`.
- `propHint` charger/phone/bottle → canned tour instantly (`source:"fallback"`), no network. Use this for the manual picker.
- No key / Gemini error / >12s timeout / wildcard hint without image → canned tour for the hint or `wildcard` (generic "Mystery Object"), `source:"fallback"`, HTTP 200.
- Gemini output is normalized: exactly 3 steps numbered 1..3, step 3 `isHazardForChild:true`, all 4 scripts non-empty (gaps filled from the fallback for the detected prop), child script clamped to 14 words, tap-question step clamped to 1..3.
- 400: missing/invalid `mode`, invalid `propHint`, neither image nor hint, non-base64 image. 413: image > ~7.5 MB.
- Image accepts data URL (jpeg/png/webp detected from prefix) or raw base64 (assumed jpeg). Downscale on the client (~768px JPEG) for speed.

**POST /api/ask** — body `AskRequest` `{ "question": "Why does it get warm?", "objectTitle": "USB-C Wall Charger", "mode": "teen" }`
→ `AskResponse` `{ answer, source: "gemini" | "fallback" }`. Sentence cap: child 2, plainWords 1, teen/adult 4. Question truncated to 500 chars.
Child/teen prompt forbids open/tamper instructions for electrical/battery internals ("ask a grown-up"). No key / error / 10s timeout → canned per-mode answer, HTTP 200.

Logs use `[analyze]` / `[ask]` prefixes with error messages only — never keys or image data.

## Frontend agent
**Files:** `src/app/page.tsx`, `src/hooks/useCurioSession.ts`, `src/components/{KidTopBar,CameraScanner,Curio3DStage,GuardianModal,MicButton}.tsx`,
new `src/lib/api.ts` (never-throwing fetch helpers) and `src/lib/speak.ts` (TTS + subtitle timing), curio-* classes appended to `globals.css`.
No changes to types.ts / personas.ts / propPresets.ts / KidRoot.tsx / kidConfig.ts. Client imports `src/lib/fallbackTours.ts` (pure data) as an offline safety net.

**Component map**
```
page.tsx (useCurioSession = all state)
├─ KidTopBar        persona <select> (k-ID default | PERSONAS), mode badge, Settings, <details> k-ID inspector (ageStatus, jurisdiction, permissions JSON)
├─ Plain-words badge  (only when frustration override is active)
├─ CameraScanner    camera gated camera-access + ai-media-upload; Snap -> JPEG <=1024w q0.8 -> analyze({imageBase64});
│                   Charger/Phone/Water bottle buttons ALWAYS shown -> analyze({propHint})
├─ Tour card        Curio3DStage (model-viewer or placeholder, hotspots + pin row, subtitle bar, Meshy for wildcard)
│                   ▶ Play guided tour / ■ Stop, 🔒 Grown-up unlock
├─ Ask card         text box (ai-chat) -> askOwl; MicButton (ai-voice-mode) -> /api/voice -> handleVoice -> askOwl
└─ GuardianModal    <KidSessionVerifyAge>; Pass slot -> unlockHazards() (session-only, in memory); Cancel
```
**State flow (useCurioSession)**
- `baseMode` = persona.mode if a persona is picked, else `modeFromAgeStatus(session.ageStatus)`.
- `mode` = `personalized-recommendations` ON ? (`modeOverride` ?? baseMode) : `'teen'` (standard lesson, no mood switching).
- `isMinor` = isMinorMode(baseMode) (frustration override never unlocks hazards). Locked = `isHazardForChild && isMinor && !hazardsUnlocked`.
- `analyze()` POST /api/analyze `{imageBase64|propHint, mode, jurisdiction}`; on failure with a propHint it uses FALLBACK_TOURS client-side and shows a note.
- Tour: steps 1->3, sets `activeStep`, speaks `scripts[mode]` (or "This part needs a grown-up. Ask them to unlock it!" if locked) via `speak()`:
  POST /api/tts -> play `audioDataUri` and await `ended`; null/blocked -> wait max(1.5s, words*350ms). One AbortController; Stop/new speech cancels.
- Pin click: locked -> GuardianModal; else focus + speak that step.
- Voice: `isFrustrated` && personalized -> `modeOverride='plainWords'`, `activeStep=1` (stage shows only that pin, bigger, camera zooms to it); then transcript -> /api/ask with the new mode -> spoken answer. Personalized off -> note only.
- Persona change clears modeOverride.
- Meshy (wildcard + a snapshot): POST /api/meshy `{imageBase64}`, poll GET `?taskId=` every 5s, on SUCCEEDED load `/api/meshy?proxy=<taskId>`.

**For the integrator**
- `.glb` files: stage HEADs `PROP_PRESETS[type].modelUrl`; missing/404/model 'error' -> placeholder panel (pins still work). Hotspot coords in propPresets are placeholders.
- Persona switcher can "upgrade" a real minor to Adult (demo by design) - hide it for production.
- Hazard unlock is in-memory only (resets on reload).

## Backend agent: Gemini routes v2 (analyze → ObjectLesson, ask personalization)
Files: `src/lib/gemini.ts`, `src/app/api/analyze/route.ts`, `src/app/api/ask/route.ts`, `src/lib/fallbackLesson.ts` (new). `src/lib/fallbackTours.ts` is DELETED (old PropType tours) — frontend must not import it.

**POST /api/analyze** `{ imageBase64, mode, name?, interests? }` → `AnalyzeResponse { lesson, matchedTemplate, needsModel }` (always HTTP 200 unless the body is bad).
- One Gemini call (`GEMINI_MODEL` ?? `gemini-2.5-flash`), JSON mode + compact responseSchema, `thinkingBudget: 0`, 25s timeout (AbortController + race).
- The schema's `matchedTemplate` enum is built per request from templates that actually exist in `TEMPLATES` (missing ones are never matched). When matched, the model is told to return empty parts/quiz, so the match path is fast.
- Matched → `{ lesson: getTemplateLesson(id) (intro gets "Hi <name>!" when name given), matchedTemplate: id, needsModel: false }`.
- Not matched → `kind:'photo'`, `source:'gemini'`, `id` = uuid, 3–5 parts `p1..pN`, every ByMode filled (missing modes copied from the nearest mode; child learn clamped to 20 words), `anchor` = [x,y from photo position clamped -1..1, z 0.8 visible / 0 internal], optional `safetyTip` (never a lock), exactly 3 quiz items with existing `answerPartId` (padded with generated "Can you tap the …?" questions if needed), `needsModel: true`.
- Interests: ONE interest woven into intros as an analogy. Name optional in the intro.
- Any failure (no key / API error / timeout / bad JSON) → `getFallbackLesson(name)` ("Mystery object", parts p1 top / p2 middle / p3 bottom with anchors y 0.7 / 0 / -0.7, 3 quiz items), `source:'fallback'`, `needsModel: true`, `matchedTemplate: null`.
- 400 bad body / invalid base64, 413 when imageBase64 > 10M chars (~7.5MB). Logs: `[analyze] ok <template|photo> in Nms` / `[analyze] Gemini failed after Nms: <message>`.

**POST /api/ask** `{ question, objectTitle, mode, name?, interests? }` → `{ answer, source }`. thinkingBudget 0, 12s timeout. Child/teen: explains how things work but never gives steps to open/tamper with batteries, electrics, blades, hot parts — suggests a grown-up. No refusals for ordinary curiosity.

## Content agent: template lessons (`src/lib/templates.ts`)
- Full `ObjectLesson`s for all 6 templates (bottle, book, phone, charger, mug, pencil). The exports and signatures match the stub: `TEMPLATE_ORDER`, `TEMPLATES`, `getTemplateLesson(id)` (returns a structuredClone). It is plain data and safe on client and server.
- Part ids match `TEMPLATE_PART_IDS` exactly and in order. Each lesson has 3 quiz questions with valid `answerPartId`. Every ByMode has all 4 modes filled. Each lesson has a `causeAndEffect` chain.
- Checked: every `short` (all modes) is 3-5 words, every child `learn` is 20 words or fewer, and no ByMode is empty.
- `safetyTip` (friendly, never a lock) is on: bottle.body (don't refill single-use bottles), phone.battery (Li-ion: bend/puncture/pillow/swelling), charger.prongs, mug.rim + mug.body (hot drinks), pencil.tip (sharp).
- Quiz answers: bottle cap/body/base; book spine/pages/bookmark; phone screen/charging-port/battery; charger prongs/casing/usbc-port; mug handle/rim/base; pencil eraser/ferrule/tip.

## Onboarding + k-ID agent
**Files:** `src/components/KidRoot.tsx`, `src/components/onboarding/{OnboardingContext,Gate,OnboardingChat}.tsx` + `Onboarding.module.css`,
`src/components/ProfileProvider.tsx`, `src/components/SettingsPanel.tsx`, `src/lib/kidStorage.ts`. The drop-in `<KidAgeGate>` is gone:
k-ID runs in headless (Tier 3) mode behind a Pip chat (name → [country if auto fails] → age or birthday → interests → grown-up email → wait).

**Tree**
```
KidCoreProvider(kidConfig)
└─ OnboardingContext (jurisdiction 'auto'|code, age, email, draft — state lives in KidRoot)
   └─ KidSessionProvider key={n} jurisdiction age email sessionId challengeId onSession onChallenge onClaim(/api/kid/claim)
      └─ Gate: saved profile+session & pass → app | else <OnboardingChat/> → saveProfile → app
         app = KidSettingsProvider(sessionId, settings challengeId persisted) → ProfileProvider → {children}
```
- **For the experience agent:** `import { useProfile } from '@/components/ProfileProvider'` →
  `{ profile, setMode, resetMode, startOver, baseMode, isModeOverridden }`. `profile.mode` is the EFFECTIVE mode (override applied);
  `setMode('plainWords')` is per-visit only. `useKidPermissionSettings()` / `<KidSettings/>` / `useKidPermission()` / `useKidSession()` work anywhere in
  the app (both providers are mounted above it). `SettingsPanel({ onClose })` kept its signature; it now shows the profile + `<KidSettings/>` + Start over.
- Age signal: `{ age }` unless `requirements.approvedAgeCollectionMethods` lacks `age-slider` (then a date input → `{ dateOfBirth }`).
  The age prop is set right after the age answer, so the k-ID check runs while the player picks interests.
- Unresolved `auto` jurisdiction: the SDK doesn't expose `step` publicly, so the chat mounts a hidden `<KidSelectJurisdiction/>` as a probe
  (it renders only during the jurisdiction step) and shows its own searchable list from `useKidJurisdictions()`; the pick goes in the `jurisdiction` prop.
- Consent send: `setEmail` → wait one tick (provider's configure effect runs after child effects) → `submit()`; resend = `submit()` again.
- Persistence: `curio.kid.sessionId`, `.challengeId`, `.settingsChallengeId`, plus `curio.onboarding.draft` (name/age/dob/interests/jurisdiction/email)
  so a pending consent survives reload. Session without profile → everything cleared. Resumed challenges ignore new props in the SDK, so
  "Change email" on a resumed request starts a fresh request with the same answers (remount). fail → Try again (clear ids, remount, keep answers);
  error → Retry (remount; same ids when resuming).

## Experience agent (main app screens) — supersedes the "Frontend agent" section above
**Files:** `src/app/page.tsx`, `src/hooks/{useProgress,useSpeaker,useMeshyModel,useGrownupAsk}.ts`, `src/lib/progress.ts` (new),
`src/lib/api.ts` + `src/lib/speak.ts` (unchanged), `src/components/experience/*` (TopBar, HomeScreen, PhotoFlow, CameraView,
GrownupAsk, ObjectScreen, LearnPanel, QuizPanel, ExplorePanel, AskPip, MicButton, shared.ts, experience.module.css).
Deleted: `src/hooks/useCurioSession.ts`, `src/components/{KidTopBar,GuardianModal,CameraScanner,MicButton}.tsx`.
No change to types.ts.

**Screens:** page.tsx holds `screen = home | photo | object` + the Meshy job (so it survives the Settings overlay).
Settings opens `SettingsPanel` in an overlay sheet; the Object screen goes quiet while it is open.
Top bar: wordmark, "Hi {name}", XP + streak pills (`useProgress`), ⚙️, and "Plain words mode · back to normal" when
`isModeOverridden && mode === 'plainWords'` (resetMode).

**Permissions (k-ID only):** `useGrownupAsk(names)` — missing = not enabled in `useKidPermission()` nor in `useKidPermissionSettings().permissions`.
PLAYER-managed ones are switched on with `change(name, true)`; the rest go in ONE `upgrade(names, email?)` (email asked inline when
`hasApproverEmail` is false); then polls `useKidSession().refresh()` + settings `refresh()` every 4s until on. PROHIBITED -> kind "not available
where you live" + pick an object. Photo flow: no camera-access -> ask for all missing of camera-access/ai-media-upload/ai-media-generation
(continues as soon as camera-access is on) -> camera (rear, JPEG <=768px q0.8, file-picker fallback on deny/no camera) -> preview ->
if upload/generation still missing ask again -> auto-continues with the held photo -> POST /api/analyze (name/interests only with
personalized-recommendations). matchedTemplate -> `getTemplateLesson`; else lesson + photoUrl, and if `needsModel` + ai-media-generation,
`useMeshyModel.start(photo)` (POST, poll every 5s, glbUrl = proxyUrl ?? `/api/meshy?proxy=<id>`; FAILED/UNAVAILABLE -> keeps photo + note).

**Object screen:** ObjectViewer via next/dynamic (ssr:false). Learn = interaction 'none' + focusPartId; Quiz = 'click'; Explore = 'hover' +
showLabels + explode slider (only when `lesson.templateId` and no glb). One `useSpeaker()` per object screen: every line cancels the
previous; tab switch / unmount / settings stop it. Learn never autoplays (starts on the Play tap). Learn finish +10 XP (once per visit);
each correct quiz answer +10 XP; quiz end `recordStreakDay()`. Ask Pip: text gated by ai-chat, hold-to-talk by ai-voice-mode;
voice `isFrustrated` -> `setMode('plainWords')`, reassurance line, focus+highlight part 1, then answers in plainWords.
Progress lives in localStorage `curio.progress` `{xp, streak, lastDay}`; a streak that missed a day displays as 0.

**For the integrator:** `src/lib/propPresets.ts` (not mine) still imports the removed `PropType` and breaks `tsc`/`next build`;
nothing imports it — delete it (the build passes without it).

## 3D + visuals agent (ObjectViewer, models, Pip)
**Files:** `src/components/three/ObjectViewer.tsx` (default export, `ObjectViewerProps`), `three/ViewerLoading.tsx`, `three/partContext.tsx` (Part / Normalize / context),
`three/models/{Bottle,Book,Phone,Charger,Mug,Pencil}.tsx` + `models/index.ts` (`TEMPLATE_MODELS`), `three/GlbModel.tsx`, `three/PhotoPins.tsx`, `three/ObjectViewer.module.css`,
`src/components/Pet.tsx` + `Pet.module.css`. Deleted `src/components/Curio3DStage.tsx`.

**Load it:** `const ObjectViewer = dynamic(() => import('@/components/three/ObjectViewer'), { ssr: false, loading: () => <ViewerLoading /> })`
(`import ViewerLoading from '@/components/three/ViewerLoading'`, safe to import statically). Give the parent a height (it fills 100% x 100%, min-height 320px, inherits border-radius).

**Render choice:** glbUrl loaded OK -> GLB + numbered pins at `part.anchor` · else `lesson.templateId` -> procedural model · else PhotoPins (photo, or the lesson emoji if no photo).
While a glbUrl downloads: photo + pins with a "Building your 3D model…" chip (or the template model, or the loading card). GLB fetch errors / WebGL failure fall back silently (console.warn only).
GLB is loaded with GLTFLoader (no Draco, no CDN). No HDR/fonts downloaded.

**Behavior:**
- `interaction='hover'`: hover highlights + `onPartHover(id|null)`; with `showLabels` a card shows `name[mode]` + `short[mode]`. A tap/click ALSO calls `onPartClick` (touch devices have no hover) and pins the label.
- `'click'`: hover glow + `onPartClick(id)` (front-most part only; drags > 8px are ignored).
- `'none'`: no events, slow auto-rotate unless `focusPartId` set.
- Drag rotates in every mode; wheel/pinch zoom limited; no panning.
- `focusPartId`: camera eases to that part (phone battery is viewed from the back through the tinted cover) + soft glow. `null` -> eases back to the default view.
- `highlightPartId`: strong pulsing green glow (correct answer). Works with GLB/photo pins too.
- `explode` 0..1 (templates only): parts slide apart along per-part vectors; camera backs off.
- `onPartHover` fires only on changes. Keyboard: hidden buttons per part in click/hover modes; photo pins are real buttons.
- Part ids are EXACTLY `TEMPLATE_PART_IDS`.

**Pet:** `<Pet mood="idle|talking|happy|thinking|oops" message? size="sm|md|lg" />` (48/88/140px). Bubble is right of Pip, below it at <=640px. Respects prefers-reduced-motion.

## Meshy model choice (integrator, verified live)
- Default preset: `model_type: smart-topology`, `ai_model: meshy-t2`, `target_polycount: 15000`, `should_texture: true`,
  `texture_resolution: 2k`, `target_formats: ['glb']`, PBR off. Fallback on a 400: `standard` + `meshy-6-lite`.
- Live test (canvas apple): created in 0.5s, SUCCEEDED in 31s, proxy served a 1.7 MB textured GLB (15.8k tris) in 0.36s.
- Override with `MESHY_AI_MODEL` (e.g. `meshy-7.1` for max quality, ~2 min, 30 credits).

## Content agent, round 2: camera lesson, age tiers, sources (`src/lib/templates.ts`)
- Added the `camera` lesson (📷, antique wooden bellows view camera). Parts are lens, bellows, body, back, tripod. Quiz answers are lens (child "Can you tap the camera's eye?"), bellows (teen: "Your photo is blurry..."), and tripod. The tripod has a friendly pinch-point safety tip. `causeAndEffect` matches the spec.
- `TEMPLATE_ORDER` = bottle, camera, book, phone, charger, mug, pencil.
- All templates follow docs/AGE_TIERS.md:
  - child `learn` is one playful sentence of 15 words or fewer.
  - `short` lengths: child/plainWords 3-5 words, teen 5-8 (science), adult 12 or fewer (spec).
  - Teen quiz prompts are troubleshooting scenarios, and teen praise is a one-sentence science explanation.
  - Adult quiz is an operational/safety check.
  - plainWords quiz starts "Let's try it together: tap ...", and plainWords learn is "Step N: ...", numbered in part order.
- Every lesson has `sources`: 3 en.wikipedia.org article URLs each, no fragments. I spot-checked several and they resolve.
- The validator (~/chk/check.ts on the device, run with `node check.ts`) checks all of the above and passes.
- FYI to other owners: tsc still flags `camera` missing in `components/three/models/index.ts` and `lib/gemini.ts` (Record<TemplateId,...>). templates.ts has no errors.

### Backend agent, round 2
- **analyze**: the `camera` template can now be matched ("any standalone camera: DSLR, compact, film, instant, antique bellows; NOT a phone"). Only templates that exist in `TEMPLATES` can be matched. Photo lessons follow AGE_TIERS:
  - child `learn` ≤ 15 words; it is cut at a sentence boundary or with dangling filler words removed.
  - `short`: child and plainWords 3–5 words, teen 5–8, adult ≤ 12.
  - Quiz prompts: child "Can you tap the …?"; teen is a troubleshooting scenario; adult is an operational or safety check; plainWords is "Let's try it together: tap the …".
  - `hint` is the part's `short` text and `praise` is built locally per mode, so Gemini no longer writes them.
  - Photo lessons never get `sources`.
  - The first interest is put into every intro as a comparison.
- **Speed**: Gemini no longer writes quiz hints/praise, the prompt asks for 3 parts by default (4 only when needed), strings are shorter, and `maxOutputTokens` is 3000. Photo-lesson latency went from 10.3s to 5.9 / 6.4 / 6.5s across three lamp runs. One outlier took 11s, likely rate-limit queuing. Template matches: bottle 1.5s, camera 0.9s (7.8s on the first call right after hot reload).
- **ask**: accepts `parts: {id,name}[]` (up to 12, cleaned) and returns `focusPartId`. The schema enum is the given ids plus "none". The route checks the id against `parts` and returns null otherwise (always null when no parts are sent).
- **Reliability**: `generateJson` retries once after 900ms on 429/5xx/UNAVAILABLE when less than half the timeout has passed. In dev only (NODE_ENV !== 'production'), fallback responses carry an `x-curio-error` header with the Gemini error text (keys removed) for debugging.
- **QUOTA**: during testing Gemini started returning **429 "You exceeded your current quota"** on most calls, even after waiting about 40s. Five agents share one key, so this is either the per-minute or the daily free-tier limit. The app still works (fallback lesson or answer), but for the demo use a paid key, or set `GEMINI_MODEL` to a model with a higher free quota.

### Onboarding round 2 (country, limited mode while consent is pending, demo helpers)
- Chat order: name → age (number) → "And which country are you exploring from?" (chips US/GB/KR/IN/PK/DE, "Somewhere else" = searchable
  `useKidJurisdictions()` list, "Not sure" = `'auto'`) → US: "Which state?" searchable list of US-xx (Skip = plain 'US') → k-ID rules load
  → birthday only if the jurisdiction approves date-of-birth but not age → interests → check → (consent) parent email → app.
- `jurisdiction` prop is undefined until answered (so k-ID fetches the rules for the CHOSEN code, not the IP), then the code; 'auto' only via
  "Not sure" (if auto can't resolve, the country list is shown). Last resort: if k-ID errors on plain 'US', the provider is remounted with
  `US-CA` (console.warn `[curio] ... US-CA (last resort)`).
- Consent no longer blocks: once the parent email is sent (status 'pending') the Profile is saved and the app opens in LIMITED mode
  (`kid.ready === false`). A slim sticky banner "Waiting for your grown-up to say yes ✉️ · Resend" is rendered by ProfileProvider above
  the app. On approval the session appears and the app upgrades in place (no remount: KidSettingsProvider is mounted as a SIBLING of the
  app and bridged into `useGrownupSettings()`). fail / prohibited still show Pip screens (Try again / Start over). Reload while pending →
  straight back into the limited app (challengeId + draft email resume; Resend works).
- `useGrownupSettings()` (from ProfileProvider.tsx) = `useKidPermissionSettings()` value or `null` while no session — never throws. Use it
  instead of `useKidPermissionSettings()` in app code (useGrownupAsk). SettingsPanel mounts its own KidSettingsProvider only when
  `kid.sessionId` exists.
- Demo helpers (only when IS_DEMO): `switchDemoPersona(id|null)`, `demoApproved`, `demoApprove(names)`, all in memory; `effectiveCan(name)` =
  real permission (session or settings) OR demo approval. Not in demo, it is just the real permission.
- Pip bubbles use `var(--pip, #ce82ff)` for the border (falls back until the experience agent adds the token).
