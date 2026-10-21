# Curio design system (Notion × Duolingo remix)

Source: rohitg00/awesome-claude-design — design-md/remix/notion-x-duolingo.md. Tokens live in
`src/app/globals.css` (`:root`) with shared `c-*` classes. Component-specific styles go in CSS modules.

- **Surfaces (Notion):** warm white `#fff` / `#fbfaf8` / `#f1efea`, charcoal text `#37352f`, 1px borders, cards radius 12, flat (no shadows on cards).
- **Interactions (Duolingo):** leaf green `#58cc02` CTAs, radius 16, weight 700, tactile bottom shadow `0 4px 0 0 #3d8a00`; pressed → translateY(2px), no shadow.
- **Signal colors only:** green = go/progress, orange `#ff9600` = streak, red `#ff4b4b` = wrong, blue `#1cb0f6` = XP.
- **Type:** Inter only. Body 16/1.6. Buttons/labels 600-700. Numerals 800 tabular.
- **Layout:** 720px reading column; 480px practice card stack; 16px mobile gutter; 8px scale.
- **Don't:** tactile shadow on cards, serif, glass/blur, multi-color decoration, thin CTA weights.
- **Pet exception:** the spec rejects mascot illustrations, but Curio's product needs a guide. Pip is an
  original, simple, flat SVG character (not an owl, nothing borrowed from any brand) — keep it minimal.
