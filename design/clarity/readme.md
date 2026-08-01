# Vidhya Clarity — Apple-inspired design system for Project Vidhya

An alternative visual theme for **Project Vidhya** ([mathconcepts/project-vidhya](https://github.com/mathconcepts/project-vidhya)),
the cost-minimal adaptive learning engine for competitive-exam preparation.
Where the repo's current `DESIGN-SYSTEM.md` describes an *Editorial-Confident*
dark navy theme (Fraunces + DM Sans, emerald + violet), this system re-expresses
the same product in an **Apple Human Interface** idiom: light-first, system type,
grey canvas, white cards, hairline separators, translucent chrome, and exactly
two semantic accents.

Nothing about the product's meaning changed — mastery is still green, the tutor
is still the reserved signature colour, and verified content still wears the
receipt marker. Only the material changed.

## Sources this was built from
- GitHub: `mathconcepts/project-vidhya` @ `main` — read, not guessed:
  `DESIGN-SYSTEM.md`, `context/COMPANY.md`, `context/VOICE.md`,
  `frontend/src/styles/globals.css`, `frontend/index.html`,
  `frontend/src/components/app/AppLayout.tsx`, `.../ExamReadiness.tsx`,
  `.../MasteryRing.tsx`, `frontend/src/components/ui/ReceiptBorder.tsx`,
  `frontend/src/pages/app/Home.tsx`, `.../NotebookPage.tsx`.
- No Figma file and no brand assets were provided.

## Product context
Mobile-first PWA for competitive-exam aspirants (GATE, JEE, BITSAT, NEET, civil
services), typically 18–28, studying late at night on a phone. The differentiator
is the **Study Commander**: a priority engine that says what to study next, based
on marks weight, weakness, improvement speed, recency and exam proximity. Around
it sit an AI tutor, a smart notebook that auto-logs every query, camera scan, and
an exam readiness score. Roles: Admin, CEO portal, Teachers, Students.

The north star the repo states is **Compounding** — every rep adds to the next;
what you cracked in January is still with you in March.

## The Apple translation, in one paragraph
Apple's system is deference: chrome recedes, content is the interface, and
hierarchy comes from type weight and whitespace rather than boxes and colour.
That suits a study app that a tired student opens at 11pm better than a decorated
one. So: a grey canvas with white cards instead of layered dark surfaces; the
system font instead of a display serif; hairlines instead of borders; one focal
card per screen; and colour used so sparingly that when green or indigo appears,
it *means* something.

---

## VISUAL FOUNDATIONS

**Palette.** Two accents, both semantic. **Green** (`#34c759`, ink `#248a3d`) =
mastery, correct, primary action. **Indigo** (`#5856d6`, ink `#4340b5`) = AI,
tutor, study plan — reserved; no other surface may use it. Red (`#ff3b30`) and
orange (`#ff9f0a`) are system states only (wrong answer, timer low, partial
mastery), never decoration. Neutrals are Apple's grouped-background greys:
canvas `#f5f5f7`, card `#ffffff`, sunken `#efeff4`, fill `rgba(120,120,128,.12)`.
Dark mode inverts to true black canvas with `#1c1c1e` cards and the vivid
dark-mode accents (`#30d158`, `#7d7aff`).

**Type.** One family — the platform system sans (SF Pro on Apple hardware,
Inter Tight elsewhere). Scale is Apple's: 11 caption2 / 12 caption / 13 footnote /
15 subheadline / 16 callout / 17 body / 20 title3 / 22 title2 / 28 title1 /
34 large title / 48 display. Tracking goes negative as size grows
(−0.01em body, −0.022em display). Promote with weight (600/700), not with size.
Tabular numerals wherever a number can change. A mono face (SF Mono / JetBrains
Mono, already in the product) carries IDs, timers and computed values; the system
serif (New York) appears only inside rendered mathematics.

**Spacing.** 4px base. Screen gutter 20px, card padding 20–24px, 12px between
stacked cards. Touch targets 44px minimum — a 34px chip is legal only inside a
row that is itself tappable.

**Shape.** Radii 8 / 12 / 16 / 20 / 28 / capsule, nested by subtraction (a child
inside a 20px card padded 16px gets 8px). Cards are white with a near-invisible
shadow; the *structure* comes from hairline separators inset by row padding.

**Backgrounds.** Flat greys. No gradients, no photography, no dot grids, no
illustration. The previous theme's gradient logo badge and hero gradients are
deliberately dropped.

**Transparency and blur.** Only nav bars, tab bars and sheets use material
(`rgba(255,255,255,.72)` + `saturate(180%) blur(20px)`). Content never blurs.

**Elevation.** Three levels only: flat, `--shadow-raise` (a hairline of shadow),
and `--shadow-card` for the one focal card per screen. Sheets get a deep, soft
top shadow. Glows exist nowhere except the tutor FAB.

**Layout and density.** One focal block per screen — a single white card, and
everything else plain text or hairline-separated rows directly on the canvas.
Six rows before a list needs a filter. Sections are separated by whitespace
(20px between, 30px before a label), not by boxes. Body text is 17px minimum for
anything a student reads; 15px supporting, 13px only for timestamps. Reduce
contrast before reducing size. See `guidelines/journey.md` for the full
touchpoint map and the density budget.

**Motion.** One curve — `cubic-bezier(0.32, 0.72, 0, 1)` — with 100 / 180 / 280 /
420ms durations. Press feedback is `scale(0.96)`, never a colour flash. Hover on
touch surfaces does nothing; on pointer devices it is a small fill darkening.
Rings and bars animate their value once on entry, then stay still. Celebration is
allowed exactly once — completing a day's plan — and it is a short, quiet
transition, not confetti. Full `prefers-reduced-motion` support collapses all
durations to 1ms.

**The one signature.** The **receipt marker**: content backed by a real
verification record sits on a white surface with a 1px green hairline and a small
✓ caption. Estimates never wear it. This is inherited unchanged from the product's
trust-aesthetic law — if there is no receipt object, there is no border.

---

## CONTENT FUNDAMENTALS

The product's own copy is the model, and it is good: short, second person, no
hype. `context/VOICE.md` in the repo is still a template with placeholders, so
the rules below are drawn from the shipped UI strings.

- **Second person, present tense.** "Your next move", "Start practising",
  "Done for today", "Your notebook is empty".
- **Sentence case everywhere** — headings, buttons, badges. No ALL CAPS
  (the old theme's uppercase topic headline is dropped). Never a shouty label.
- **Say the reason, not the metric.** "Biggest area to grow · 34 days to go"
  beats "priority score 0.82". The repo explicitly removed verification metadata
  ("Gemini solved in 2.3s") because students don't learn from it.
- **No nag, no guilt.** Missing a day produces no red. "Skip — not tonight" is a
  first-class action.
- **Numbers are specific and small.** "2 of 4 today", "34 days", "68% mastered".
- **No emoji.** None in the shipped UI; none here.
- **Empty states offer a next step** — "no dead ends" is a stated app rule; every
  terminal state links to the tutor.
- **Buttons are verbs**: Start practising · Ask the tutor · Review progress ·
  Save to notes.

---

## ICONOGRAPHY

The product uses **lucide-react** (`^0.330.0`) and nothing else — no icon font,
no sprite sheet, no custom SVG set. This system keeps Lucide and loads it from
CDN (`unpkg.com/lucide@0.460.0`), which is the faithful match rather than a
substitution. Usage rules:

- Stroke width 1.75–2, size 17–22px inline, 20–21px in the tab bar.
- Icons are secondary-label grey unless the row is active; the active tab is
  indigo.
- Icons never carry meaning alone — every icon-only control has a label.
- Status is a **coloured dot** (8px), not an icon: green mastered, orange in
  progress, grey to review.
- Emoji and unicode dingbats are not used as icons.
- Mathematics renders through KaTeX (already a product dependency), never as an
  icon or an image.

## Assets

There is **no logo in the source repository** — `frontend/public/favicon.svg` is a
placeholder gradient circle with the letter "E" and is not a brand mark, so none
was copied and none was invented. Wherever a mark would go, set the word
**Vidhya** in the system sans at weight 600, −0.03em tracking, or use a 32px
ink-filled rounded square holding a "V" (see `guidelines/brand-wordmark.card.html`).
Ship a real logo and this becomes a one-file change.

---

## Index

| Path | What |
|---|---|
| `styles.css` | Global entry point — imports only |
| `tokens/` | `fonts` · `colors` · `typography` · `spacing` · `shape` · `motion` · `base` |
| `components/core/` | Button, IconButton, Card, ListRow, Badge, FilterPill, SegmentedControl, TextField, EmptyState |
| `components/app/` | MasteryRing, ReceiptBadge, ProgressBar, StatTile, TabBar, TutorFab, ChatBubble, TaskCard |
| `guidelines/journey.md` | Student touchpoint map, four stages + density budget |
| `guidelines/journey-scan-exam.md` | Touchpoint pass: camera scan and mock exam |
| `guidelines/journey-teacher-admin.md` | Touchpoint pass: teacher and owner consoles |
| `guidelines/journey-knowledge-studio-ceo.md` | Touchpoint pass: knowledge track, content studio, founder portal |
| `guidelines/journey-public-channels.md` | Touchpoint pass: marketing site, blog, messaging channels |
| `guidelines/` | 16 foundation specimen cards (Colors, Type, Spacing, Shape, Motion, Brand) |
| `ui_kits/student-app/` | Student shell across six journey touchpoints |
| `ui_kits/scan-and-exam/` | Camera scan capture and the timed mock exam runner |
| `ui_kits/teaching-console/` | Teacher dashboard, teaching brief drawer, check-ins |
| `ui_kits/admin-console/` | Owner dashboard: setup, health, cohort insight |
| `ui_kits/knowledge-track/` | Deadline-free student shell: curriculum position, concept map, bridge |
| `ui_kits/content-studio/` | Admin draft review with the source provenance chain |
| `ui_kits/founder-portal/` | Operator dashboard: activity, cost, module health, caveats |
| `ui_kits/public-site/` | Landing page with a live sample problem, blog feed and post |
| `ui_kits/channels/` | Telegram and WhatsApp conversation shape |
| `github.md` | Source-repo link and sync receipt |
| `SKILL.md` | Agent-Skills front matter for use in Claude Code |

### Intentional additions
- **StatTile** and **TaskCard** are new named components. Both exist in the
  product as inline markup (`kpi-card` in `globals.css`; the "One Thing" card in
  `Home.tsx`) — naming them stops each screen re-inventing the layout.
- **SegmentedControl**, **FilterPill**, **EmptyState** and **ChatBubble** are
  lifted from `@layer utilities` classes that already exist in `globals.css`.

### Not built (and why)
- Light/dark is defined in tokens; only light mode is rendered in the kits.
- Every surface in the repo now has a touchpoint pass and a kit. What is left is
  depth: the lesson player, diagnostic runner, and exam setup — all long flows
  that deserve their own passes.
