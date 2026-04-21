# User Journey — Vidhya

*How students and admins experience the product today, where the rough edges are, and what v2.9.2 ships to smooth them out.*

**Writing mode:** this document is written from the user's point of view.
It's not a feature list, not a spec. It's "what does a real person
experience, minute-by-minute, and where do they hit friction?"

**Companion doc:** `docs/TEACHER-JOURNEY.md` covers teachers as a
distinct end-user persona (they're users too, not just admins), and
explains how students' teachers can be either the AI or an assigned
human — both coexisting simultaneously for human-taught students.

---

**The primary goal this document is optimizing for:**

> **Increase the student's competency with minimal effort from their side,
> while creating moments of delight that make them come back.**

Everything — every feature, every pain point fix — is judged against
that goal. If a feature makes students *work harder* to get *less*
competent, it's a bug, regardless of how elegant its architecture is.

---

## Part 1 — The student journey

We follow "Maya," a third-year engineering student prepping for GATE.
Her story spans four stages: discovery, first use, habitual use,
mastery.

### Stage 1: Discovery (0-60 seconds after landing)

**What happens today:**

Maya hears about Vidhya from a classmate, opens the URL on her phone.
She lands on `/` — which routes to `GateHome`. If she's never visited
before, `GateHome` shows either:
- "Set up your study plan" (if she has no profile)
- "Take the diagnostic" (if she has a profile but no diagnostic)
- The One Thing card (if she's fully onboarded)

**Pain points:**

| # | Pain | Severity |
|---|------|:-:|
| 1.1 | **No "what is this" moment.** Maya doesn't know Vidhya has 8-component lessons, snap-a-problem, Wolfram verification. She sees a plan-setup form and has to guess at what to fill in. | HIGH |
| 1.2 | **Confused first choice.** "Set up your study plan" feels like homework. She's here to *reduce* effort, not start with a form. | HIGH |
| 1.3 | **No proof of value upfront.** She can't try a snap or ask a question before committing to setup. | MEDIUM |
| 1.4 | **The best features are hidden behind specific URLs** (`/snap`, `/lesson/:id`, `/chat`, `/materials`). She won't discover them unless she knows to look. | HIGH |

**What v2.9.2 ships:**

- **Welcome card on first arrival** — three tappable "try it now" panels (Ask a question · Snap a problem · Upload your notes) that *demonstrate* rather than *describe* what Vidhya does. No signup wall. Pain points 1.1, 1.3, 1.4 addressed.
- **Setup flow deferred** — "Set up your study plan" moved to an explicit "I'd like a structured plan" option, not the default. Pain 1.2 addressed.

### Stage 2: First use (1-10 minutes)

Maya taps "Ask a question" and types a real question she's stuck on.

**What happens today:**

She gets a response. The response is decent — conversational, correct
where verifiable. But:

**Pain points:**

| # | Pain | Severity |
|---|------|:-:|
| 2.1 | **No indication this was better than ChatGPT.** She doesn't see the Wolfram verification, doesn't get told about the lesson on this concept, doesn't notice that her notes (if uploaded) would have been used. | HIGH |
| 2.2 | **No "next step" surface.** She gets an answer, the conversation ends. There's no "want to practice this?" or "shall I explain the underlying concept?" | MEDIUM |
| 2.3 | **Lesson framework invisible at ask-time.** Vidhya has a beautiful 8-component lesson engine (hook → definition → intuition → worked example → mini-exercise → traps → formal → connections) but it doesn't surface from a chat question. | HIGH |
| 2.4 | **No celebration on "got it right."** If she solves a micro-exercise correctly, there's no moment of "yes, you've got this." | MEDIUM |

**What v2.9.2 ships:**

- **Next-step chips after every chat response** — one subtle, dismissible chip saying "📚 Want the full lesson on [concept]?" or "✏️ Practice a similar problem?" Permission-based, never pushed. Pain 2.2 + 2.3 addressed.
- **"Verified" badge visible in chat responses** when Wolfram-checked — builds trust that differentiates from ChatGPT. Pain 2.1 addressed.
- **Micro-moments of celebration** — when a micro-exercise is answered correctly, a brief confetti + "you got it!" pill. Not a streak counter. Not a notification. Just a moment. Pain 2.4 addressed (pattern already exists via `Confetti.tsx`; extend it).

### Stage 3: Habitual use (Week 1-4)

Maya is hooked. She's back daily. Using `/chat` for questions, `/snap`
for problems from her notebook, `/lesson` for structured studying.

**Pain points:**

| # | Pain | Severity |
|---|------|:-:|
| 3.1 | **No "wins this week" surface.** She's learning a lot but has no way to see her progress compounding. Motivation starts flagging around week 2. | HIGH |
| 3.2 | **No cross-device sync unless signed in — and no clear moment to sign in.** She's using Vidhya on her phone in class, her laptop at home. They don't share progress. But nothing nudges her to sign in. | MEDIUM |
| 3.3 | **Concepts she's been away from silently decay in her memory.** The SM-2 spaced repetition exists in the code but she isn't visibly reminded of review-due concepts. | MEDIUM |
| 3.4 | **No awareness of material upload.** Her class notes are on her laptop. She has no idea uploading them would make the whole app her-notes-aware. | HIGH |

**What v2.9.2 ships:**

- **"Wins this week" card on `GateHome`** — three bite-sized stats with small celebratory phrasing: "You worked on X concepts this week · Y problems done · Z concepts moved into mastery." Dismissible, reappears weekly. Pain 3.1 addressed.
- **Materials nudge** — after Maya's 5th question, a subtle one-time card: "Have class notes? Drag them in and they'll shape every answer." Pain 3.4 addressed.
- **Review-due count visible** on home — "3 concepts due for review today" with tap-to-review. Pain 3.3 addressed. (Backed by existing SM-2 scheduler.)

### Stage 4: Mastery arc (Week 4+)

Maya has a GATE mock test in two weeks. She uploads a photo of her last
practice test score sheet. The diagnostic streams verdicts, shows weak
spots, generates a 14-day plan.

**Pain points:**

| # | Pain | Severity |
|---|------|:-:|
| 4.1 | **The plan generated by `/snap` diagnostic is not revisited.** It's a one-shot view. She can't come back and see which concepts from her plan she's completed. | HIGH |
| 4.2 | **No exam countdown / readiness meter.** She knows her exam is 14 days away but the app doesn't reflect that. No "you're 62% ready for GATE as of today." | MEDIUM |
| 4.3 | **No celebration when she clears a milestone.** She finishes 10/12 planned concepts — silence from the app. Huge missed moment. | HIGH |

**What v2.9.2 ships:**

- **Persistent study plan** — the diagnostic-generated syllabus, if accepted, is stored in her local state. `GateHome` shows progress against it ("8 of 12 concepts complete · 4 days left in your plan"). Pain 4.1 addressed.
- **Celebration at milestone** — when she completes 50%, 75%, 100% of her plan, a *one-time* celebratory overlay. Big enough to notice, small enough to not feel manipulative. Pain 4.3 addressed.
- **Readiness meter** — on home, a gentle "you're X% ready for GATE" derived from mastery-weighted-by-exam-concept-weight. Pain 4.2 addressed.

---

## Part 2 — The admin journey

We follow "Raj," a coaching institute director who installs Vidhya for
50 students.

### Stage 1: Installation (Day -1 to Day 0)

**What happens today:**

Raj reads INSTALL.md. Follows Path 4 (multi-user install with roles). Sets up Google OAuth client ID, JWT_SECRET, public URL. Deploys. Signs in. He's the owner.

**Pain points:**

| # | Pain | Severity |
|---|------|:-:|
| A.1 | **INSTALL.md is clear but long.** The 5-path structure is correct for documentation, but Raj wanted a "I have a VPS, here are 6 commands" quick start. | LOW |
| A.2 | **First admin sign-in drops him on `/chat`.** No "welcome, you're the owner — here's what to configure next" experience. | HIGH |
| A.3 | **No setup checklist.** Raj has to figure out: configure LLM, set up curriculum YAML, enable channels, invite students. Sequentially, with no UI guidance. | HIGH |

**What v2.9.2 ships:**

- **Owner welcome experience** — on the *first* admin/owner sign-in, `/admin` shows a "Welcome, you're the owner. Here's what to do first" checklist. Pain A.2 + A.3 addressed.
- **Quickstart section added to INSTALL.md** — 6-command "I just want to try it" path at the top. Pain A.1 addressed.

### Stage 2: First-day ownership (Day 0-1)

Raj wants to: configure his LLM, set up GATE MA curriculum, enable Telegram bot, invite 3 teachers, promote them.

**What happens today:**

He has to know the URLs: `/llm-config`, `/admin/users`, `/owner/settings`. There's no single "admin console" page tying these together.

**Pain points:**

| # | Pain | Severity |
|---|------|:-:|
| A.4 | **No admin dashboard homepage.** `/admin` currently exists (it's the old GBrain admin page) but there's no dashboard for the new role/curriculum/LLM/channel features. | HIGH |
| A.5 | **No visibility into deployment health.** Raj doesn't know: is Google OAuth working? Is Telegram connected? Are students actually signing in? | HIGH |
| A.6 | **No "how many students are active today" metric.** Raj is spending real money on infra; he wants to know it's being used. | MEDIUM |

**What v2.9.2 ships:**

- **New admin dashboard at `/owner/dashboard`** — single page showing: role distribution (users by role), channel status (web/telegram/whatsapp enabled?), LLM config status, 7-day active user sparkline, link to each sub-page. Pain A.4, A.5, A.6 all addressed.
- **Cohort insight card** (admin-only, from `/api/admin/cohort-summary`) — top 5 struggling concepts, students needing teacher attention. Already implemented in GBrain Integration Bridge v2.9, now surfaced in the dashboard. Pain A.6 enhanced.

### Stage 3: Ongoing administration (Week 1+)

Raj promotes teachers, assigns students. Teachers visit `/teacher/roster` to see their students' cognitive health (shipped in v2.9).

**Pain points:**

| # | Pain | Severity |
|---|------|:-:|
| A.7 | **No notification when attention-flagged students appear.** A student goes into "frustrated" state, but Raj doesn't know unless he manually visits the dashboard. | LOW |
| A.8 | **No easy way to message a student or teacher.** Raj has to know their email and send externally. | LOW |

**What v2.9.2 DOES NOT ship:**

Items A.7 and A.8 are real but lower priority — they need an in-app messaging system to do right, and bolting on half-measures would create more friction. Deferred to a later version.

---

## Part 3 — The "state of bliss" checkpoints

Per the brief, we identify *moments* where the student should feel the
app is on their side, working with them. These are the wow moments:

### Bliss checkpoint 1 — First snap

Student snaps a photo of a messy, handwritten problem. The app reads
it, identifies the concept, walks them through. The moment: *"this
thing actually understood my chicken-scratch."*

**Enabled by:** existing vision pipeline. No v2.9.2 change needed.
**Amplified by:** when the concept is identified, show a sparkle
animation on the concept name + "I recognized this!" micro-label. Low
effort, high delight.

### Bliss checkpoint 2 — First "correct" celebration

Student answers a micro-exercise correctly. A small, non-obtrusive
confetti + "nice — you've got this" pill.

**Enabled by:** existing `Confetti.tsx`.
**New in v2.9.2:** wire confetti into the Lesson component's
micro-exercise success handler. Keep it brief — 800ms.

### Bliss checkpoint 3 — First "wins this week" card

End of their first full week. Card surfaces: "Here's what you've done."
Three stats, phrased with energy. Dismissible.

**New in v2.9.2.** Biggest single wow-factor addition.

### Bliss checkpoint 4 — Plan milestone reached

Student completes 50% of their diagnostic-generated study plan. A
one-time overlay: "You're halfway through your GATE plan. [student
name], this is real progress."

**New in v2.9.2.**

### Bliss checkpoint 5 — Admin's first cohort insight

Admin visits the dashboard for the first time with real students in the
system. They see: "Here's the 3 concepts your cohort is struggling with
most" — with real data, real students. They go "oh — I can actually
*teach* this, not just deploy it."

**New in v2.9.2.** Addresses admin pain A.4-A.6.

---

## Part 4 — What v2.9.2 ships (summary)

### New components

1. **`StudentWelcomeCard`** — first-arrival demo panel for anonymous users (Student pain 1.1-1.4)
2. **`WinsThisWeekCard`** — weekly progress surface on `GateHome` (Student pain 3.1)
3. **`MaterialsNudgeCard`** — one-time prompt after 5 questions (Student pain 3.4)
4. **`ReviewDueBadge`** — review-due count on home (Student pain 3.3)
5. **`ReadinessMeter`** — "X% ready for exam" card (Student pain 4.2)
6. **`PlanProgressCard`** — persistent diagnostic-plan progress (Student pain 4.1)
7. **`PlanMilestoneOverlay`** — one-time celebration at 50% / 75% / 100% (Student pain 4.3, Bliss 4)
8. **`OwnerWelcomeChecklist`** — first-sign-in guidance for owners (Admin pain A.2-A.3)
9. **`AdminDashboardPage`** (new `/owner/dashboard`) — unified deployment admin view (Admin pain A.4-A.6, Bliss 5)

### New backend endpoint

- `GET /api/admin/dashboard-summary` — one-shot payload for the admin dashboard: user counts, channel statuses, LLM config status, 7-day active-users sparkline, plus re-exports of cohort summary

### Backend changes

- Welcome-flow state tracked in user record (`first_admin_seen_checklist_at`)
- Cohort summary endpoint extended with a 7-day active-users series

### Documentation

- `docs/USER-JOURNEY.md` — this document
- INSTALL.md — 6-command quickstart added at top
- README.md — linked to USER-JOURNEY.md

### What DOES NOT change

- No existing page is removed
- No API is broken
- No role permission is changed
- No content is deleted
- The user experience for anyone who already signed in continues identically; new surfaces appear only when they'd be helpful

---

## Part 5 — Design principles (so future features don't regress)

To keep the journey healthy as new features arrive, we commit to these
principles. Any PR that violates them deserves extra review.

1. **Minimum effort, maximum competency.** The student's next input
   should always be the smallest effortful thing that moves their
   mastery. No "complete this 8-step survey to personalize."
2. **Permission-based, never pushy.** Next-step chips, suggestions,
   and nudges all use "Want me to...?" phrasing. One chip per response,
   always dismissible, dedup by key.
3. **Celebrate specific wins, not generic streaks.** Confetti for
   "you solved a hard problem." NOT for "you opened the app 3 days in
   a row." No streak counter, no XP, no gamification.
4. **Progressive disclosure, always.** First-visit sees the simplest
   possible surface. Advanced features (syllabus, exam strategy,
   curriculum editor) appear when the user has demonstrated readiness
   for them.
5. **The wow moments are small and frequent.** A sparkle on concept
   recognition is better than a big animated tutorial video.
6. **State of bliss is a feeling, not a feature.** Students should
   *feel* the app is on their side because it actually is — not
   because a marketing overlay told them so.

---

## Part 6 — Measurable outcomes (future iterations)

v2.9.2 is a qualitative improvement. For future iterations we want
quantitative feedback. The metrics we care about:

- **Time to first value** — seconds from first page load to first useful
  answer. Target: under 60 seconds.
- **Next-step chip acceptance rate** — when we suggest a follow-up
  action, how often does the student take it? Target: 30-40%. Much
  higher means we're pushing; much lower means the chip isn't
  compelling.
- **Week 2 retention** — of students who return in week 2, how many
  have uploaded materials? How many are signed in? Measures discovery
  of the app's depth.
- **Plan completion rate** — of students who accept a diagnostic plan,
  how many complete 50%+ of it? Target: 40%+.
- **Admin first-week actions** — how many configured LLM, enabled at
  least one channel, promoted a teacher? Target: 80%+ do all three.

These are not tracked today. Adding them would require opt-in analytics,
which deserves its own design exercise (to stay consistent with our
privacy stance). Flagged for v3.

---

*Last updated: v2.9.2. This is a living document — when a journey step
changes, update the relevant pain points and fixes.*
