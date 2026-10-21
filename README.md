# Curio — point at any object, learn it in 3D, adapted to who's watching

Scan a real object (charger / phone / water bottle) → Curio shows a 3D twin with 3 pins → a guide
explains each part out loud, adapted to the viewer's age (k-ID), voice and mood (Modulate), spoken
by Inworld. Hazard pins stay locked for kids until a guardian approves.

## Sponsors: where each one shows up
| Sponsor   | Job in Curio | Demo moment |
|-----------|--------------|-------------|
| **k-ID** (incl. KAI) | Age gate, per-jurisdiction permissions, parental consent, adapting the experience to the user | Switch Child 8 US → Teen 14 UK: features and UI change live; locked red pin → consent |
| **Inworld** | Voice of the guide (TTS), slower for kids/seniors | Owl speaks each step as the 3D model rotates |
| **Modulate** | Voice input: transcript, PII redaction for minors, frustration detection | "Where do I plug this in?!" (frustrated) → Plain Words mode, zooms to one port |

Gemini (vision + lesson JSON) is the brain. Meshy is optional, and the first thing to cut.

## Repo map
```
src/app/api/kid/claim      k-ID (server-side claim; the age gate runs in the browser via @k-id/core)
src/app/api/analyze        Gemini
src/app/api/tts            Inworld
src/app/api/voice          Modulate
src/app/api/meshy          optional
src/components             UI (Sruthi)
src/lib                    shared types, presets, sponsor clients
public/models              charger.glb, phone.glb, bottle.glb
docs/                      plan, demo script, sponsor checklist
```
Each file has a one-line comment naming its job and owner. Start with `docs/PLAN.md`.

AI assistants: see `CLAUDE.md`.
