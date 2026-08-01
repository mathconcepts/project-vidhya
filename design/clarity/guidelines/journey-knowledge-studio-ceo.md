# Journey map — knowledge track, content studio, founder portal

Three surfaces, three different people, one shared discipline: **one focal block,
lists on the canvas, 17px body.** Grounded in
`frontend/src/pages/app/KnowledgeHomePage.tsx`, `src/content-studio/types.ts`,
`frontend/src/pages/app/FounderDashboardPage.tsx` and `config/ceo-thresholds.json`.

---

## Knowledge track — the student who is not sitting an exam

The exam shell answers "what do I study today, given a date". The knowledge shell
answers "where am I in this subject". Same student, no deadline — so **nothing on
this shell may create urgency**: no countdown, no days-left, no red.

| # | Touchpoint | One job | Notes |
|---|---|---|---|
| K1 | Track home | Show position in the curriculum | "23 of 40 concepts" as the sentence; the bar is the supporting detail, not the headline |
| K2 | Today's concept | One concept and why it comes next | The focal block. Prerequisite reasoning stated in plain words |
| K3 | Concept map | Make the shape of the subject legible | Mastered / open / locked. Locked is grey and silent — never a padlock scolding |
| K4 | Prerequisite alert | Explain a lock before it frustrates | "Opens once you've done limits" on the row itself |
| K5 | Compounding line | Prove the work is holding | One sentence, no chart |
| K6 | K→E bridge | Offer the exam once, at 70% | Shown a single time (`ke_bridge_shown`), phrased as an offer: "Want to test yourself on the full exam?" Dismissing it never re-asks |

**Rules.** Green means mastered; indigo means "next". Locked concepts get no
accent at all. The bridge is the only moment the shell mentions an exam.

---

## Content studio — the admin who has to trust a draft

The studio's whole point is the **provenance chain**: uploads → Wolfram →
url-extract → LLM, in falling order of trust. A reviewer's decision depends on
knowing which one produced the body in front of them.

| # | Touchpoint | One job | Notes |
|---|---|---|---|
| C1 | Queue | Show what is waiting, oldest first | Rows, not cards. Source of each draft shown as a plain word, not an icon |
| C2 | Draft | Read the content as a student would | The body is the focal block, set at reading width in 17px |
| C3 | Provenance | Say where every attempt landed | `used / empty / errored / skipped` per source, with timings, as a list — this is the reviewer's trust signal |
| C4 | Trust level | Rank the draft honestly | Wolfram-verified drafts wear the receipt marker. LLM-only drafts wear nothing and say so |
| C5 | Decide | Two verbs, no ambiguity | Approve promotes it live; Reject requires a reason and keeps the audit line |
| C6 | Supersede | Explain an archive | "Replaced by a newer draft for this concept" stated on the row |

**Rules.** The receipt marker is earned by the *content*, not the workflow —
an approved LLM draft still has no receipt. Rejection reasons are required
because the log is the audit trail. Nothing here uses red except a failed source.

---

## Founder portal — the operator glancing once a day

The repo's own design note is the brief: no charts, no polling, and **caveats
surfaced prominently** — "the operator should see what's NOT in the view".

| # | Touchpoint | One job | Notes |
|---|---|---|---|
| F1 | The number that matters | Weekly active learners, first | One focal block; everything else is a list |
| F2 | Money | State it or state its absence honestly | "No payments recorded yet" is a legitimate answer, not an empty card |
| F3 | Cost | Tokens and spend against today's budget | Mono, tabular, signed |
| F4 | Module health | Healthy / degraded / unavailable | A dot and a plain sentence per module |
| F5 | Caveats | Name the blind spots | Kept at the bottom but never hidden: "What this view does not show" |
| F6 | Autonomy limits | Show what agents may do unsupervised | From `ceo-thresholds.json` — spend ceiling, price-change ceiling, approval gates |
| F7 | Refresh | Explicit, never live | A glance dashboard. Timestamp under the title |

**Rules.** No charts (the repo rejects a 150kb library for this). Numbers are
mono and tabular. Amber marks a caveat; red is reserved for an unavailable
module. The dashboard never says an agent "learned" something — it says what
changed and what it cost.
