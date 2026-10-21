# How to go through it

## Step 0 — Before building (15 min, together)
1. Collect keys into `.env.local` (copy `.env.example`): k-ID secret key, Gemini, Inworld, Modulate.
2. k-ID: in the portal, create the Curio product and 3 permissions:
   `voice-chat`, `hazard-inspection`, `scan-history`. Open the KAI page and note which
   adaptive settings it exposes; map them to our 4 modes.
3. Agree on `src/lib/types.ts` (AgeMode, TourStep, KidSession) so both of you build to the same shapes.

## Step 1 — Scaffold + assets (40 min)
- Together: `npx create-next-app@latest . --typescript --tailwind --app` inside this folder
  (keep the existing files), add framer-motion, @google/genai, model-viewer.
- Shehryar: k-ID route working — 4 personas return the right status.
- Sruthi: 3 .glb models into `public/models`, hotspot positions into `propPresets.ts`.

## Step 2 — Core loop, P0 (90 min)
Scan → `/api/analyze` → 3D stage shows pins → Play Tour → `/api/tts` speaks each step.
- Shehryar: analyze + tts routes. Sruthi: 3D stage, top bar, subtitle bar.
- **Fallback:** if the camera/Gemini call is slow, a button picks the prop directly. The demo must never depend on live vision.

## Step 3 — Compliance + adaptation (60 min)
- Locked hazard pin → GuardianModal → k-ID `/session/upgrade` → approve → pin turns green.
- Persona switcher changes the copy, pins, voice speed and (UK teen) what data is collected.

## Step 4 — Voice + mood (60 min)
- MicButton → `/api/voice` (Modulate). Frustrated → Plain Words mode. Minor → PII redacted in the transcript.

## Step 5 — Ship early
- Deploy to Vercel as soon as Step 2 works; redeploy after every step.
- Submit the first working URL the moment the form opens, then keep polishing.

## Cut list (in order, if behind)
Meshy → Senior mode → third prop.
Never cut: k-ID persona switch, Inworld voice, the one Modulate moment.
