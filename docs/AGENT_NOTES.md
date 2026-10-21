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
