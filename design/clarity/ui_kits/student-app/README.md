# UI kit — Vidhya student app

A click-through recreation of the student shell in the Clarity theme.
Open `index.html`; it is self-contained (tokens via `../../styles.css`, icons via
the Lucide CDN) and needs no build step.

Screens follow `guidelines/journey.md`: one focal block each, lists on the bare
canvas, 17px body. Use the rail on the left to walk the journey in order.

## Screens
| Screen | Source it recreates | Notes |
|---|---|---|
| **Discovery** | `StudentWelcomeCard.tsx` + `Home.tsx` state A | Three try-it-now rows, no sign-in wall, countdown hidden. |
| **Today** | `frontend/src/pages/app/Home.tsx` (state C, "One Thing" mode) | One focal task card and a two-row "later today". Rating advances the queue; the fourth completes the day. |
| **Notes** | `frontend/src/pages/app/NotebookPage.tsx` | Search, topic filter pills, entries with status dots, expand to reveal the answer — verified answers wear the receipt. |
| **Progress** | `frontend/src/components/app/ExamReadiness.tsx` + `MasteryRing.tsx` | Readiness ring, factor breakdown bars, stat tiles, weakest-first topic list. |
| **Tutor** | `frontend/src/pages/app/ChatPage.tsx` | Thread, one verified answer, exactly one suggested next step. |
| **Day complete** | `Home.tsx` all-done state | Names the specific win. No streak, no confetti, two quiet exits. |

## Shell rules carried over from `AppLayout.tsx`
- Three tabs only (Today / Notes / Progress); the tutor is a FAB, not a tab.
- The FAB hides on the tutor screen.
- Tab bar sits on translucent material; content scrolls under it.
- Header is compact: mark, exam countdown, avatar. No product name text.
