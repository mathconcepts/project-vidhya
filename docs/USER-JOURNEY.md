# User Journey — Vidhya

*How students and admins experience the product today, and how the
pain points we identified shaped what shipped.*

**Writing mode:** this document is written from the user's point of
view. It's not a feature list — it's "what does a real person
experience, minute-by-minute, and where does friction show up?"

**Companion doc:** `docs/TEACHER-JOURNEY.md` covers teachers as a
distinct end-user persona and explains how students' teachers can be
either the AI or an assigned human — both coexisting simultaneously
for human-taught students.

---

## The primary goal this document optimizes for

> **Increase the student's competency with minimal effort from their
> side, while creating moments of delight that make them come back.**

Every fix below is judged against that goal. If a feature makes
students *work harder* to get *less* competent, it's a bug regardless
of how elegant its architecture is.

---

## Part 1 — The student journey

We follow "Maya," a third-year engineering student prepping for GATE.
Her journey spans four stages: discovery, first use, habitual use,
mastery arc.

### Stage 1: Discovery (0-60 seconds after landing)

**What happens today:**

Maya hears about Vidhya from a classmate, opens the URL on her phone.
She lands on `/` — which routes to `GateHome`. If she's never visited
before, `GateHome` used to show "Set up your study plan" as the first
CTA — a form-feeling wall before any value.

**Pain points identified:**

| # | Pain | Severity |
|---|------|:-:|
| 1.1 | **No "what is this" moment.** Maya didn't know Vidhya could snap problems, run Wolfram verification, do 8-component lessons. | HIGH |
| 1.2 | **First CTA felt like homework.** "Set up your study plan" nudged her toward effort before value. | HIGH |
| 1.3 | **No proof of value upfront.** She couldn't try a feature before committing to setup. | MEDIUM |
| 1.4 | **Best features hidden behind URLs** she didn't know existed. | HIGH |

**What v2.9.2 shipped:**

- **`StudentWelcomeCard`** — three tappable "try it now" panels (Ask a question · Snap a problem · Upload your notes) on first visit. No signup wall. One-click into `/chat`, `/snap`, `/materials`. Dismissible once, never shown again. Addresses 1.1, 1.3, 1.4.
- **Softer state-A copy** — "Want a structured study plan?" instead of "Set up your study plan." CTA changed from "Get started" to "Build my plan." Addresses 1.2.

### Stage 2: First use (1-10 minutes)

Maya taps "Ask a question" and types something she's stuck on.

**Pain points identified:**

| # | Pain | Severity | Status |
|---|------|:-:|:-:|
| 2.1 | **No visible "this was verified" signal.** Wolfram-checked answers look identical to unchecked ones. | HIGH | Open |
| 2.2 | **No next-step surface.** Answer lands, conversation ends. No "want to practice this?" or "shall I explain the underlying concept?" | MEDIUM | Open |
| 2.3 | **Lesson framework invisible at ask-time.** The 8-component lesson engine doesn't surface from a chat question. | HIGH | Open |

These three pains are real but genuinely harder to fix than the Stage 1 problems — they require thoughtful integration into the chat flow, not just a new surface. They remain open as honest technical debt. No half-measure has been shipped.

### Stage 3: Habitual use (Week 1-4)

Maya is hooked and back daily. She uses `/chat`, `/snap`, `/lesson`.

**Pain points identified:**

| # | Pain | Severity | Status |
|---|------|:-:|:-:|
| 3.1 | **No progress-compounding surface.** She's learning but has no weekly "here's what you did" moment. | HIGH | Open |
| 3.2 | **No cross-device sync nudge at the right moment.** Nothing prompts her to sign in when she'd actually benefit. | MEDIUM | Open |
| 3.3 | **Review-due concepts invisible on home.** SM-2 scheduling exists but doesn't surface. | MEDIUM | Open |
| 3.4 | **No awareness her notes can shape lessons.** Feature exists but isn't discovered. | HIGH | Open |

**Status honest assessment:** These four pains are real. They remain open. v2.9.2 focused on the discovery stage because a broken first visit means no habitual use to optimize.

### Stage 4: Mastery arc (Week 4+)

**Pain points identified:**

| # | Pain | Severity | Status |
|---|------|:-:|:-:|
| 4.1 | **Diagnostic plan is one-shot, not persistent.** Student can't revisit "which of my plan's concepts have I done?" | HIGH | Open |
| 4.2 | **No readiness meter.** She knows the exam is in 14 days; the app doesn't reflect it. | MEDIUM | Open |
| 4.3 | **No celebration at milestones.** Hits 10/12 of her plan — silence. | HIGH | Open |

**Status:** Open. Not shipped in v2.9.2. Intentional — ship what we can
deliver well rather than half-built celebration overlays.

---

## Part 2 — The admin journey

We follow "Raj," a coaching-institute director who installs Vidhya for
50 students.

### Stage A1: Installation (Day -1 to Day 0)

Raj reads INSTALL.md, follows Path 4, deploys, signs in first, becomes
the owner.

**Pain points identified:**

| # | Pain | Severity | Status |
|---|------|:-:|:-:|
| A.1 | **INSTALL.md is long.** A 6-command quickstart would help. | LOW | Open |
| A.2 | **First admin sign-in drops him on `/chat`.** No "welcome, you're the owner, here's what to configure next" moment. | HIGH | ✅ Shipped |
| A.3 | **No setup checklist.** He has to figure out the order himself. | HIGH | ✅ Shipped |

### Stage A2: First-day ownership (Day 0-1)

Raj wants to: configure his LLM, set up curriculum, enable Telegram,
invite teachers.

**Pain points identified:**

| # | Pain | Severity | Status |
|---|------|:-:|:-:|
| A.4 | **No admin dashboard homepage.** No single place tying the sub-pages together. | HIGH | ✅ Shipped |
| A.5 | **No visibility into deployment health.** Is OAuth working? Is Telegram connected? Are users signing in? | HIGH | ✅ Shipped |
| A.6 | **No "how many students are active" metric.** | MEDIUM | ✅ Shipped |

**What v2.9.2 shipped — `AdminDashboardPage` at `/owner/dashboard`:**

One page consolidating what was previously 4 requests:

- **Getting-started checklist** — 5 items (configure LLM, invite students, promote teacher, enable channel, review cohort) with progress. Disappears when all done.
- **Deployment status grid** — AI provider · Web · Telegram · WhatsApp with good/bad indicators.
- **User metrics** — counts by role + active today/week + new this week.
- **7-day active-users sparkline.**
- **Cohort insight panel** (the wow moment) — avg mastery, flagged-for-attention count with deep-link, top 5 struggling concepts, emotional-state counts.
- **Quick links grid** — direct access to user mgmt, teacher roster, LLM config, owner settings.

Backed by `GET /api/admin/dashboard-summary` which consolidates previous multi-request workflow.

Addresses A.2, A.3, A.4, A.5, A.6 in one page.

### Stage A3: Ongoing administration (Week 1+)

**Pain points identified:**

| # | Pain | Severity | Status |
|---|------|:-:|:-:|
| A.7 | **No notification when attention-flagged students appear.** | LOW | Open |

Open, lower priority — doesn't hurt the primary journey.

---

## Part 3 — The "state of bliss" checkpoints

Per the brief, we identify *moments* where the student or admin should
feel the app is on their side. These are the wow moments.

### Bliss checkpoint 1 — First snap

Student snaps a messy, handwritten problem. App reads it, identifies the
concept, walks through the solution. Moment: *"this actually understood
my handwriting."*

**Status:** Existing vision pipeline delivers this. No v2.9.2 addition
needed.

### Bliss checkpoint 2 — Admin's first cohort insight

Admin lands on `/owner/dashboard` for the first time with real students
in the system. They see: "Here are the 3 concepts your cohort struggles
with most" — with real data, real students. *"Oh — I can actually teach
this, not just deploy it."*

**Status:** ✅ Shipped in v2.9.2.

### Bliss checkpoint 3 — Teacher's first teaching brief

(See `docs/TEACHER-JOURNEY.md` for the full teacher bliss set.) Teacher
opens a concept brief, sees the common misconceptions *their* cohort
actually has, the worked examples *at their cohort's level*, talking
points based on the cohort's representation-mode preference. *"This is
prep work someone did for me."*

**Status:** ✅ Shipped in v2.9.3.

---

## Part 4 — What actually shipped vs what's open

This section is deliberately simple. No deferred-work-with-designs, no
"fixes-pending-specification" — either we shipped it or we didn't.

### Shipped (live on main)

- **v2.9.2** — `StudentWelcomeCard` (Student 1.1, 1.2, 1.3, 1.4), `AdminDashboardPage` at `/owner/dashboard` (Admin A.2, A.3, A.4, A.5, A.6)
- **v2.9.3** — Teacher-as-end-user surface (see `docs/TEACHER-JOURNEY.md`)

### Open (real pains, no half-measure shipped)

Student-side: 2.1 verified badge · 2.2 next-step chips · 2.3 lesson from chat · 3.1 wins-this-week · 3.2 cross-device sync nudge · 3.3 review-due badge · 3.4 materials nudge · 4.1 persistent plan · 4.2 readiness meter · 4.3 milestone celebration

Admin-side: A.1 INSTALL quickstart · A.7 attention-flag notification

These are itemized here so they're discoverable for future iterations,
not "specified and ready to drop in." Each one needs its own design
pass — especially the celebration-adjacent ones, where a poorly-tuned
confetti moment feels manipulative and a well-tuned one feels like the
app is on your side.

---

## Part 5 — Design principles (enforced going forward)

To keep the journey healthy as new features arrive, we commit to these
principles. Any PR that violates them deserves extra review.

1. **Minimum effort, maximum competency.** The student's next input
   should always be the smallest effortful thing that moves mastery.
2. **Permission-based, never pushy.** Suggestions use "Want me to...?"
   phrasing. One chip per response, always dismissible.
3. **Celebrate specific wins, not generic streaks.** Confetti for
   "you solved a hard problem." Never for "you opened the app 3 days
   in a row." No streak counter, no XP, no gamification.
4. **Progressive disclosure, always.** First-visit sees the simplest
   possible surface. Advanced features appear when the user has
   demonstrated readiness.
5. **The wow moments are small and frequent.** A sparkle on concept
   recognition is better than a big animated tutorial.
6. **State of bliss is a feeling, not a feature.** Students *feel*
   the app is on their side because it actually is — not because a
   marketing overlay told them so.

Teacher-specific principles (from `docs/TEACHER-JOURNEY.md`):

7. **Teachers get data with actions, never data alone.**
8. **Don't replace teacher-student communication, augment it.**
9. **Transparency between human teacher and student is non-negotiable.**

---

## Part 6 — Honesty principle for this document

This document has no "planned" section and no "coming soon" bullets.
Either a pain is open or it's shipped. No half-documented,
half-implemented features. When something ships, the pain's status
becomes `✅ Shipped` and the fix is described. Until then, the pain is
listed honestly as `Open`.

If a feature is worth specifying in detail, it's worth shipping. If
it's not worth shipping yet, it's not worth specifying in detail — a
one-line entry in "Open" is sufficient.

This is a discipline for the doc; it applies only to this file. Design
docs for *future* work live elsewhere (in PRs, in framework docs, in
RFCs) — not here.

---

*Last updated: v2.9.3. Companion to `docs/TEACHER-JOURNEY.md` and
`docs/ROLES-AND-ACCESS.md`.*
