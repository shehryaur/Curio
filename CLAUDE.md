# CLAUDE.md — Curio

Guidance for Claude (and any AI assistant) working in this repo. Read this first.

## What Curio is
Hackathon project (Team Curio: Shehryar + Sruthi). Point a camera at a real object (charger, phone,
water bottle) → Curio shows a 3D twin with 3 hotspot pins → an owl guide explains each part out loud,
adapted to who is watching (child / teen / adult / senior) and how they feel. Hazard pins stay locked
for kids until a guardian approves.

Sponsors used: **k-ID** (age gate, consent, permissions), **Inworld** (TTS voice), **Modulate**
(voice input, emotion, PII redaction). Gemini is the vision/lesson brain. Meshy is an optional stretch.
**FastSpring was removed on purpose — do not add payments, checkout, or `in-game-purchases` back.**

## Stack
- Next.js 15 (App Router) + React 19 + TypeScript (strict). Plain CSS in `src/app/globals.css` (no Tailwind yet).
- `@k-id/core` installed from the local tarball `./k-id-core-web.tgz` (`"file:./k-id-core-web.tgz"`). Do not replace it with an npm registry version.
- Path alias: `@/*` → `src/*`.

## Commands
```
npm install      # run on the developer's Windows machine, in the repo root
npm run dev      # http://localhost:3000
npm run build    # must pass before any commit/deploy (it also type-checks)
```
Note: `node_modules` is platform-specific. Never copy a Linux `node_modules` into the Windows folder.

## Repo map
```
src/app/layout.tsx              Root layout; wraps everything in <KidRoot>
src/app/page.tsx                Main screen; features gated with <KidPermission>
src/app/globals.css             Theme + curio-* utility classes
src/app/api/kid/claim/route.ts  k-ID server-side claim (secret key)
src/app/api/analyze/route.ts    Gemini vision → 3-step tour JSON (propHint = instant canned tour)
src/app/api/ask/route.ts        Gemini Q&A about the current object, style per mode
src/app/api/tts/route.ts        Inworld TTS (inworld-tts-2), rate/steering per mode, LRU cache
src/app/api/voice/route.ts      Modulate velma-2-stt-batch: transcript + emotion + PII redaction for minors
src/app/api/meshy/route.ts      Optional: image→3D, polling + same-origin glb proxy
src/lib/fallbackTours.ts        Canned tours (client-safe) — demo safety net
src/lib/api.ts, speak.ts        Client fetch helpers (never throw) + tour audio player
src/components/KidRoot.tsx      k-ID provider tree + ID persistence
src/components/SettingsPanel.tsx  <KidSettings> screen
src/components/*.tsx            CameraScanner, Curio3DStage (<model-viewer>), GuardianModal (KidSessionVerifyAge), KidTopBar, MicButton
src/lib/kidConfig.ts            k-ID publishable key, baseUrl, declare manifest
src/lib/kidStorage.ts           localStorage for sessionId / challengeId
src/lib/*.ts                    types (contract), personas, propPresets, gemini/inworld/modulate/meshy (server-only)
src/hooks/useCurioSession.ts    App state, mode resolution, tour player, analyze/ask/voice handlers
public/models/                  charger.glb, phone.glb, bottle.glb go here
docs/PLAN.md                    Build order + cut list
docs/DEMO_SCRIPT.md             2-minute demo
docs/SPONSORS.md                Pre-submission checklist
docs/AGENT_NOTES.md             Per-module notes, contracts, behaviors (read before editing a module)
```
All routes degrade gracefully: on missing key / API error / timeout they return HTTP 200 with
`source: 'fallback' | 'unavailable'` so the demo never breaks. Server helpers in src/lib (gemini, inworld,
modulate, meshy) read secrets — import them only from API routes. Live APIs were not reachable from the
build environment; first real test is `npm run dev` on the Windows PC.
Known demo-only shortcut: the persona switcher can override a real minor's mode (hide before production).

## k-ID integration (follow exactly)
Provider tree (in `KidRoot.tsx`, mounted once in `layout.tsx`):
```
<KidCoreProvider publishableKey baseUrl declare>
  <KidSessionProvider jurisdiction="auto" sessionId challengeId onSession onChallenge onClaim>
    <KidAgeGate>
      <KidAgeGatePending/> <KidAgeGateFail/> <KidAgeGateProhibited/> <KidAgeGateError/>
      <KidAgeGatePass>{app}</KidAgeGatePass>
    </KidAgeGate>
  </KidSessionProvider>
</KidCoreProvider>
```
Rules:
- `baseUrl` is `https://kai-api.test.k-id.com/fapi/v1` (test). Calls must go straight to k-ID — never proxy `/fapi` through our server.
- The publishable key (`kgp_test_…`) is safe in client code. The **secret key (`kgs_test_…`) is server-only**, read from `KID_SECRET_KEY`. Never import it into a client component or log it.
- Persist `sessionId` from `onSession` and `challengeId` from `onChallenge` (via `kidStorage`), pass both back on next mount. Clear `challengeId` once a session is established.
- `onClaim(claimToken)` → POST immediately to `/api/kid/claim` → server calls `POST {KID_API_HOST}/api/v1/client/claim` with `Authorization: Bearer <secret>`. Token is single-use, 10-minute lifetime. Server should unlock nothing until the claim succeeds.
- Saved IDs are read in a `useEffect`, so the gate mounts only after hydration (avoids SSR mismatch). Keep it that way.
- Gate UI features with `<KidPermission name="…" fallback={…}>` (or `useKidPermission().can()`). This is display only — also enforce on the server for anything sensitive.
- Settings: `<KidSettingsProvider sessionId>` + `<KidSettings/>` (see `SettingsPanel.tsx`); settings `challengeId` is persisted separately.
- Remounting `<KidSessionProvider>` is the only reset (e.g. after an error).
- SDK docs: `node_modules/@k-id/core/README.md`; valid permission names: `node_modules/@k-id/core/PERMISSIONS.md`.

Declared permissions (`src/lib/kidConfig.ts`) — only features Curio really has:
| name | feature |
|---|---|
| `camera-access` | webcam scanner |
| `ai-media-upload` | snapshot sent to Gemini |
| `ai-chat` | ask the owl questions |
| `ai-voice-mode` | talk to the owl (Modulate in, Inworld out) |
| `personalized-recommendations` | lessons adapted to age/mood |

If you add a feature, add its permission here (name must exist in PERMISSIONS.md) and gate it in the UI.
Don't add permissions for features that don't exist (no leaderboards, groups, push, purchases).

`declare` also has `supportEmail: 'shehryar.hassan@uni.minerva.edu'` (required). `privacyPolicyUrl`,
`termsOfServiceUrl`, `iconUrl` are still TODO — ask the user for real values; don't invent them.

Kai portal setup the user must do (not code): add `http://localhost:3000` (and the Vercel URL once
deployed) under "Where it runs", or the test key won't answer.

## Environment variables
Template: `.env.example`. Real values: `.env.local` (git-ignored). Never commit or print keys.
```
KID_SECRET_KEY      k-ID secret key (server only)
KID_API_HOST        https://kai-api.test.k-id.com
GEMINI_API_KEY
INWORLD_API_KEY
MODULATE_API_KEY
MESHY_API_KEY       optional
```
Only use `NEXT_PUBLIC_` for values that are safe in the browser.

## Age modes (product behavior)
- **Child** (k-ID minor): owl mascot, ≤14-word playful steps, hazard pins locked → guardian consent, voice 0.95x.
- **Teen**: physics cause-and-effect chain, stricter data rules in some jurisdictions (e.g. UK).
- **Adult**: all pins unlocked, full specs.
- **Plain Words / Senior**: triggered when Modulate detects frustration → hide extra pins, zoom on one part, big pointer, voice 0.85x.

## Conventions
- Server secrets only in `src/app/api/**` route handlers or `src/lib` modules imported only by them.
- Client components start with `'use client'`. `@k-id/core` components are client-only.
- Wrap `localStorage` access in try/catch (see `kidStorage.ts`).
- Keep `src/lib/types.ts` as the shared contract between frontend (Sruthi) and backend routes (Shehryar); agree on changes before editing.
- The demo must never depend on live vision: keep a manual "pick an object" fallback.
- Small, focused changes; run `npm run build` after edits.

## Priorities if time is short
Never cut: k-ID age gate + persona switch, Inworld voice, the one Modulate frustration moment.
Cut in order: Meshy → Senior mode → third prop.
