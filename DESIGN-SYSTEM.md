# Design System — Vidhya (Clarity)

> Replaces the v2.4 "Editorial-Confident" dark theme in full. Retired: Fraunces,
> DM Sans, the `#0a0f1a` navy palette, emerald/violet as brand colours, and every
> gradient. Preserved without change: the mastery/tutor colour *semantics* and the
> receipt-border trust law.

## Product Context
- **What this is:** Mobile-first exam-prep platform with Study Commander, AI tutor,
  camera scan and smart notebook. Exam-agnostic via the exam adapter system.
- **Who it's for:** Competitive-exam aspirants (18–28), studying late on a phone.
- **Differentiator:** A study strategist that says what to study next.

## The Memorable Thing
**Compounding.** Every rep adds to the next. The visual system serves that promise by
getting out of its way: content is the interface, chrome recedes, and nothing on screen
competes with the one thing the student came to do.

## Aesthetic Direction
- **Direction:** Apple Human Interface — light-first, deferential, type-led.
- **Decoration:** None. Hierarchy comes from weight, whitespace and hairlines.
- **Mood:** A well-made tool, open at 11pm, that never nags.
- **Explicitly not:** gamified (Duolingo), gradient-led SaaS, or dark-mode-as-brand.

## Typography
One family: the platform system sans (SF Pro on Apple hardware, Inter Tight elsewhere).
- **Stack:** `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter Tight", "Segoe UI", system-ui, sans-serif`
- **Serif** (`ui-serif, "New York", Georgia`): rendered mathematics only.
- **Mono** (`ui-monospace, "SF Mono", "JetBrains Mono"`): IDs, timers, computed values.
- **Scale:** 11 · 12 · 13 · 15 · 16 · **17 body** · 20 · 22 · 28 · 34 · 48 · 64
- **Tracking:** −0.022em display · −0.018em title · −0.01em body
- **Rules:** 17px is the floor for anything a student reads. Promote with weight, not
  size. Tabular numerals wherever a number can change.

## Colour
Two accents, both semantic; everything else is grey — plus one narrow,
named exception below (2026-09-05).
- **Mastery green:** `#34c759` fill · `#248a3d` ink · `rgba(52,199,89,.12)` tint —
  correct, mastered, primary action.
- **Tutor indigo:** `#5856d6` fill · `#4340b5` ink · `rgba(88,86,214,.12)` tint —
  AI, tutor, study plan. **Reserved.** No other surface may use it.
- **States:** red `#ff3b30`/`#d70015`, orange `#ff9f0a`/`#b25000`. System only,
  never decoration.
- **Atom-kind tags (scoped exception):** four more real Apple system colours —
  teal `#30b0c7`, purple `#af52de`, mint `#00c7be`, brown `#a2845e` (each with
  an `-ink` contrast variant and a `.13`-alpha tint, `colors.css`) — used
  **only** for the small eyebrow label + icon on a lesson atom card, clustering
  the 11 `AtomType`s by pedagogical role (discovery/practice/retention/
  reference; see `AtomCardRenderer.tsx`'s `ATOM_PRESENTATION_MAP`). Never a
  card background, a button, or a filled surface — green and indigo keep
  their exact meanings above, untouched. `common_traps` keeps its
  pre-existing orange, unchanged. Ships instead of a genuinely unconstrained
  multi-colour ("Amazon-style") treatment, which real e-commerce/education
  palettes don't use either — 2-3 accents, not a rainbow, was the actual
  finding behind this line.
- **Neutrals:** canvas `#f5f5f7` · card `#ffffff` · sunken `#efeff4` ·
  fill `rgba(120,120,128,.12)` · ink `#1d1d1f` · secondary `rgba(60,60,67,.6)` ·
  tertiary `rgba(60,60,67,.35)` · separator `rgba(60,60,67,.16)`.
- **Dark mode** is defined (`[data-theme="dark"]`: black canvas, `#1c1c1e` cards,
  `#30d158`, `#7d7aff`) but light is the primary theme.

## Receipt Border (verification marker) — unchanged in law, new in material
Content backed by a receipt object sits on a white surface with a 1px
`rgba(52,199,89,.45)` inset border, radius 12, and a small ✓ disc caption reading
"Verified · <source>". **No receipt object, no border.** Enforced by construction in
`frontend/src/components/ui/ReceiptBorder.tsx`. An optional `tone` prop
(`'positive'` default, `'neutral'`) exists for exactly one case: a receipt
nested inside a wrong-answer card, where the usual green ink/mark/border
would read as a correctness signal it isn't meant to send. `'neutral'`
keeps the same "Verified · <source>" claim in `--text-secondary` /
`--text-tertiary` / `--separator` instead of green — it never changes
whether the border renders, only its color when it does.

## Spacing & shape
- 4px base: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64.
- Screen gutter 20px, card padding 20–24px, 12px between stacked cards.
- Touch targets 44px minimum; 34–36px chips only inside a tappable row.
- Radii 8 / 12 / 16 / 20 / 28 / capsule, nested by subtraction.
- Elevation: flat, `--shadow-raise` (a hairline of shadow), or `--shadow-card` for the
  single focal card. Nothing else.

## Layout & density (enforced)
**One focal block per screen.** Everything else is plain text or hairline-separated rows
directly on the canvas. Six rows before a list needs a filter. Sections are separated by
whitespace (20px between, 30px before a label), not by boxes. Reduce contrast before
reducing size.

## Motion
One curve — `cubic-bezier(0.32, 0.72, 0, 1)` — at 100 / 180 / 280 / 420ms.
Press is `scale(0.96)`. Rings and bars animate once on entry, then stay still.
No confetti, no celebration animation, no shimmer, no pulse. Full
`prefers-reduced-motion` support collapses every duration to 1ms.

## Materials
`rgba(255,255,255,.72)` + `saturate(180%) blur(20px)` on nav bars, tab bars and sheets
only. Content never blurs.

## Iconography
Lucide (`lucide-react`), stroke 1.75–2, 17–22px inline. Icons are secondary grey unless
active. Status is a 9px coloured dot, not an icon. No emoji anywhere.

## Brand
The repository contains **no logo**. Set the word "Vidhya" in the system sans at 600 /
−0.03em, or use an ink-filled rounded square holding "V".

## Journey discipline
Each surface has a touchpoint pass documenting the one job of every screen. See
`design/clarity/guidelines/journey*.md`:
student (four stages + density budget) · camera scan & mock exam ·
teacher & owner consoles · knowledge track, content studio & founder portal ·
marketing site, blog & messaging channels.

## Decisions Log (Clarity)
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-08-01 | Full theme replacement: dark navy → Apple light | A study tool read at night by a tired student benefits from deference, not decoration. Content is the interface |
| 2026-08-01 | Fraunces + DM Sans → platform system sans | One family carries display to caption; nothing to download; the serif signalled "editorial" where the product needed "instrument" |
| 2026-08-01 | Emerald/violet → system green/indigo, semantics kept | Same meanings, calibrated for contrast on white (`-ink` variants clear 4.5:1) |
| 2026-08-01 | All gradients removed | Three on the marketing page alone; none carried information |
| 2026-08-01 | Body floor raised 13px → 17px | The old `!important` mobile overrides existed to rescue text that was too small by design |
| 2026-08-01 | One focal block per screen | Home carried five competing blocks; the "One Thing" card could not do its job |
| 2026-08-01 | Confetti and streak surfaces deleted | Celebration now names the specific win, per the repo's own principle 3 |
| 2026-08-01 | Receipt law preserved verbatim | The one signature worth keeping; only its material changed |
| 2026-09-05 | Added a 4-hue atom-kind tag palette (teal/purple/mint/brown), eyebrow-label + icon only | `/ui-ux-pro-max` request for "more colours, Amazon psychology" on lesson content; real e-commerce/education palettes checked and found to use 2-3 accents, never a rainbow — this is the constrained middle ground the user picked, not a reversal of the two-accent law |
