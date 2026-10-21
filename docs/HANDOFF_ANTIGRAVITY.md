# Backend ready for the new home screen (from Claude)

All verified live on localhost:3000. Frontend files were not touched.

## 1. Pip "Ask anything" (fixed)
`POST /api/ask` — same contract as before (`AskRequest` → `AskResponse`, with `parts` → `focusPartId`).
Now runs on NVIDIA NIM open models via `src/lib/llm.ts`: **nvidia/nemotron-3.5-lightning-30b-a3b** (~0.5-0.9s),
then z-ai/glm-5.3-flash, then Gemini. The old error came from a retired/slow NVIDIA model plus an invalid
Gemini key fallback.

## 2. Home chat: "What do you want to learn about?"
`POST /api/learn { topic, mode, name?, interests? }` → `LearnResponse` (see src/lib/types.ts):
- `story`: age-adapted story Pip tells (NVIDIA **nemotron-3-ultra-550b**, ~3-8s). Speak it with /api/tts.
- `lesson`: ObjectLesson for Learn / Quiz / Explore (same viewer as photos).
- `matchedTemplate`: e.g. "what is a camera?" → `'camera'` → use the starter model, no Meshy.
- `needsModel: true` → build a 3D model:
  1. `POST /api/meshy/text { topic }` → `{ taskId, stage: 'preview' }`
  2. poll every 5s `GET /api/meshy/text?taskId=<id>&stage=<stage>&topic=<topic>` — ALWAYS use the
     `taskId` + `stage` from the latest response (the preview auto-hands off to a refine task with a new id).
     `progress` 0-30 = shape, 30-100 = textures.
  3. on `SUCCEEDED` pass `glbUrl = proxyUrl` (`/api/meshy/text?proxy=<id>`) to ObjectViewer.
  Live test: "telescope" → textured 2.7 MB GLB in about 60-75s. Show the story + lesson (photo pins are not
  available for text topics, so show the lesson emoji / a loading card) while it builds.
- Save the result to My Cards like a scan (topic, lesson, glbUrl once ready).

## 3. Outline icons (no emoji)
`import Icon from '@/components/icons/Icon'` → `<Icon name="camera" size={20} />` (stroke = currentColor).
Names: home cards camera mic send settings learn quiz explore sparkle back next play pause repeat close
check xp streak shield user safety speaker image search chat cube plus upload layers.

## Notes
- `GEMINI_API_KEY` is currently rejected by Google ("API key not valid"). `isolateObject.ts` and the photo
  analyze path still use Gemini, so photo isolation silently falls back to the full photo until the key is fixed.
- `/api/llm/models` is a dev-only helper (GET lists NVIDIA models, POST benchmarks). 404 in production.
