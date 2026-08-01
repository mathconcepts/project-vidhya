# Journey map — marketing site, blog, and messaging channels

The three surfaces where someone meets Vidhya before, or outside, the app.
Grounded in `frontend/src/pages/app/MarketingLanding.tsx`, the Blog section of
`DESIGN-SYSTEM.md`, and `src/channels/telegram-adapter.ts` /
`whatsapp-adapter.ts`.

---

## Marketing site — 40 seconds, on a phone, from a classmate's link

The repo already states the copy law: **one primary CTA on the page**, and the
below-the-fold repeat points at the same action. The theme adds the density law:
one focal block, everything else plain.

| # | Touchpoint | One job | Notes |
|---|---|---|---|
| P1 | Headline | Make an honest promise | "The most marks achievable in your hours — honestly stated." No gradient text, no badge above it |
| P2 | Try one | Let them feel it before the copy | The focal block: a real GATE question, answerable in place. The first problem beats the first page of copy |
| P3 | Promise strip | Four short truths | "3 tasks a day, not 30 · 0 streak guilt · questions on demand · 1 plan you follow" — as a list, not four bordered tiles |
| P4 | Honest comparison | Say what is different without a table war | Two plain columns, no gradient card on the winning side |
| P5 | Under the hood | Serve builders without taxing students | Collapsed by default, exactly as the repo has it |
| P6 | One CTA | Same action, twice on the page | "Take the 10-question diagnostic — no signup" |

**Rules.** No hero gradient, no gradient text, no shadowed gradient buttons — the
current page's three gradients all go. Architecture language ("3072-dim
embeddings") stays inside the collapsed section; students never meet it.

---

## Blog — arrives from Google, leaves into the app

Design intent from `DESIGN-SYSTEM.md`: a single-column feed, each post enclosed,
and a bridge back to the app that "feels like turning the page rather than
switching products". In Clarity that continuity is automatic — the blog is the
same greys, the same type, the same two accents.

| # | Touchpoint | One job | Notes |
|---|---|---|---|
| B1 | Feed | Scan ten posts in ten seconds | Single column, hairline-separated rows. Title 22px, one line of standfirst, reading time |
| B2 | Filters | Narrow without a control panel | One row of pills: topic, then sort. Nothing else |
| B3 | Post | Be readable at arm's length | 19px body, 68-character measure, 1.6 line height |
| B4 | Verified passage | Carry the receipt into public content | Same marker as the app — a Wolfram-checked derivation is bordered; opinion is not |
| B5 | Bridge | One offer, matched to the post | Practice this topic (green) or open the tutor (indigo) — chosen by content type, not both stacked |
| B6 | Sticky bar | Present, not pushy | Appears after the first screen, on material, dismissible |

**Rules.** Sentence case throughout; the old uppercase badges are gone. No
author avatars, no share-count chrome, no related-post grid — the bridge is the
only thing competing with the text.

---

## Telegram & WhatsApp — no pixels, only shape

A message channel has no colour, no type scale and no layout. What the design
system contributes is **message shape, sequence and restraint**.

| # | Touchpoint | One job | Notes |
|---|---|---|---|
| M1 | `/start` | Explain the link in two lines | What linking does, then the link. Never a wall of setup text |
| M2 | Linking | Confirm in one line | "Linked as Priya. Send a photo or ask anything." |
| M3 | Photo | Read it back before answering | Same law as camera scan: state what was read, then solve |
| M4 | Answer | Answer first, source second | The receipt becomes a final line: "Verified with Wolfram." Never a decorative emoji |
| M5 | `/help` | Three commands, no more | `/start`, `/me`, `/help`. Capabilities are described in one sentence, not a menu |
| M6 | Not-yet | Say the limit plainly | "Image analysis here arrives next release — the web app can do it now." Honest, with the way through |
| M7 | Nudges | The channel never initiates | No streak pings, no daily reminders. A teacher's push shows up when the student next opens a chat |

**Rules.** Plain text, no Markdown tables, no emoji. Messages under four lines;
anything longer becomes a link into the app. Long answers split at 4096
characters at a sentence boundary, never mid-formula.
