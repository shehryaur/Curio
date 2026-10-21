# Age tiers — how Curio changes (spec of record)

Tier comes from the age typed in onboarding (profile.ts `modeFromAge`), and k-ID decides permissions.
Voice frustration (Modulate) switches anyone to Senior/plainWords temporarily. No locks anywhere:
risky parts show a red ⚠️ safety tip. Judge-only helpers (persona switch, "approve as parent") exist
only when NEXT_PUBLIC_DEMO_MODE=true.

| | Child 7-12 (`child`) | Teen 13-17 (`teen`) | Adult 18-64 (`adult`) | Senior 65+ / frustrated (`plainWords`) |
|---|---|---|---|---|
| Onboarding | name, age, country, interests; parent email if k-ID asks for consent; app opens with starter objects while consent is pending | name, age, country, interests | same | same |
| Custom photo | photo held locally; parent approves via k-ID email; then Gemini + Meshy | allowed if k-ID allows; UK/EU: profiling off, progress stays local | allowed | allowed |
| Guide | Pip flies part to part (`guide:'pet'`) | sci-fi HUD reticle (`'reticle'`) | clean numbered CAD pins (`'none'`, `showAllLabels` in Explore) | giant yellow "👆 TOUCH HERE" (`'finger'`), `singlePart` |
| Learn | spoken tour, 1 playful sentence per part, karaoke subtitles | cause-and-effect chain stepper, X-ray toggle | technical walkthrough + "Learn more" sources + export lesson | one part at a time, 2x zoom, 0.85x voice, giant Repeat / Next |
| Quiz | tap the part, confetti + "Yay!" + XP | troubleshooting scenario, tap the component, science explanation | operational / safety check | "Let's try it together" calm practice |
| Explore | drag + hover: name + 3-5 words; voice questions only (no free text), PII redacted | name + 5-8 word science; "What-if" Q&A rotates the model to the part | all labels with specs; grown-up dashboard (k-ID session, pending approvals) | large high-contrast card, 3-5 plain words |
