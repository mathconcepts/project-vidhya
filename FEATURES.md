# Project Vidhya — Features & Moats

*Two audiences, one deck. The first eight slides are for students and the
people who'll use Vidhya every day. Everything from Slide 9 onward is
the technical deep-dive for developers, evaluators, and decision-makers
who need to understand what's under the hood.*

- **Part 1 — For students, teachers, and institutional buyers** (Slides 1–9): what Vidhya *does for you*, in plain language
- **Part 2 — For developers and technical evaluators** (Slides 10–37): every architectural decision, moat, file reference, and cost metric

---

# Part 1 — For the people who'll use it

---

## Slide 1 — Meet Vidhya

# **World-class prep. Without the world-class stress.**

*Every five minutes of practice compounds into real competence — and none of it comes at the cost of your peace of mind.*

**Five promises, written from where you stand.** *You never lose ground* — every mistake you make, every concept you skip, the system holds on to it for you; twelve 5-minute sessions compound into the mastery a 60-minute session builds. *You study without the anxiety tax* — no streaks, no guilt pings, no pressure that was never going to teach you calculus anyway. *Your address stops deciding your education* — same lesson in a small town as in the biggest coaching centre in the country. *You can ask the question you've been afraid to ask* — no teacher's face, no peer's whisper, no side-eye at midnight. *You are studied for, not studied on* — your exam score is the only metric this app cares about; you stop being the product and start being served.

---

A tutor that knows your exam, reads your notes, answers whenever you're
stuck, and respects your privacy.

**What it does, in one breath:** ask a question or snap a photo of a
problem → get a walkthrough that teaches (not just tells), based on
your actual syllabus, with the answer double-checked where possible,
and your notes woven in.

**Where it works:** the web, Telegram, or WhatsApp — same account, same
progress, across all three.

**What it costs:** free to try (uses Gemini's free tier out of the box).
If you bring your own AI provider's key, you pay that provider directly
at their rates. There is no Vidhya subscription.

**What's unusual about it:**

- Your study materials don't leave your device
- The AI provider is your choice (and swappable in 30 seconds)
- Lessons are eight bite-sized pieces designed around how memory actually
  works, not 45-minute video blocks
- There's no streak counter, no "you've lost your streak!" notification,
  no gamification — you study when you want

---

## Slide 2 — The journey, from exam-prep pain to exam-prep bliss

Every student preparing for a serious exam goes through the same arc. First the confusion — too much syllabus, not enough clarity, a constant low-grade worry about whether any of this is working. Then the friction — a question stuck at 2 a.m. with no one to ask, a lecture that doesn't land, a coaching batch moving at a pace that isn't yours. Then, with the right tools, something shifts. The confusion quiets. You know where you stand. You know what to do today. The derivation that used to feel arbitrary suddenly matters.

Below is what that shift sounds like. Each card is the same student, speaking twice — once before Vidhya, once after. Every "After" is a real takeaway grounded in code that ships today. These aren't aspirations; they're descriptions of what changes once the system is part of your prep.

### Knowing where you stand

**Before:** *"I don't know if I'm actually ready for my exam. I can't tell my parents anything concrete. I'm just... hoping."*

**After:** *"I know exactly where I stand. Twelve concepts mastered. Fifteen in progress. Three I need to work on. When someone asks, I have a real answer. I stopped guessing."*

The bliss: the app surfaces per-concept mastery counts every time you open it. No vague progress bars. Real numbers. You walk into any conversation about your prep with an accurate picture.

### Finding a starting point each day

**Before:** *"The syllabus is so big, I don't know where to start today. I open my notes, feel overwhelmed, and end up scrolling."*

**After:** *"Three concepts today. Ranked by what my exam weighs and what I haven't mastered yet. I finished them by evening and I can see exactly what's next."*

The bliss: priority actions computed from the intersection of exam topic weights and your current mastery. An hour of focused work instead of a blank, panic-inducing syllabus.

### Advice that matches your situation

**Before:** *"My exam is in three days and the app keeps telling me to take a break. It feels tone-deaf — two days before the exam is not the time to 'recharge.'"*

**After:** *"It switched to a quick lesson review instead of suggesting rest. The advice finally matches where I am. When I was six months out, it did suggest breaks — that felt right too."*

The bliss: urgency-aware insight substitution. `take_break` recommendations automatically swap for `review_prereq` when the exam is ≤7 days out. The system reads the clock and adjusts every piece of advice it gives.

### Short focused learning that lands

**Before:** *"I watch 45-minute lectures and still don't get the concept. I can't tell where the ten important minutes are."*

**After:** *"It clicked in ten minutes. I skipped the parts I already knew, lingered on the one component that was new, and moved on."*

The bliss: every concept is an 8-component lesson (hook → definition → intuition → worked example → mini exercise → common traps → formal statement → connections). You skip, linger, exit. Two focused minutes beat forty unfocused ones, every time.

### A way out when you're stuck

**Before:** *"It's 2 a.m., I'm stuck on this problem, and I have nowhere to turn. My teacher is asleep. My study group is asleep. I'm alone with my confusion."*

**After:** *"I took a photo and had the full walkthrough in seconds. The trap I was about to fall into was flagged before I hit it. I fell asleep clear-headed for once."*

The bliss: multimodal intake reads handwritten or printed problems. Full step-by-step solution, common traps called out explicitly, same quality on web, Telegram, or WhatsApp. 2 a.m. Tuesday works as well as 2 p.m. Saturday.

### Understanding what's in your plan

**Before:** *"I paid for a plan and I don't really know what I'm getting. The benefits are in a PDF somewhere. I never read it."*

**After:** *"I can see every exam my plan covers, with a live 'you're already X% of the way there' chip per bonus exam. No more mystery. No more buried PDFs."*

The bliss: the Giveaway banner on sign-in lists every bonus exam in your subscription bundle. Each one shows live per-exam coverage from your primary prep. The bundle is celebrated; the value is visible.

### Holding on to what you learn

**Before:** *"I keep forgetting what I studied weeks ago. By exam week, month-one material is a blur and I can't tell if I've forgotten it or never really learned it."*

**After:** *"Month-one material is still with me in exam week. It kept coming back at the right moments across the prep cycle — without me having to track anything."*

The bliss: spaced repetition at intervals backed by memory research, not streak mechanics. Concepts resurface automatically at the mathematically-right moments across weeks and months.

### Trusting the answer you get

**Before:** *"I can't tell when the AI is making things up. It stated the eigenvalues of a 3×3 matrix so confidently — and they were wrong. I didn't find out until the mock test."*

**After:** *"When the system isn't sure it tells me. When it's sure, the math has been checked against Wolfram Alpha. I finally trust what I read."*

The bliss: Wolfram verification on math results where possible, pre-checked past papers, explicit uncertainty markers. The AI doesn't get to invent numbers that look clean but aren't.

### Studying without guilt

**Before:** *"Streaks and notifications are making me resent studying. I miss one day and the app guilt-trips me. I'm beginning to dread opening it."*

**After:** *"No streaks. No badges. No guilt pings. I study when I want to study, and the app doesn't interrupt me otherwise."*

The bliss: zero gamification. We considered streaks and badges and deliberately left them out. Engagement metrics aren't the goal; your exam score is.

### Keeping your data private

**Before:** *"I'm nervous about my weak areas ending up in some corporate database that might leak, or get sold, or get subpoenaed years from now."*

**After:** *"My materials, my progress, my struggles — all on my device. Nothing lives on a server that could leak."*

The bliss: architectural privacy. No server-side database of student progress exists; this isn't a policy statement that could be rewritten. It's how the system is built.

### Geography not deciding your prep quality

**Before:** *"I don't have access to top-tier teaching where I live. The best coaching institutes are in the major metros; I'm not."*

**After:** *"I'm getting the same structured lessons, the same explicit trap-flagging, the same depth, no matter where I log in from. My pin code stopped deciding my prep quality."*

The bliss: lesson content is uniform across locations. Same 8-component structure, same concept graph, same Wolfram verification, for every student.

*To be precise: we don't claim top-tier faculty personally wrote every lesson. We claim the structural rigor meets the bar that well-regarded prep material sets. Readers can audit the framework docs for every design decision.*

### Fixing foundations upstream

**Before:** *"My foundations are shaky and advanced topics feel impossible. I keep getting stuck on Fourier series but the real problem is I never solidly got trigonometric identities."*

**After:** *"It noticed the gap three topics behind the one I was stuck on, routed me there first, and the advanced material started making sense again. The misconception got fixed where it actually lived."*

The bliss: `findWeakestPrereq` + `review_prereq` flow. When a wrong answer shows a prerequisite signature, the system walks the concept graph, finds your weakest upstream concept, and routes you there before the advanced topic.

### Your pace, not the batch's pace

**Before:** *"Coaching lectures move at the average pace. If I'm above it I'm bored; if I'm below I'm lost. The class schedule optimises for the batch, not for me."*

**After:** *"I move at my pace per concept. Quick through linear algebra because it clicked. Slower through measure theory because I needed it. No batch to keep up with."*

The bliss: mastery is tracked per concept, not per class slot. Fast learners don't wait. Slow learners don't feel pushed. Recommendations adapt to your actual state, not to where the average student would be today.

### Asking anything without judgment

**Before:** *"I'm embarrassed to ask basic questions in class. By the third month of coaching, the foundational questions feel impossible to ask — everyone else seems to have moved on."*

**After:** *"I asked a 'basic' question at midnight with no one watching. The system didn't care that I'd already done 200 derivative problems. It answered. I moved on."*

The bliss: no social pressure, no peer judgment, no teacher making a face. You ask, you get an answer, you continue. The only thing that matters is that you understand.

### Understanding why it matters

**Before:** *"My teacher explains the derivation but I don't see why any of it actually matters. I write the equations, pass the exam, and five years later I couldn't explain the point."*

**After:** *"Every lesson opens with the real problem this concept was invented to solve. Motivation before mechanics. The derivation sticks because I finally have a reason to care about it."*

The bliss: the **hook** is the first of eight components in every lesson — a single sentence on what real problem this concept answers. Not "it's in the syllabus." A genuine motivation.

### Rigor and intuition in the same place

**Before:** *"Textbooks are too abstract, videos are too hand-wavy. Neither works alone. I'm stuck picking between rigor and understanding, and one without the other isn't enough."*

**After:** *"I get the visual intuition AND the rigorous formal statement — in the same place, for the same concept. I linger on whichever layer I need today. Neither one is dumbed-down."*

The bliss: every lesson carries both the intuition (visualised, concrete) and the formal statement (rigorous, in your exam's exact terminology). The claim is that neither layer compromises on correctness.

---

## Slide 3 — What you get as a student

**Snap, understand, move on.** Take a photo of any problem — from a
textbook, a past paper, your own handwritten notebook. Vidhya reads the
image, identifies which concept is being tested, and walks you through
the solution. Not "here's the answer" — here's the method, here's the
intuition, here's where students typically go wrong.

**Lessons that actually teach.** Each concept appears as eight small
components:

| Component | What it does for you |
|-----------|---------------------|
| Hook | Why this matters, in one sentence |
| Definition | The precise statement, in your exam's terminology |
| Intuition | A mental picture you can hold onto |
| Worked example | A real problem, solved step by step |
| Mini exercise | A quick check that you got it |
| Common traps | The five ways students usually mess this up |
| Formal statement | For when you want the rigorous version |
| Connections | What this connects to, upstream and downstream |

You can skip, linger, or come back to any component. Your time, your pace.

**Your notes, your lessons.** Upload a PDF of your class notes. The app
turns them into searchable chunks and weaves them into relevant lessons.
When you're studying eigenvalues, your professor's notes about eigenvalues
appear alongside the pre-curated content — your voice, your context, your
examples.

**A study plan that matches reality.** Upload a photo of your last mock
test. Vidhya grades it problem-by-problem, maps your weak spots to the
syllabus, and builds you a focused plan. "The next 14 days, these 12
concepts, in this order." Shown only when you ask for it — no unsolicited
plans.

**Review at the right moment.** Concepts you've seen before come back at
spaced intervals (based on real memory research), so things you learned
three weeks ago don't slip away the week of the exam.

**Know exactly where you stand, on every concept.** Open the app and see
12 concepts mastered, 15 in progress, 3 struggling. Per-concept, real
numbers, always visible. No vague "50% complete" progress bars. When
someone asks "how's prep going?" you have an honest answer.

**The app knows which exam you're taking.** When you set your target
exam, every lesson, every "try this next" suggestion, every priority is
filtered through that exam's syllabus and topic weightings. The topics
your exam weighs heavily get more practice. Topics that aren't on your
exam don't clutter your study time.

**As your exam approaches, the app shifts gear.** Six months out and five
wrong in a row → the app suggests a break. Three days out and five wrong
in a row → the app switches to a focused lesson review instead. Telling
a stressed student to "step away" two days before an exam reads as
tone-deaf; Vidhya reads the urgency and adjusts every piece of advice.

**If your plan bundles multiple exams, it's celebrated.** When your
institute's plan covers GATE CS + JEE Advanced + IES + BARC, you see a
dedicated "🎁 Giveaway · included in your plan" banner on sign-in
listing every bonus exam. Each bonus shows *how much of it you've
already covered through your primary prep* — so the bundle isn't just
a promise, it's a visible head-start.

---

## Slide 4 — A day in the life

**8:30 AM, bus ride to college.** You open Telegram, tap the Vidhya bot,
paste a problem you saw in last night's reading. A walkthrough comes
back. You read it on the way in.

**8:45 AM, signing in on the web app.** A violet banner appears at the
top: *"🎁 Giveaway · included in your plan. One subscription, 4 exams.
You're preparing for GATE CS, and your plan also covers JEE Advanced
(42% covered), IES Electronics (18% covered), BARC CSE (8% covered)."*
You didn't know your institute's subscription covered all four. Now
you do — and you can see exactly how far along you already are in each.

**2:15 PM, library.** You're stuck on a multivariable calculus problem.
You snap a photo with your phone. The app reads your handwriting,
identifies it as a Lagrange multiplier question, and walks you through
setting up the equations. It flags the common trap: "students forget
to check all the stationary points."

**3:00 PM, quick glance at your home screen.** The exam countdown chip
in the corner shows *"47 days to your exam."* A single line, always
visible when you need it, gone from your head when you don't.

**7:00 PM, home.** You finished a mock test this afternoon. You upload
a photo of your answer sheet. Vidhya grades it, shows you the three
concepts you fumbled, and offers a focused 20-minute review plan.
You accept.

**11:45 PM, before bed.** You can't fall asleep. You open the app and
tap on a concept you've been meaning to review. A 90-second intuition
explainer. A single worked example. Done. You close the app and
actually fall asleep.

**3:20 AM, insomniac study session.** You have a specific question
about whether the Cauchy-Riemann equations are necessary or sufficient.
You ask in chat. You get a correct, careful answer that explicitly
calls out what your exam covers and what's out of scope.

No streaks were counted. No notifications were sent. The app didn't
manipulate you.

### Fast-forward five weeks — your exam is six days away

**Same 2:15 PM library session, different response.** Five wrong
answers in a row on partial differentials. Six months ago the app
would have said *"Step away for 10 minutes."* Today, with your exam
six days away, it says *"Switch to a lesson review — with your exam
close, keep momentum."* It gives you a four-minute concept refresher
instead of suggesting you stop studying two days before your exam.
The urgency of your situation changed. The advice changed with it.

**Your home screen** now shows the countdown chip in amber instead of
sky blue. The color shifted as the exam got closer. The app is aware
of your timeline without nagging.

**You open the "Priority actions" panel.** Three concepts, ranked by
exam weight and your current mastery. Not 47 things to do — three.
You work through them. Fifteen minutes well spent.

---

## Slide 5 — How this isn't just another AI chatbot

**It teaches. It doesn't just answer.** Type "find the eigenvalues of
[[2,1],[1,2]]" into ChatGPT and you get a number. Ask the same in
Vidhya and you get a lesson: what eigenvalues *are*, why this 2×2
matrix has shortcuts, the sum-and-product check, the common sign error.
If all you wanted was the number, you can skip to it in one tap. But
the teaching is there if you want it.

**It sticks to your syllabus.** LLMs will happily explain infinite-
dimensional operator theory when you asked about simple matrix
eigenvalues. Vidhya knows your exam's scope, and filters out material
that won't be tested. Your study time doesn't leak into topics you
don't need.

**Answers are verified, not invented.** For computational problems,
Vidhya runs the answer through Wolfram Alpha — a computer algebra
system that doesn't hallucinate. You see an emerald "verified" badge
when this has happened. For past-paper problems, the answers were
already pre-checked before you ever saw them.

**Your materials shape the lessons.** Most AI tutors treat your notes
as context to be politely ignored. Vidhya gives user-uploaded materials
the highest priority in composing lessons — because what YOU wrote is
the most resonant.

**It doesn't game you.** No streaks, no XP, no "you've been away for 3
days!" emails. It's a tool. You pick it up when you need it. The app
has no incentive to increase your session time.

---

## Slide 6 — Your privacy, in plain language

**Your study materials never leave your device.** When you upload a PDF
of your notes, it's parsed entirely in your browser. The text is
embedded (turned into numbers for similarity search) entirely in your
browser, using a 22 MB model that runs client-side. The chunks and
embeddings are stored in your browser's IndexedDB storage. Nothing
is uploaded to our servers.

**Your progress lives locally by default.** Which problems you've tried,
which lessons you've finished, where your weak spots are — all in your
browser's storage. If you sign in (optional), this can sync across your
own devices via a small user record on your deployment's server. Even
then, the detailed progress data is still yours.

**Your AI key stays in your browser.** When you configure your own AI
provider (Gemini, Claude, OpenAI, Ollama, and more), the key is stored
in your browser's localStorage. It's attached to outbound API calls
only — the server reads it once per request and forgets it. Nothing
about your key is persisted on our side.

**We don't track you.** No analytics, no heatmaps, no behavioral
profiling, no ad pixels. The only telemetry is anonymized aggregate
counts of which content tier handled which request (to tune
performance) — no personal information attached.

**You can delete everything.** Clear your browser's site data for the
Vidhya domain, and your local state is gone. Sign out from your account
(if you signed in) and your user record can be deleted by your admin.

---

## Slide 7 — What it costs you (spoiler: not much)

**To use Vidhya as a student:**

- **Free tier (default):** $0. Vidhya ships with a bundled content
  library — 82 concepts, verified problems, pedagogical explainers.
  This handles 80% of what students actually ask without ever touching
  an LLM.
- **Your own AI (optional):** You plug in your own key (Google Gemini,
  Claude, OpenAI, etc.) and you pay your AI provider directly. Google
  Gemini's free tier is very generous — most students never exceed it.
- **Local models (optional):** Run everything offline via Ollama on
  your laptop. No keys, no cost, just the price of electricity.

**To run Vidhya for a class or institution:**

- **Infrastructure:** $5/month VPS (DigitalOcean, Hetzner, Linode) is
  plenty for up to ~50 concurrent students. Render's free tier also
  works for small deployments.
- **Licensing:** $0. Vidhya is MIT-licensed.
- **LLM costs:** $0 if you rely on the bundled content only. A few
  cents per student per month if you enable LLM generation for
  novel questions. Zero if each student brings their own key.

**Comparison to other adaptive-learning products:**

| Product category | Typical cost per student per month |
|------------------|-----------------------------------|
| Coaching institute (in person) | ₹1,000–₹5,000 ($12–$60) |
| Premium adaptive-learning app | $15–$30 |
| AI tutor apps (LLM-per-response) | $5–$20 |
| **Vidhya** | **$0 (free AI tier) to $0.30 (your own key)** |

---

## Slide 8 — Who can do what

Vidhya has four roles. Most students will never notice this — they use
the app and it just works. The roles matter for classrooms and
institutional deployments.

| Role | Who they are | What they can do |
|------|-------------|-----------------|
| **Anonymous** | Casual visitor | Use the app fully. No account. State lives in their browser. |
| **Student** | Signed-in user | Plus: cross-device sync, chat-app access (Telegram/WhatsApp) |
| **Teacher** | Promoted by admin | Plus: see their roster of students, view their progress |
| **Admin** | Promoted by owner | Plus: manage users, assign teachers, edit curriculum, view quality dashboards |
| **Owner** | First person to sign in | Plus: transfer ownership, configure deployment-wide settings |

**The first person who signs in to a fresh deployment automatically
becomes the owner.** No admin panel to configure beforehand, no database
to provision. The deployment is "ownerless" until someone uses it, at
which point they claim it.

If the wrong person claimed ownership first, anyone with shell access
to the server can reset it via `npx tsx scripts/admin/assign-owner.ts
--email you@example.com`. Filesystem control IS the ultimate ownership
proof.

---

## Slide 9 — Getting started

**As a student:**

1. Open the app
2. (Optional) Sign in with Google for cross-device sync and chat-app access
3. (Optional) Upload your class notes as PDFs
4. Ask a question, or tap the camera to snap a problem

That's it. Three of those four steps are optional.

**As a teacher:**

1. Sign in to the deployment your institution set up
2. Ask your admin to promote you (they visit `/admin/users` and change
   your role from student to teacher)
3. Visit `/admin/users` to see your student roster
4. As admin assigns students to you, they appear under your roster

**As an admin or institutional owner:**

1. Install on your infrastructure — follow `INSTALL.md` Path 4 (5-step
   install with Google OAuth setup)
2. You sign in first; you become the owner automatically
3. Visit `/owner/settings` to configure Telegram/WhatsApp channels if
   desired
4. Visit `/admin/users` as users sign in; promote them to admin or
   teacher as appropriate
5. (Optional) Define your exam's curriculum as a YAML file in
   `data/curriculum/` — see the shipped `gate-ma.yml` as a template

---

# Part 2 — For developers and technical evaluators

*The rest of this deck covers every architectural decision, each moat
in the codebase, and the metrics behind them. For a shorter technical
summary, see the bottom of PITCH.md.*

---

## Slide 10 — What Vidhya Is

> **Adaptive learning at near-zero marginal cost.**

Vidhya delivers personalized practice that costs ~$0.01 per daily active
user per month — where naive LLM-per-request architectures cost $2.

It does this without sacrificing quality: every answer can be
computationally verified by Wolfram Alpha, every concept has a
pre-computed pedagogical explainer, and every student's progress is
modeled with a 15-attribute Bayesian cognitive framework.

**Built for GATE Engineering Mathematics. Architecture is domain-agnostic.**

---

## Slide 11 — The Problem

Edtech AI products burn money on LLM calls they don't need.

| Typical adaptive learning app | Per active daily user / month |
|-------------------------------|-------------------------------|
| LLM-per-practice-problem      | $1.20                         |
| LLM chat tutor                | $0.60                         |
| LLM error analysis            | $0.20                         |
| **Total**                     | **~$2.00**                    |

At 10,000 DAU, that's $240K/year in LLM fees alone. Venture-funded
companies absorb this. Bootstrapped or nonprofit products can't.

**Meanwhile, 80% of those requests ask for content that could have been
pre-computed once and cached forever.**

---

## Slide 12 — The Solution in One Diagram

```
     Every content request flows through FOUR TIERS.
     Each tier is an escalation. We only pay when lower ones miss.

     ┌───────────────────────────────────────────────┐
     │  TIER 0  — Static bundle (CDN)                │  <10ms   $0
     │           80%+ hit rate after warm-up         │
     └──────────────────────┬────────────────────────┘
                            │ miss
     ┌──────────────────────▼────────────────────────┐
     │  TIER 1  — Semantic RAG (client WASM)         │  ~50ms   $0
     │           over bundle + your uploaded notes   │
     └──────────────────────┬────────────────────────┘
                            │ miss
     ┌──────────────────────▼────────────────────────┐
     │  TIER 2  — Gemini 2.5 Flash-Lite              │  ~2s     $0.0005
     │           on-demand generation + cache        │
     └──────────────────────┬────────────────────────┘
                            │ low confidence
     ┌──────────────────────▼────────────────────────┐
     │  TIER 3  — Wolfram Alpha computational check  │  ~1s     $0.002
     │           (free tier covers build-time)       │
     └───────────────────────────────────────────────┘
```

**Result: 86% cost reduction, modeled and deployed.**

---

## Slide 13 — The Cost Moat (Core Defensibility)

Four compounding cost-reduction mechanisms in the shipped code:

| Mechanism | Where it lives | Savings vs naive |
|-----------|---------------|------------------|
| Four-tier cascade | `src/content/resolver.ts` | 75-85% |
| Client-side embeddings (WASM) | `frontend/src/lib/gbrain/embedder.ts` | 100% on RAG |
| Per-device problem cache | `frontend/src/lib/gbrain/db.ts` | Compounds tier 0 |
| Model routing (Flash-Lite for gen) | `src/api/gemini-proxy.ts` | 3× vs Flash |
| Context caching (planned) | — | Up to 90% |
| Batch API for CI generation | `scripts/build-explainers.ts` | 50% |

**Cost at 100 DAU × 20 problems/day × 3 tutor turns/day:**

| Scenario | Monthly cost |
|----------|--------------|
| Naive (no caching, no tiering) | $200 |
| Vidhya (all tiers active) | **$28** |
| Vidhya (bundle-only, no keys) | **$0** |

All three scenarios are achievable today — last one is the default.

---

## Slide 14 — The Privacy Moat (Local-First)

The runtime is **DB-less**. Student state lives on-device.

```
                 BROWSER                          EDGE SERVER
     ┌──────────────────────────────┐       ┌───────────────────┐
     │  IndexedDB (GBrain)          │       │  Stateless proxy  │
     │  • student model (15 attrs)  │       │  • no database    │
     │  • error history             │       │  • no sessions    │
     │  • uploaded materials        │       │  • no PII         │
     │  • generated problem cache   │       │                   │
     │                              │       │  Just forwards    │
     │  transformers.js WASM        │       │  to Gemini/Claude │
     │  • 384-dim embeddings        │       │  + writes local   │
     │  • 22 MB one-time download   │       │  flat-file        │
     │                              │       │  aggregates       │
     │  PDF.js + mammoth            │       │                   │
     │  • parse your docs in-browser│       │                   │
     └──────────────────────────────┘       └───────────────────┘
```

**What this unlocks:**
- Zero Postgres ops burden
- Student data never leaves the device unless user opts in
- Offline-capable after first load
- GDPR/privacy-friendly by architecture, not by policy
- Scales horizontally: every edge region runs identical stateless code

**Where it's shipped:**
`src/api/aggregate.ts`, `src/api/gemini-proxy.ts`,
`frontend/src/lib/gbrain/db.ts`, `frontend/src/lib/gbrain/embedder.ts`,
`frontend/src/lib/gbrain/materials.ts`

---

## Slide 15 — The Quality Moat (Computationally Verified)

Every mathematical answer in the bundle can be independently verified
against Wolfram Alpha.

**Pipeline:**

```
 34 problems in bundle
        │
        ▼
 scripts/verify-wolfram-batch.ts
        │
        ├──→ Wolfram Alpha Full Results API
        │         │
        │         ▼
        │    answer comparison (Unicode-aware,
        │    LaTeX-tolerant, multi-number-set
        │    matcher with subscript stripping)
        │
        ▼
 6/34 problems marked wolfram_verified = true
 15/34 correctly skipped (MCQ narrative answers)
 13/34 need per-problem curation (not computable)
```

**UX consequence:** `/smart-practice` shows an **emerald "Wolfram-Verified"
badge** on verified problems. Tier-0 picker sorts verified first.

**Where it's shipped:** `src/services/wolfram-service.ts` (250 LOC), the
batch verifier at `scripts/verify-wolfram-batch.ts`, and the provenance
badges in `frontend/src/pages/gate/SmartPracticePage.tsx`.

The answer matcher handles: Unicode super/subscripts (²³ → ^2 ^3),
function-of-variable notation (`y(x)` → `y`), implicit multiplication,
multi-valued answers like eigenvalue sets (`λ_1 = 3 | λ_2 = 1`),
numerical tolerance (0.1%).

---

## Slide 16 — The Personalization Moat (Cognitive Model)

Not a chatbot. A **cognitive architecture** with six explicit pillars.

| Pillar | What it does | File |
|--------|-------------|------|
| Student Model v2 | 15-attribute Bayesian profile: working memory, processing speed, ZPD floor/ceiling, motivation state, fatigue, misconception stickiness, ... | `src/gbrain/student-model.ts` |
| Error Taxonomy | 7-type Gemini classifier: conceptual, procedural, notation, arithmetic, misreading, strategic, careless | `src/gbrain/error-taxonomy.ts` |
| Concept Graph | 82-node DAG with 112 prerequisite edges, `gate_frequency` and `marks_weight` per concept | `src/constants/concept-graph.ts` |
| Adaptive Problem Generator | Zone-of-proximal-development targeting, target-error-type routing, self-verify + cache | `src/gbrain/problem-generator.ts` |
| Exam Strategy Optimizer | Per-student playbooks, skip thresholds, time allocation | `src/gbrain/exam-strategy.ts` |
| Task Reasoner | 5-node decision tree selecting next action (practice / review / rest / new-topic / diagnostic) | `src/gbrain/task-reasoner.ts` |

**Every attempt updates all 15 attributes via Bayesian inference.** Then
the task reasoner picks what to serve next. This loop runs in the
browser — no server round-trip.

---

## Slide 17 — The Materials Moat (Your Notes, Your Model)

Students can upload PDFs and DOCXs. Vidhya parses them **entirely in the
browser**, embeds chunks with transformers.js, stores them in IndexedDB,
and grounds the tutor chat on them.

**Why this is a moat, not a feature:**

1. **Cost**: zero API calls for parsing or embedding — commodity LLMs
   charge per page. Vidhya charges zero.
2. **Privacy**: materials never leave the device. Competitors must
   upload to their servers.
3. **Personalization**: the tutor cites your notes, your notation, your
   teacher's examples — not generic textbook content.
4. **Stickiness**: once a student uploads a semester of notes, switching
   costs increase dramatically. Their materials are *their data*, not
   ours, but the UX value is locked in.

Where it's shipped: `frontend/src/pages/gate/MaterialsPage.tsx` + the
four-stage pipeline in `frontend/src/lib/gbrain/materials.ts` (parse →
chunk → embed → index).

---

## Slide 18 — The Content Moat (Curated + Attributed + Compounding)

The bundle grows every night via CI. Each source is license-compliant.

**Sources shipped at v2.2.3:**

| Source | License | Count | Attribution enforced? |
|--------|---------|-------|----------------------|
| GATE official past papers | Public domain | 12 | `source_url`, `year` |
| OpenStax textbooks | CC-BY 4.0 | 5 | Full citation line |
| MIT OpenCourseWare | CC-BY-NC-SA 4.0 | 5 | Instructor credit |
| Math Stack Exchange | CC-BY-SA 4.0 | (stub) | Author display name |
| Vidhya-generated (Gemini) | Internal | 12 | `model`, `generated_at` |
| **Total after dedup** | | **34** | Per-record in bundle |

**The compounding defensibility:**

1. `scripts/scrape-corpus.ts` and `scrape-textbooks.ts` — polite scrapers
   with robots.txt respect, 1.5s rate limit per domain
2. `scripts/build-bundle.ts` — SHA-256 fingerprint dedup, so re-runs
   never duplicate
3. `.github/workflows/content-engine.yml` (manual upload pending) —
   nightly scrape + generate + verify + commit
4. Every record carries `source_url` + `license` + `attribution` — we
   can never get sued for republishing what someone else's content
5. Bundle shipped at `frontend/public/data/content-bundle.json` (82 KB)
   served from CDN with aggressive cache headers

**The bundle is the asset.** After 30 days of CI runs, it will have
~500 problems. After 90 days, ~2000. Growing free.

---

## Slide 19 — The Observability Moat

**What gets measured gets kept cheap.**

Two admin dashboards track the cost machine in real time:

**`/admin/content`** — Content Engine observability
- Lifetime free-hit-rate % (tier 0 + tier 1 as % of total resolves)
- Avg cost per event + lifetime total spend
- Source distribution bars (lifetime + last 14 days)
- Daily stacked-bar trend with tier color coding
- Topic coverage visualization across the 82-concept graph

**`/admin/gbrain`** — Cognitive model health
- Cohort distribution across student-model attributes
- Error-type frequency trends
- Misconception aggregation (opt-in, anonymous)

**How it's collected:**
Server-side auto-telemetry on every `/api/content/resolve`. Client-side
tier-0 hits also ping `/api/content/telemetry` (fire-and-forget, with
`keepalive: true`). Data lives in `.data/content-telemetry.json` —
flat-file, no Postgres.

**The moat:** competitors have this data in Postgres. Theirs costs
money per query. Vidhya's costs nothing and survives DB outages.

Shipped: `src/content/telemetry.ts`, `src/api/content-routes.ts`,
`frontend/src/pages/gate/ContentAdminPage.tsx`.

---

## Slide 20 — The Operational Moat (Graceful Degradation)

**Vidhya runs with zero external services.**

This is rare in the LLM-powered edtech space. Every feature has a
graceful fallback:

| External service absent | What happens |
|-------------------------|--------------|
| No `GEMINI_API_KEY` | Tier 2 disabled; app serves bundle + placeholder explainers |
| No `WOLFRAM_APP_ID` | Tier 3 disabled; no emerald badges; Gemini still works |
| No `ANTHROPIC_API_KEY` | Single-provider mode on the LLM router |
| No `DATABASE_URL` | JWT-only auth; no persistent sessions (this is the default) |
| No Postgres host | DB-less mode (default) |
| No Render / any host | Docker image runs anywhere |
| No Docker | Source install via `npm ci` |
| Offline | Bundle already cached in browser; IndexedDB still writes |

**Shipped proof:** `scripts/postinstall-check.cjs` inspects the
environment, shows which tier is unlocked with color-coded status, and
gives the exact command to unlock the next.

**Why this is a moat:** most LLM apps are soft-bricked without their API
keys. Vidhya isn't. This matters for schools, NGOs, offline classrooms,
regions with spotty connectivity, and anyone worried about API
dependency.

---

## Slide 21 — The UX Moat (No-Nagging, Permission-First)

Most LLM edtech products act on the student. Vidhya acts **with** them.

After every response, the system considers whether there's a natural next
step the student might want — then either suggests it *once*, subtly, or
stays silent.

**The rules (encoded as guards in `suggestNextStep`, not just prose):**

```
Rule                              | Guard                          |
----------------------------------|--------------------------------|
Max 1 suggestion per response     | return NextStep | null         |
Never offered on failure          | responseWasHandledWell() check |
Never offered on low confidence   | intent_confidence < 0.4 → null |
One-tap to dismiss                | "Not now" button               |
Dismissal persists for session    | sessionStorage by dedupe_key   |
Permission language               | "Want me to...?"               |
Non-blocking in chat              | parallel fetch, background    |
Syllabus gated behind consent     | computed, not shown            |
No attention-grabbing animation   | 0.25s fade-in only             |
```

**Where it changes the UX:**

- **Chat with an image** — the assistant response streams normally. Multimodal analysis runs silently in parallel for GBrain logging. *If* a natural next step exists ("Try 3 practice problems on eigenvalues?"), a small chip appears below the answer. User can accept, dismiss, or ignore. If ignored, it quietly stays in the chat scroll — no modal, no popup.

- **Test diagnostic (new in v2.4)** — student uploads a photo of their completed test. Server streams per-problem verdicts via SSE (correct / off / skipped / needs-review). A personalized syllabus is computed during the stream but **not shown**. After verification completes, a "Show the plan" chip appears. Only if the student taps does the syllabus appear. Otherwise, the student walks away with their grade and no unsolicited lecture.

- **Solution check** — if the answer is correct, suggest a harder problem. If wrong, offer to review the misconception. Never both.

**Why this is a moat:**

Most LLM products over-offer. They suggest three follow-ups after every turn, popup modals asking for feedback, dress up outputs with forced "next steps" that feel like ads. The cognitive burden is real — the student stops trusting the suggestions because they're always there.

Vidhya's chips are scarce. When one appears, it's because the system has actually thought about what might help *this student right now*. Students learn to trust them, and the acceptance rate (measured in admin dashboard) stays high.

**Where it's shipped:**
- `src/multimodal/next-step-suggester.ts` — the pure rule engine
- `frontend/src/components/gate/NextStepChip.tsx` — the subtle chip with sessionStorage dedupe
- `src/multimodal/diagnostic-analyzer.ts` — syllabus computed but not revealed
- `src/api/multimodal-routes.ts` — chip attached to `/analyze` response

---

## Slide 22 — The Pedagogical Moat (Research-Grounded Atomic Content)

Every Vidhya lesson is built from an **8-component pedagogical template**
where every slot maps to a research-backed learning-science principle.

```
1. Hook            ←  elaborative interrogation (Chi et al.)
2. Definition      ←  schema activation
3. Intuition       ←  dual coding (Paivio)
4. Worked Example  ←  worked-examples effect (Sweller)
5. Micro-Exercise  ←  testing effect (Roediger & Karpicke)
6. Common Traps    ←  preemptive error correction
7. Formal Statement←  concrete → abstract progression
8. Connections     ←  schema weaving (prerequisite DAG)
```

**Source aggregation with explicit priority** (highest to lowest):

```
USER-MATERIALS  >  BUNDLE-CANON  >  WOLFRAM  >  CONCEPT-GRAPH
```

If a student uploaded their professor's eigenvalue notes, the hook quotes
those notes — not OpenStax. That's the **resonance** layer: their context,
their notation, their words. Attribution is preserved per-component, so a
single lesson might cite (user notes) + (OpenStax definition) + (OCW
Strang intuition) + (Wolfram example) + (graph connections) — and the UI
shows every source with its license.

**Personalization as opt-in layering, not substitution.**

The base Lesson works for anyone. Zero student state = coherent experience
for first-time visitors. Student state is applied as a *separate pass*
with 6 independent, composable rules:

| Rule | Trigger | Effect |
|------|---------|--------|
| Spot-check | Mastery > 0.85 on concept | 7 components → 2 (exercise + connections) |
| Skip hook | Topic mastery > 0.75 | No motivational preamble needed |
| Collapse formal | Scope = mcq-fast | Save the math depth for a different session |
| Reorder | Visit count ≥ 2 | Micro-exercise leads (retrieval practice) |
| Expand traps | Matching error history | Traps reorder to match student's error types |
| Annotate user material | User material surfaced | UI shows "personalized from your notes" |

All rules are pure functions, idempotent, cacheable. The base lesson is
deterministic — 1,000 students get the same bytes; only the layer changes.

**Spaced retrieval without nagging.**

After each lesson, the SM-2 scheduler (SuperMemo-2 simplified) computes
the next review interval — 1d → 3d → 6d → 15d → ... — based on the
student's micro-exercise performance. The scheduler *surfaces* due
concepts via `GET /api/lesson/review-today`. The student is never forced
or guilted into reviewing. Consistent with Slide 12's UX contract.

**Why this compounds:**

1. **The bundle grows** → explainers get richer → component quality
   improves for all students, no personalization required.
2. **Student uploads materials** → user-material resonance increases →
   lessons feel progressively more personal over time.
3. **Engagement data flows back** → poorly-engaged components surface in
   admin dashboard → curator improvements → better base for everyone.

**Where it's shipped:**
- `src/lessons/types.ts` — 8-component schema
- `src/lessons/source-resolver.ts` — 4-source aggregation
- `src/lessons/composer.ts` — base lesson assembly (pure function)
- `src/lessons/personalizer.ts` — 6-rule layering (pure function)
- `src/lessons/spaced-scheduler.ts` — SM-2 with engagement-inferred quality
- `src/api/lesson-routes.ts` — 5 HTTP endpoints
- `frontend/src/pages/gate/LessonPage.tsx` — card-based adaptive reader
- `docs/LESSON-FRAMEWORK.md` — full pedagogical rationale + bibliography

---

## Slide 23 — The Curriculum Moat (Admin-Owned, Shared-Concept, Compounding Quality)

The Lesson framework (Slide 13) decides *how* to teach. The Curriculum
framework decides *what* to teach, *per exam*, and measures whether the
content is improving across iterations.

**The two-layer data model:**

```
Concept Graph (shared, static)
           ↑
           │ many-to-many
           │ (depth, weight, emphasis per link)
           ↓
Exam Definitions (admin-owned, YAML)
  data/curriculum/*.yml
```

A concept like `eigenvalues` exists **once** in the graph and is linked
from many exams. Each exam's YAML specifies *how* that concept appears:

```yaml
# data/curriculum/gate-ma.yml
- concept_id: eigenvalues
  depth: standard
  weight: 0.03
  emphasis: [characteristic-polynomial, 2x2-and-3x3, sum-and-product]
  restrictions: [infinite-dimensional, operator-theory, spectral-theorem]
```

```yaml
# hypothetical csir-net-math.yml
- concept_id: eigenvalues
  depth: advanced
  weight: 0.12
  emphasis: [spectral-theorem, jordan-canonical-form, operator-theory]
  restrictions: []
```

Same concept. Different treatment per exam. One content bundle, many
curricula filtering which slice to serve. This is scope-as-data, not
scope-as-if-branches in code.

**Three-layer guardrails** keep all interactions within syllabus scope:

| Check | How | On fail |
|-------|-----|---------|
| Concept-scope match | Detected concept ∈ exam's concept_links | Chunk excluded from lesson |
| Depth compatibility | Content depth ≤ exam allowed depth + 1 tier | Chunk excluded |
| Restriction compliance | Content doesn't hit a restriction tag | Chunk excluded |

User materials that fail are filtered **out of lesson rendering** but
**never deleted** — they stay accessible in `/materials`. The guardrail
is a scope filter, not a content gate. For LLM-generated content
(future), the validator is strict and rejects on any failure since LLM
output can be regenerated.

**The compounding quality loop:**

```
student interacts
  → engagement signal
  → quality-aggregator computes per-(concept × component) score
  → components below 0.6 flagged with reason
    ("high skip rate 65%", "low completion 28%", etc.)
  → admin runs scripts/admin/quality-report.ts --flagged
  → targeted content updates → bundle rebuild
  → students see better content (next iteration)
  → admin runs --close: freezes iteration, shows delta
  → trend shows compounding in numbers
```

Each cycle is one measurable iteration. The dashboard shows deltas so
curators see their work compounding.

**Cross-exam gap rollup** boosts shared-concept gaps:

```
priority_combined = Σ(per_exam_priority) × √(exams_affected)
```

Fixing one concept that affects GATE + JEE + CSIR-NET pays three times,
so the admin sees it at the top of the list.

**Credible per-exam admin workflow:**

1. Write `data/curriculum/{exam-id}.yml` from the `gate-ma.yml` template
2. `npx tsx scripts/admin/analyze-gaps.ts --exam new-exam-id` → prioritized gaps
3. Fill high-priority gaps with existing content scripts (scrape, explainers, Wolfram)
4. `npx tsx scripts/build-bundle.ts && scripts/restore-wolfram-flags.ts`
5. `npx tsx scripts/admin/quality-report.ts --flagged` after students engage
6. Iterate

Same commands for any exam. Everything is data-driven.

**Modular, portable, scalable:**

- *Modular* — three independent subsystems (graph, YAMLs, runtime). No
  subsystem changes to add a new exam. Only data.
- *Portable* — every persistent artifact is a file. Pack repo, drop on
  any Linux host, it runs. No DB migration, no admin-panel bootstrap.
- *Scalable* — adding an exam is one YAML + three scripts. Stateless
  server, no per-user storage. Same code path serves 10 or 10,000
  students.

**Where it's shipped:**
- `src/curriculum/types.ts` — complete schema
- `src/curriculum/exam-loader.ts` — YAML→ExamDefinition validation
- `src/curriculum/concept-exam-map.ts` — bidirectional lookups
- `src/curriculum/guardrails.ts` — three-layer safety
- `src/curriculum/gap-analyzer.ts` — gap detection + cross-exam rollup
- `src/curriculum/quality-aggregator.ts` — engagement→quality→iterations
- `src/api/curriculum-routes.ts` — 12 HTTP endpoints
- `data/curriculum/gate-ma.yml` — exemplar exam (27 concept links)
- `scripts/admin/analyze-gaps.ts`, `quality-report.ts` — admin CLIs
- `docs/CURRICULUM-FRAMEWORK.md` — complete design doc

---

## Slide 24 — The LLM-Agnostic Moat (BYO-Key, Provider-as-Data)

Most LLM products either (a) lock you into one provider ("Powered by
OpenAI") or (b) let you pick at deploy-time via a complex YAML config
only the sysadmin touches. Vidhya is **fully LLM-agnostic at runtime**:
the student picks their provider in the browser, and the system adapts.

**The registry-as-data pattern:**

```
src/llm/provider-registry.ts  ←  8 providers declared as data
                                  (Gemini, Anthropic, OpenAI, OpenRouter,
                                   Groq, DeepSeek, Mistral, Ollama)
        ↓
    4 API shapes      ←  google-gemini | anthropic | openai-compatible | ollama
        ↓
  universal callChat()  ←  one function, dispatches on api_shape
```

Adding a new provider is a **data change, not a code change**. Append to
the `PROVIDERS` array with metadata (name, endpoint, auth header shape,
model list, capabilities, key format) — the frontend picker auto-includes
it, the resolver routes to it, `callChat` handles it via the shape
dispatch. Same pattern as the curriculum YAMLs (Slide 14).

**Cascading role resolution with independent overrides:**

```
User picks Gemini as primary           → Chat=Gemini-Flash
                                       → Vision=Gemini-Flash
                                       → JSON=Gemini-Flash-Lite

User picks Groq as primary             → Chat=Llama-3.3-70B
                                       → Vision=(Groq has none; falls through)
                                       → JSON=Llama-3.1-8B

User wants cheap chat + smart reasoning:
  primary = Groq (chat)
  override vision = Gemini (needs separate key)
  override json = Gemini-Flash-Lite
                                       → Three providers, three keys,
                                         all configured in one form
```

Each role resolves independently. The same resolver file
(`src/llm/config-resolver.ts`) contains the full rules — no special
cases scattered through the codebase.

**Privacy-first transport:**

```
browser (localStorage)
  └─ X-Vidhya-Llm-Config header (base64 JSON)
     └─ server handler (reads header, uses once, discards)
        └─ LLM provider (receives key as auth header)
```

Keys **never** persist server-side. The server reads the header, makes
the request, and forgets. This is the same privacy model as the rest of
Vidhya (Slide 5): keys belong to the user, so they live in the user's
browser.

**Corner cases handled in the UI (`/llm-config`):**

| Edge | How it's handled |
|------|------------------|
| Key masking | `••••••••` display + show/hide eye toggle |
| Format validation | Client-side regex per provider (sk-ant-, AIza, gsk_) before network |
| Live validation | `Test & save` makes a minimal round-trip; `reason` + `latency_ms` shown |
| Key rotation | Paste new value over old; re-validate |
| Local models | Ollama picker hides the key field entirely |
| Custom endpoints | Shown only for `endpoint_overridable: true` providers |
| Provider without vision | Role preview shows 'not supported by X — will fall back' |
| Cross-tab sync | `StorageEvent` listener updates all open tabs live |
| Mobile | Stacked grid, 14-20 px tap targets, show-key button for paste UX |
| Shared deployments | Env-var fallback (`GEMINI_API_KEY` etc.) auto-detected |

**Backward compatibility:**

Existing deployments using `GEMINI_API_KEY` in `.env` keep working
unchanged. `loadConfigFromEnv()` auto-detects legacy provider-specific
env vars and synthesizes an equivalent `LLMConfig`. Users who opt-in via
the browser simply override the server default for their session.

**Why this is a moat:**

1. **No lock-in** — switching providers is a 30-second UI change, not a
   migration. Competition between LLM vendors directly benefits users.
2. **Team-friendly** — shared Vidhya deployments can use env-var defaults
   while individual users opt-in to their own keys.
3. **Privacy-friendly** — users who want their data to go through
   specific jurisdictions (Mistral for EU, Ollama for local) can do so
   without admin involvement.
4. **Cost-friendly** — a user with free Gemini quota uses Gemini; a user
   who wants Groq's speed pays Groq directly. No markup.
5. **Future-proof** — new providers arrive monthly; Vidhya's registry
   grows as a data PR, not a refactor.

**Where it's shipped:**
- `src/llm/provider-registry.ts` — 8 providers, 32 model entries
- `src/llm/config-resolver.ts` — cascading resolution, header transport, env fallback
- `src/api/llm-config-routes.ts` — 4 HTTP endpoints + universal `callChat` adapter
- `frontend/src/pages/gate/LLMConfigPage.tsx` — full setup UI
- `frontend/src/lib/llm/config-store.ts` — localStorage + masking + `fetchWithConfig`
- `frontend/src/hooks/useLLMConfig.ts` — React hook with cross-tab sync
- `docs/LLM-CONFIGURATION.md` — user + admin guide, add-a-provider walkthrough

---

## Slide 25 — The Roles & Multi-Channel Moat (Flat-File Identity, Three Access Surfaces)

Most adaptive-learning products are either (a) single-user self-study
tools with no identity layer, or (b) enterprise systems with heavy
database-backed user directories, classroom management, and locked-in
admin panels. Vidhya ships **role-based access** with **multi-channel
identity** while keeping the DB-less architectural philosophy intact.

**The four roles (linear hierarchy):**

```
owner  →  admin  →  teacher  →  student  →  anonymous
  │         │         │          │            │
  │         │         │          │            └── no account, client-side state
  │         │         │          └── default on signup, normal app usage
  │         │         └── manages assigned students, read-only content
  │         └── manages users + teachers, edits curriculum
  └── installs + controls everything, can transfer ownership
```

Role capabilities inherit downward: `requireRole('teacher')` allows
owner/admin/teacher, rejects student/anonymous.

**DB-less identity — the flat-file pattern continues:**

```
.data/users.json
{
  "version": 1,
  "org_id": "default",
  "owner_id": "user_xyz",
  "users": {
    "user_xyz": {
      "google_sub": "110000...",
      "email": "owner@example.com",
      "role": "owner",
      "teacher_of": [],
      "taught_by": null,
      "channels": ["web", "telegram:987654321", "whatsapp:+14155551234"]
    }
  }
}
```

Atomic writes (tmp + rename, POSIX + NTFS safe). Scales comfortably to
~10,000 users. Beyond that, swap `src/auth/user-store.ts` for a Postgres
implementation — the exported API is stable so nothing else changes.

**Bootstrap rule:** first user to sign in becomes the owner
automatically. No admin panel to configure beforehand, no DB schema to
provision. The deployment is ownerless until the first person uses it;
then it's claimed.

If the wrong person claims first:

```bash
npx tsx scripts/admin/assign-owner.ts --email you@example.com
```

Requires shell access — deliberate, since filesystem control IS the
ultimate ownership proof in a DB-less system.

**Identity via Google OAuth only. Deliberately.**

- Covers 95%+ of the student population worldwide
- Email is Google-verified — we don't manage password reset flows
- No password management = no password-breach surface
- `sub` claim is the identity anchor — stable across email changes

Non-goals (intentional): Apple Sign-In, email magic links, local
username/password, SAML/SSO. These are enterprise features; Vidhya
targets the 95% case cleanly.

**Three channels, one identity:**

```
user_abc123  (same Vidhya account)
  ├── web      (Google Sign-In, localStorage JWT)
  ├── telegram:987654321   (linked via /start → one-time URL)
  └── whatsapp:+14155551234  (linked via "start" → one-time URL)
```

Linking flow (identical pattern for Telegram and WhatsApp):

1. User initiates contact on the chat platform
2. Bot creates a pending link token (in-memory, 15-min TTL)
3. Bot replies with `<PUBLIC_URL>/sign-in?link_token=<token>`
4. User opens the URL, signs in with Google
5. Server binds chat_id to user, subsequent messages route as that user

No per-channel accounts, no per-channel passwords. The chat platform's
native auth (Telegram account, WhatsApp phone) proves *persistent*
identity; Google proves *canonical* identity; we link them.

**What users see by role:**

| Role | Sees |
|------|------|
| Anonymous | Full app, state in IndexedDB, no cross-device sync |
| Student | All of the above + cross-device sync + chat-app access if linked |
| Teacher | Plus: their student roster |
| Admin | Plus: `/admin/users` with role management, curriculum editing, quality dashboards |
| Owner | Plus: `/owner/settings` with ownership transfer + channel integration status |

**Anonymous flow preserved:** users who don't sign in continue working
exactly as before (v2.7 behavior). Sign-in is additive — for
cross-device sync and multi-channel access — not mandatory.

**Zero new npm dependencies:**

- Google ID token verification via manual JWK RS256 (Node `crypto` only)
- HS256 JWTs reuse existing `JWT_SECRET` pattern from Supabase middleware
- Telegram webhook handler uses `fetch` against Telegram Bot API
- WhatsApp uses `fetch` against graph.facebook.com

The alternative (google-auth-library, grammY, jsonwebtoken) would add
~3 MB of transitive deps for ~400 LOC of behavior we can write directly.

**Where it's shipped:**

- `src/auth/types.ts` — Role hierarchy, User shape, ChannelLinkToken
- `src/auth/user-store.ts` — flat-file directory with atomic writes,
  role-change hierarchy enforcement, channel linking
- `src/auth/google-verify.ts` — JWK-based Google ID token verifier
- `src/auth/jwt.ts` — HS256 issue/verify with timing-safe compare
- `src/auth/middleware.ts` — requireRole, requireAuth, getCurrentUser
- `src/api/auth-routes.ts` — 5 endpoints (config, google-callback, me,
  sign-out, link-status)
- `src/api/user-admin-routes.ts` — 6 endpoints (list, detail, role,
  teacher, unlink channel, transfer ownership)
- `src/channels/telegram-adapter.ts` — webhook + /start/me/help commands
- `src/channels/whatsapp-adapter.ts` — Meta Cloud API webhook
- `frontend/src/contexts/AuthContext.tsx` — useAuth hook with cross-tab
- `frontend/src/pages/gate/SignInPage.tsx` — Google button + link binding
- `frontend/src/pages/gate/UserAdminPage.tsx` — roster + role management
- `frontend/src/pages/gate/OwnerSettingsPage.tsx` — ownership transfer
- `scripts/admin/assign-owner.ts` — CLI escape hatch
- `docs/ROLES-AND-ACCESS.md` — architecture + capability matrix
- `docs/MULTI-CHANNEL-SETUP.md` — per-channel setup walkthrough

**Why this is a moat:**

1. **Zero-setup identity** — first signup becomes owner; no DB provisioning,
   no admin-panel bootstrap
2. **Channel-agnostic** — same account, web + Telegram + WhatsApp, one
   progress stream
3. **Shell control = ownership** — escape hatch via CLI matches the
   DB-less philosophy; no custodial risk
4. **Anonymous-safe** — doesn't force sign-in, preserves the "works
   without accounts" promise for casual visitors
5. **Deps-light** — no new npm packages for identity/sessions/bot
   framework; adds 0 bytes to the dependency graph

---

## Slide 26 — The GBrain Integration Moat (One Cognitive Truth, Every Consumer)

Vidhya's cognitive core (GBrain) has been shipping since v2.2 with a
15-attribute Bayesian mastery vector, a 7-category error taxonomy, a
concept dependency graph, and a task-reasoner for pre-generation
thinking. But through v2.5-v2.8, the newer frameworks (Lesson,
Curriculum, Multimodal, Roles) were built on top of this **without
consuming it**.

Before v2.9:

- `Lesson.personalize()` accepted a `StudentSnapshot` parameter but
  nothing populated it from GBrain. Students using `/lesson/*` got
  generic lessons even though their cognitive profile was rich.
- `Curriculum quality-aggregator` only saw engagement signals (viewed /
  revealed / skipped), not error-taxonomy classifications.
- `Multimodal diagnostic` streamed per-problem verdicts but never fed
  them back into the student model.
- Teachers had a `/admin/users` roster showing enrollment data but no
  cognitive health.

**v2.9 adds the bridge.** One pure-function module translates GBrain's
rich cognitive data into the shapes each consumer needs, with privacy
filters at the translation layer.

**Architectural rules:**

```
  ┌─────────────────────┐
  │  GBrain (6 pillars) │  ← rich cognitive data
  └──────────┬──────────┘
             │  READ ONLY
             ▼
  ┌─────────────────────┐
  │ integration.ts      │  ← 8 pure translation fns
  │  (bridge module)    │     with privacy filters
  └──────────┬──────────┘
             │
     ┌───────┼────────┬────────┬────────┐
     ▼       ▼        ▼        ▼        ▼
   Lesson  Curriculum Multimodal Teacher  Admin
                                 Roster   Cohort
```

Rules (enforced at code review):

1. The bridge reads from GBrain — it never writes. Writes stay in
   GBrain's own API.
2. Translation functions are pure — no I/O, no side effects.
3. Graceful degradation — if GBrain is unavailable, consumers get
   empty snapshots and behave identically to pre-bridge v2.5/v2.6.
4. Doesn't break any existing API — every integration is opt-in.

**Seven translation functions:**

| Function | Direction | Consumer |
|----------|-----------|----------|
| `modelToLessonSnapshot()` | model → Lesson StudentSnapshot | Lesson personalizer |
| `errorToQualitySignal()` | error → Curriculum signal | Quality aggregator |
| `prioritizeConceptsByMastery()` | model → sorted concepts | Syllabus generator |
| `findNearMasteryConcepts()` | model → quick-win picks | Syllabus generator |
| `deriveConceptHints()` | model × concept → presentation hints | Lesson composer |
| `modelToTeacherRosterEntry()` | model → teacher summary | Teacher roster |
| `summarizeCohort()` | N models → admin view | Admin cohort dashboard |
| `diagnosticToAttempts()` | verdicts → attempt stream | Multimodal feedback (future) |

**What students get:**

- Lessons at `/lesson/*` now auto-adapt to their mastery history when
  signed in — concepts they struggle with get more worked examples,
  common_traps get emphasized; concepts they're near mastering surface
  as confidence-building quick wins.

**What teachers get:**

- A new page `/teacher/roster` shows every student they teach with a
  cognitive-health summary: overall mastery bar, concept counts
  (mastered/in-progress/struggling), attention flags for students who
  hit 5+ consecutive failures or land in frustrated/anxious state.
- Aggregate-only — teachers don't see raw answers or emotional-state
  details.

**What admins get:**

- `/api/admin/cohort-summary` endpoint returns class-wide aggregates:
  total students, avg mastery, top 20 struggling concepts (students
  affected × avg mastery), count of students in each emotional state,
  count needing teacher attention.

**Privacy architecture:**

- Student snapshots passed to Lesson: mastery + errors only. Emotional
  state opt-in via `include_emotional` flag.
- Teacher roster entries: aggregate counts only. No raw error logs, no
  emotional state details.
- Admin cohort summary: class-wide aggregates only. Individual students
  not named.

**Zero new dependencies, zero breaking changes.**

- Bridge module is ~300 LOC of pure functions.
- Existing `/api/gbrain/*` routes work unchanged.
- Anonymous users (no `session_id`) continue getting v2.5-v2.8 behavior.
- Signed-in users get upgraded lessons automatically.

**Why this is a moat:**

1. **One cognitive source of truth** — instead of every feature inventing
   its own student model, all five consumer frameworks read from GBrain
   through one translation layer
2. **Privacy is centralized** — the bridge IS the privacy boundary;
   reasoning about what data leaves GBrain happens in one file
3. **Refactor-friendly** — when GBrain's internal shape changes, only
   the bridge needs updating; consumers keep working
4. **Testability** — pure functions, no I/O, trivially unit-tested
5. **Unlocks teacher & admin UX** — teachers and admins finally get
   cognitive-health visibility that was always in the data but never
   surfaced

**Where it's shipped:**

- `src/gbrain/integration.ts` — the bridge (~300 LOC, 8 translation functions)
- `src/api/lesson-routes.ts` — opt-in enrichment when `session_id` passed
- `src/api/user-admin-routes.ts` — 2 new endpoints (teacher roster, cohort summary)
- `frontend/src/pages/gate/TeacherRosterPage.tsx` — teacher-facing UI at `/teacher/roster`
- `frontend/src/App.tsx` — `/teacher/roster` route
- `docs/GBRAIN-INTEGRATION.md` — complete architectural rationale + consumer rules

---

## Slide 27 — The Compounding Mastery + Smart Notebook Moat (Every Attempt Makes You Better)

Most AI tutors are transactional. Ask → answer → end. Open the app
tomorrow, nothing carried over except chat history.

Vidhya closes the loop. **Every interaction now produces a visible,
student-facing signal of what they got better at** — and every
interaction is logged to a notebook that becomes their personal,
downloadable source of truth.

### Part 1 — The "every attempt makes you better" engine

After every problem attempted, micro-exercise answered, or concept
engaged, the student sees:

```
┌─────────────────────────────────────────────────┐
│ Verdict        ✗ Wrong — sign error             │
│                                                 │
│ Mastery        63% → 66%  (+3)                  │
│                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                24 attempts · 8 from mastery     │
│                                                 │
│ Insight        "This wrong answer just made     │
│                 you sharper."                   │
│                The approach was correct; the    │
│                arithmetic slipped. Slow down on │
│                the next one.                    │
│                                                 │
│ Next step      ▸ One more attempt              │
│                Errors teach fastest when        │
│                the correction is immediate.     │
│                                                 │
│ Reinforcement  ★ You're connecting ideas       │
│                across 4 concepts — that's how   │
│                deep learning happens.           │
└─────────────────────────────────────────────────┘
```

Every box has a specific design rationale:

- **Mastery delta** — the tangible progress signal. Mastery is not
  binary "solved or not"; it's a moving number that advances with
  every engagement.
- **Insight tone** — four options: `celebration` (first-try, milestone,
  hard-problem-solved), `encouragement` (wrong answer, framed as
  learning), `reinforcement` (correct but not yet mastered),
  `correction` (prerequisite gap). **Never "try again" in a failure
  framing.** Always "this wrong answer uncovered exactly what we can
  fix."
- **Error-type-aware explanations** — when GBrain's 7-category error
  taxonomy classifies the attempt, the insight is specific:
  - conceptual → "specific gap in how you're thinking about X"
  - procedural → "method is right; a step was off"
  - computational → "approach was correct; arithmetic slipped"
  - notation → "you understand the idea; notation tripped you up"
  - application → "you know the rule; identifying when to apply it is
    the hard part"
- **Single next step, permission-based** — never a menu. The
  recommender cascade chooses one: `move_on` (for mastered concepts),
  `try_harder`, `practice_same`, `review_prereq` (weakest prerequisite,
  when conceptual error detected), `take_break` (after 5+ consecutive
  failures — "memory consolidates during breaks").
- **Reinforcements fire on patterns, not streaks** — 3+ consecutive
  correct same-concept, mastery milestone crossed, or cross-concept
  success ("connecting ideas across 4 concepts — that's how deep
  learning happens"). **Specific wins, not generic gamification.**

**Files:**
- `src/gbrain/after-each-attempt.ts` — insight engine (~430 LOC, pure
  functions, no I/O)
- `POST /api/gbrain/attempt-insight` — compute + return

### Part 2 — Smart Notebook: single source of truth, downloadable

Every user input becomes a notebook entry. Auto-clustered by concept.
Gap-analyzed against the full syllabus. Exportable as Markdown.

**7 entry kinds**, all captured automatically:
`chat_question` · `snap` · `lesson_viewed` · `problem_attempted` ·
`material_uploaded` · `diagnostic_taken` · `note`

**Auto-clustering** — lightweight keyword match against concept labels,
aliases, keywords. Score ≥ 1.5 wins. No LLM call, no embedding call,
no round-trip. Every log is ~1ms. Designed for write-heavy use.

**Gap analysis** — per topic, shows covered vs uncovered concepts in
the official syllabus. Worst-coverage-first ordering. Students see
**exactly what they haven't touched yet** — higher leverage than a
to-do list because it's grounded in what they've actually done vs
what's required.

**Markdown export** — the download button triggers
`GET /api/notebook/download` which streams GitHub-flavored Markdown
with `Content-Disposition: attachment`. Structure:

```markdown
# Study Notebook — Maya K.
*Exported from Project Vidhya on 2026-04-21*

Total entries: 342
Syllabus coverage: 58% (48 of 82 concepts touched)

## Table of contents
1. Syllabus coverage
2. Concepts by topic
3. Chronological log

## Syllabus coverage
| Topic | Coverage | Concepts touched | Gaps |
|-------|:--------:|:----------------:|------|
| linear-algebra | 🟢 85% | 17/20 | null space, +1 more |
| calculus | 🟡 62% | 13/21 | partial derivatives, directional... |
| complex-variables | 🔴 18% | 2/11 | contour integrals, residues... |

### Concepts to study next
**calculus** — 8 uncovered:
- Partial derivatives
- Directional derivatives
- ...

## Concepts by topic
### Eigenvalues (linear-algebra)
*23 entries · last touched 2026-04-19*
- [chat_question] Asked: how to find eigenvalues of 2x2 matrix?
  > I'm stuck on the characteristic polynomial step...
  *2026-03-18*
...
```

A student going into an exam can download their entire study history
in 2 seconds, reference it offline, print it, share it with a
teacher. **It's theirs.**

**Frontend at `/smart-notebook`** — three tabbed views:

- **Gaps** (default) — syllabus coverage table, worst-first
- **By concept** — clusters view with expandable entry lists
- **Timeline** — chronological log grouped by date

Plus the Download `.md` button in the header.

**Files:**
- `src/notebook/notebook-store.ts` — notebook module (~380 LOC)
- `src/api/notebook-insight-routes.ts` — 8 HTTP endpoints
- `frontend/src/pages/gate/SmartNotebookPage.tsx` — UI

**Storage:** `.data/notebooks/{user_id}.json` via shared
`createFlatFileStore` generic. Append-only. Bounded at 5000 entries
(student should be downloading periodically anyway).

### Why this is a moat

Traditional AI tutors optimize the *answer*. Vidhya optimizes the *arc*.

1. **Every attempt produces visible progress.** Students see mastery %
   move, not just correctness. The compounding is felt, not hidden.
2. **Every wrong answer is reframed as learning.** Error taxonomy lets
   us explain *why* an answer was wrong in a way that builds
   understanding rather than shame.
3. **Every session creates one actionable next step.** Student never
   decides what to do next alone.
4. **Patterns are celebrated specifically.** "Three in a row on
   eigenvalues" beats a generic streak counter.
5. **Notebook accumulates over weeks.** A student with 6 months of
   practice has a 1000-entry notebook grouped by concept — their study
   companion, their review reference, their proof of growth.
6. **Gap analysis against real syllabus.** No other tutor tells you
   which of your 82 syllabus concepts you haven't touched yet.
7. **Exportable in universal format.** Markdown works everywhere.
   Privacy bonus: the student owns their data.

**Zero new npm dependencies. Zero LLM cost at log or insight time.**
The insight engine is pure functions over existing GBrain state; the
notebook is flat-file storage; the clustering is keyword matching.
Architecturally clean.

---

## Slide 28 — The Dynamic Exam Framework Moat (One Exam, Many Students, Progressive Fill)

Every LMS claims to "support multiple exams." In practice, most ship
a static list defined by the vendor, and you wait months for new ones.

Vidhya ships with **a dynamic exam framework** that lets admins add
a new exam in 30 seconds with just three fields — then progressively
enrich it over days or weeks as details become available.

### The shape of the problem

An admin at a coaching institute decides to support GATE CS 2027. They
know the name. They know it's an Indian PG exam. They know it's run
by IIT Madras. But they don't have:

- The exact number of sections
- The marking scheme (is negative marking 1/3 or 1/4 this year?)
- The syllabus document (the official release is 3 weeks away)
- The exam date (not announced yet)

Traditional LMS: "come back when you have complete info."

**Vidhya: create it now. Fill as you go.**

### The admin flow

**Create (30 seconds):** Three required fields — short code, full name,
level. Optionally: country, issuing body, any seed text the admin has
lying around. System generates a unique ID `EXM-<CODE>-<BASE36-TS>`
that will be stable across all future edits and assignable to
unlimited students.

**Enrich (progressive):** Admin has four non-exclusive options:

1. **Auto-enrich from web** — one click. An LLM researches the exam
   (grounded in any local data the admin uploaded) and proposes a
   complete profile. Admin reviews in a preview, applies.
2. **Upload local data** — paste official syllabus text, prep-guide
   excerpts, past-paper content. This becomes authoritative context
   for enrichment, overriding general web knowledge.
3. **Edit manually** — open the Fields tab, fill anything directly.
4. **Talk to the assistant** — a conversational helper that greets,
   reports completeness, recommends highest-leverage next action.
   Stateless, regex-classified intents (auto-enrich, upload, ready,
   what's next). Never hallucinates exam content.

**Mark ready:** When ≥ 40% complete, the exam becomes assignable to
students. Remains in draft below that threshold.

**Adapt later:** Re-enrichment is idempotent. Admin can run it again
next week when the official syllabus is released. Nothing the admin
manually typed gets overwritten — enrichment only fills gaps or
refreshes previously-web-researched fields.

### Provenance — who filled what

Every filled field carries metadata. Source ranks trust:

    admin_manual     🟢 admin typed it directly
    user_upload      🔵 extracted from admin-uploaded local data
    web_research     🟡 filled by LLM, with confidence score
    default          ⚪ inferred placeholder
    none             ⚪ not yet filled

**Critical invariant:** enrichment NEVER overwrites admin_manual or
user_upload fields. Admin's explicit entries are sacred.

When admin edits a web-researched field, its source flips to
admin_manual automatically. Re-running enrichment is always safe.

### LLM-optional

Enrichment detects which provider has an API key at runtime —
`GEMINI_API_KEY` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`. If none
configured, returns a graceful "enrichment disabled" response and
admin can still fill everything manually. The framework does not
require an LLM to be useful.

Default provider: **Gemini 2.0 Flash Lite** — cheapest, fastest,
JSON-mode structured output. Roughly $0.0002 per enrichment call.

### One exam, many students

The unique Exam ID is the join key. A single exam profile serves
unlimited students:

    Exam: EXM-GATECS2027-MO8JEJYV
      ↓ assigned to
      ├── student_123 (user.exam_id = "EXM-...")
      ├── student_456 (user.exam_id = "EXM-...")
      ├── student_789 (user.exam_id = "EXM-...")
      └── ...

Admin edits the syllabus → every assigned student sees the update on
next page load. No per-student duplication, no stale copies.

A coaching institute admin sets up `GATE-CS-2027` once, bulk-assigns
50 students via `/admin/users`, and one edit later updates all 50.

### Completeness — a gradient, not pass/fail

Computed from 14 weighted fields across 5 categories (Basics /
Structure / Content / Schedule / Eligibility). A 25% exam is usable
— just less tailored. A 90% exam drives rich per-student experience
(topic-weighted priorities, countdown prompts, mock-exam fidelity,
pacing-aware micro-exercises).

The admin UI shows a per-category breakdown: "4/7 structural fields
filled." This makes progress visible without being a to-do list.

### HTTP surface (13 endpoints)

    POST   /api/exams                        Create
    GET    /api/exams                        List (admin)
    GET    /api/exams/assignable             List ready (teacher+)
    GET    /api/exams/:id                    Full + breakdown + suggestions
    PATCH  /api/exams/:id                    Update (admin_manual source)
    POST   /api/exams/:id/enrich             Preview proposal
    POST   /api/exams/:id/enrich/apply       Apply proposal
    POST   /api/exams/:id/local-data         Add local data
    DELETE /api/exams/:id/local-data/:ldid   Remove local data
    POST   /api/exams/:id/mark-ready         Draft → ready
    POST   /api/exams/:id/archive            Archive (reversible)
    DELETE /api/exams/:id                    Permanent delete (owner)
    POST   /api/exams/:id/assistant          Assistant turn

### Why this is a moat

1. **Zero wait-for-vendor.** Admin adds any exam, any time, zero code.
2. **Accepts incomplete info.** Partial data is the expected state,
   not a pending TODO.
3. **Provenance protects admin edits.** Re-enrichment never
   overwrites admin manual entries.
4. **LLM-optional.** Framework works fully without any LLM; enrichment
   is a nice-to-have layer.
5. **One profile, many students.** Coaching institutes scale cleanly.
6. **Local data takes priority.** Admins with official source documents
   get authoritative enrichment, not just web guesses.
7. **Architectural cleanliness.** Flat-file storage via shared
   createFlatFileStore; zero new npm deps; 13 endpoints; 1700 LOC.

Storage: `.data/exams.json` via the shared flat-file-store generic
from v2.9.1.

### v2.9.8 — Comparison + personalization

Exams never live in isolation. v2.9.8 adds three layers on top:

**Compare any two exams** — structured diff across 4 weighted
categories (Identity 20% · Structure 25% · Content 40% · Schedule
15%). Jaccard similarity on syllabus topics drives the Content
category. Categories with no data in either exam are excluded from
the weighted average rather than dragging the score to zero. A
unified `CanonicalExam` shape lets dynamic exams and static-catalog
entries compare against each other uniformly.

Side-by-side view in the admin UI shows shared topics, topics unique
to each exam, per-category scores, and a human-readable
recommendation.

**Find nearest matches** — every exam's detail page shows the top 5
most-similar exams ranked by overall similarity. Works across the
dynamic registry AND the static catalog. When creating a new exam,
the modal debounces against `/api/exams/suggest-similar` to surface
possible duplicates ("did you mean one of these?") before the admin
commits — a nudge, not a block.

**Personalize content delivery** — the real moat. When a student has
an `exam_id` assigned, every GBrain decision now factors in the exam:

    Mastery milestone insight → mentions the exam by name
      "You've mastered eigenvalues — one more locked in for GATE-CS."

    move_on next-step → prefers successors in the exam's syllabus,
                        ranked by exam topic weight

    take_break after 5+ failures → REPLACED with review_prereq when
                                   exam is ≤7 days ("with your exam
                                   close, keep momentum")

    Problem generation → uses exam.question_types mix

    Countdown chip on home → 4 urgency tiers (critical ≤7d /
                             high ≤30d / medium ≤90d / low / none)

**Fallback hydration** — if a student's target exam has <50%
structural completeness, the bridge automatically looks up the
nearest complete match (≥40% similar, more complete) and fills
missing structural fields from it. The student gets exam-aware
personalization immediately, even while the admin is still
completing the exam profile. Context carries `is_fallback: true` +
`fallback_source_name` so the UI can disclose this transparently.

**Opt-in consumption** — every GBrain consumer function accepts
`ExamContext | null` and degrades gracefully. Exam-less students
see zero behavioral change.

**4 new endpoints:**

    GET    /api/exams/:id/similar        Nearest-match ranking
    GET    /api/exams/compare?a=&b=      Full pairwise comparison
    POST   /api/exams/suggest-similar    Pre-create duplicate check
    GET    /api/exam-context/mine        Student's own exam context

**3 new frontend surfaces:**

    SimilarExamsPanel       in OverviewTab, shows top 5 matches
                            with similarity % and notable features

    CompareDrawer           side-by-side 4-category view with
                            shared topics and deltas

    ExamCountdownChip       student home, auto-fetched, self-gating

---

## Slide 29 — The Customer-Centric Giveaway (One Subscription, Many Exams)

Coaching institutes often prepare students for multiple related exams
at once. A student targeting GATE Computer Science may also benefit
from JEE Advanced, IES Electronics, BARC, or ISRO recruitment
practice. Traditional LMS pricing forces institutes to charge for
each separately — or to bundle silently without the student ever
realizing what they're getting.

Vidhya makes the bundle **explicit, celebrated, and customer-centric**.

### The mechanic

Admins define **exam groups** — curated bundles of related exams.
When a student is assigned to any exam in an approved group, they
see a giveaway banner when they sign in:

    🎁 Giveaway · included in your plan

    One subscription, 4 exams

    You're preparing for GATE Computer Science, and your plan
    also covers:

    [ JEE Advanced ]  [ IES Electronics ]  [ BARC CSE ]

The violet-to-fuchsia gradient with subtle shimmer reads as "bonus"
without being tacky. Dismissible per-group via localStorage — but
if the admin later approves a second group the student qualifies
for, the banner reappears for that new group. Students never miss
newly-added bonus exams.

### The admin master list

`/exam-groups` — dedicated admin page to manage bundles. Create a
group as a draft, add member exams from the registry or static
catalog, add a tagline + benefits list, then explicitly approve.

Key design choice: **approval is a gate, not a setting.** Drafts
are admin-only — never surfaced to students. Approval requires ≥2
member exams, stamps audit fields (`approved_by`, `approved_at`),
and flips student-facing activation.

PATCH explicitly strips `is_approved` to force use of the dedicated
`/approve` endpoint. Approval cannot happen accidentally via a
field update. That deliberate friction is the point — approval is
an institutional commitment that flows into the student's trust in
the bundle.

### Why this is a moat

1. **Zero-LLM feature.** The entire giveaway mechanic runs on pure
   data lookup: student's exam_id → which approved groups contain
   it → bonus exams. No API calls. No per-student cost.

2. **Compatible with v2.9.7–8 provenance model.** Groups are a
   clean layer on top; exam enrichment, comparison, similarity,
   and personalization engines all work unchanged. The existing
   19 moats compose cleanly with this one.

3. **Positions the bundle as a gift, not a feature.** "One
   subscription, 4 exams" reads better than "multi-exam access
   enabled." The banner celebrates; it doesn't just inform.

4. **Approval gate protects students from bad UX.** An admin
   mid-editing a group never accidentally shows students a
   half-formed bundle. The draft state is persistent and safe.

5. **Per-group dismissal preserves trust.** Students who dismiss
   a giveaway see it stay dismissed; students who later qualify
   for new groups get fresh notification. Both respect their
   attention.

### HTTP surface (13 new endpoints)

    POST   /api/exam-groups                        Create draft
    GET    /api/exam-groups                        List all (admin)
    GET    /api/exam-groups/approved               List approved (teacher+)
    GET    /api/exam-groups/containing/:exam_id    Reverse lookup
    GET    /api/exam-groups/:id                    Detail + members
    PATCH  /api/exam-groups/:id                    Update (strips approval)
    POST   /api/exam-groups/:id/approve            Approve (≥2 guard)
    POST   /api/exam-groups/:id/unapprove          Unapprove
    POST   /api/exam-groups/:id/members            Add exam
    DELETE /api/exam-groups/:id/members/:eid       Remove exam
    POST   /api/exam-groups/:id/archive            Archive
    DELETE /api/exam-groups/:id                    Delete (owner)
    GET    /api/my-giveaway                        Student resolution

Storage: `.data/exam-groups.json` via shared flat-file-store.

### Non-goals (deliberate scope)

- **No billing integration.** Groups unlock access, not billing.
- **No automatic group suggestion.** Admins curate manually.
- **No student-initiated joining.** Only admin assignment triggers.
- **No cross-group stacking.** First match wins (deterministic).
- **No syllabus auto-merging.** GBrain still personalizes against
  the student's primary exam only. Groups are a discovery +
  access-unlock mechanic, not a personalization hook.

---

## Slide 30 — The Multi-Channel Interactive Rendering Moat

Most educational platforms build interactivity for the web and treat
chat-bot delivery as a degraded fallback. Students on Telegram get
walls of text. Students on WhatsApp get screenshots. Students
listening via voice get nothing.

Vidhya ships a **rendering framework** that turns the canonical
8-component Lesson into first-class interactive content on every
delivery channel, with deliberate degradation when a channel can't
support a given interaction mode.

### The two-step pipeline

    Lesson ──[enrichment]──> EnrichedLesson ──[channel-render]──> RenderedLesson

**Enrichment** decides which components become interactive:

    hook              → Callout (insight)
    intuition         → Callout (tip)
    worked-example    → StepReveal (progressive disclosure)
    micro-exercise    → QuickCheck (tap to answer)
    common-traps      → FlipCard (flip for explanation)
    connections       → DragMatch (when 3+ pairs exist)

Strategy is a lookup table. Adding an enrichment rule = one row.

**Channel rendering** produces the right output for each channel:

| Block type | Web | Telegram | WhatsApp | Voice |
|------------|-----|----------|----------|-------|
| step-reveal | slide-in on reveal | "Next step ▶" button, callback-driven | numbered list | sequential narration |
| flip-card | 3D CSS flip | two-message flip via "Why?" button | "→" format | spoken pairs |
| quick-check | tap with animated feedback | inline keyboard with try-again | numbered reply | skipped (no input) |
| callout | animated badge | emoji + bold HTML | emoji + markdown | narrated with emphasis |

### Telegram gets real interactivity

The progressive-reveal state machine is the proof. Users tap "Next
step ▶" and the webhook routes a callback like
`reveal:{block_id}:{step_index}` — the server returns the next step
as a fresh message with an updated button.

No server-side state. The current progress is encoded in the
callback data. A webhook failure doesn't lose progress. Multiple
students can reveal different parts of the same lesson
concurrently in different chats.

### Why this is a moat

1. **Channel-agnostic lessons.** Authors never think about
   rendering. They produce canonical 8-component lessons. The
   rendering layer handles the rest.

2. **Decision logic in one place.** Adding a new component kind,
   a new block type, or a new channel is a local change in
   `src/rendering/`. No cross-codebase spaghetti.

3. **Telegram first-class.** Progressive reveal, flip cards, quiz
   buttons, retry on wrong answers — all via HTML + inline
   keyboards. No client-side code needed. A student on a
   five-year-old Android gets the same interactive experience as
   one on a MacBook.

4. **Accessibility by default.** Every web animation respects
   `prefers-reduced-motion`. Voice segments carry narration hints
   (`emphasis`, `pause_after_ms`). Every interactive element is
   native `<button>`, focusable, keyboard-activatable.

5. **Cache-safe.** Base Lesson preserved; enrichment is a pure
   function. Existing lesson cache unaffected. Future enrichment
   cache is trivial (lesson_id → EnrichedLesson).

### Files

    src/rendering/
      types.ts              InteractiveBlock union, channel output types
      lesson-enrichment.ts  Decision logic: components → blocks
      channel-renderer.ts   Four renderers + Telegram callback state machine

    src/api/rendering-routes.ts                            3 HTTP endpoints
    frontend/src/components/lesson/InteractiveLessonBlock.tsx  Framer Motion views
    docs/RENDERING-FRAMEWORK.md                           Framework doc

Zero new npm dependencies. Reuses Framer Motion (already present
since v2.4).

### v2.12.0 — Learning-objective + GBrain-aware enrichment

The v2.11.0 enrichment was deterministic (same Lesson → same
blocks). v2.12.0 threads GBrain signals through the decision layer
so the interactive treatment matches the student's actual
learning objective.

**Same canonical lesson, different interactive treatment per student.**

A NEET student (MCQ-heavy exam) preparing eigenvalues sees:
  - Compressed 1-step worked example (key insight only)
  - Synthesized pattern-recognition quick-check
  - Common-traps flip cards (conceptual traps surfaced first if
    they've been making conceptual errors)

A UPSC Mains student (descriptive-heavy) preparing eigenvalues sees:
  - Full 4-step worked example reveal
  - Trap flip-cards
  - Connections drag-match

Same canonical pedagogical content. The rendering layer adapts.

**The GBrain signals that drive adaptation:**

    learning_objective.dominant_type     mcq | msq | numerical | descriptive | mixed
    learning_objective.is_imminent       exam ≤ 7 days
    learning_objective.negative_marks    cost of wrong answer
    learning_objective.avg_seconds       per-question time budget

    mastery.concept_score                0..1 for the concept being rendered
    mastery.last_error_type              conceptual / careless / computational

**The decisions:**

- MCQ + confident (≥0.7 score) → compress worked example to key step only
- MCQ + struggling (<0.3 score OR conceptual error) → full reveal preserved
- Descriptive exam → always full reveal (derivation IS the point)
- Imminent + negative marking → pacing hint in quick-check prompts
- Conceptual error → trap cards with is_conceptual: true sort to top
- MCQ exam + no explicit micro-exercise → synthesize a quick-check
  from the worked example's key step + authored distractors

**Purity preserved:** same (lesson, channel, ctx) → same
EnrichedLesson. Caching safe. Cache key just needs to include
context hash.

**GBrain integration is automatic.** The /api/lesson/:id/rendered
endpoint hydrates EnrichmentContext from the signed-in user via
getExamContextForStudent() + getOrCreateStudentModel(). Both
lookups are best-effort; failure falls back to the v2.11.0
deterministic baseline.

**Response transparency:** rendered response includes a
gbrain_context field naming which signals influenced rendering —
useful for debugging and admin audit trails.

---

## Slide 31 — Technical Differentiators (Head-to-Head)

| Capability | Typical LLM edtech | Vidhya |
|-----------|-------------------|--------|
| Cost per DAU | $1.50-$2.50/mo | $0.01-$0.30/mo |
| Runtime DB required | Postgres/Supabase/Firebase | None |
| Embedding API | OpenAI / Cohere / Voyage | Local WASM, $0 |
| Document parsing | Server upload → cloud OCR | In-browser PDF.js + mammoth |
| Answer verification | LLM self-check | Wolfram Alpha computational |
| Works offline | No | Yes (after first load) |
| Student data location | Cloud | Device |
| Content source | LLM-generated, unverified | Scraped + verified + attributed |
| Tier routing | None (1 tier) | 4 tiers |
| Cost observability | Per-LLM-call logs | Admin dashboard with hit rates |
| Model routing | Single provider lock-in | 7+ providers, fallback router |
| Graceful without keys | Soft-bricked | Full bundle mode |
| Image input in chat | Sync-blocking upload | Background pre-analysis, zero added latency |
| Test diagnostic | Either none or batch (wait 30s+) | SSE stream — per-problem verdicts live |
| Follow-up suggestions | 3 after every turn, always | Max 1, null on failure, session-deduped |
| Learning plan delivery | Pushed at student unsolicited | Gated behind explicit "Show the plan" consent |
| Content delivery unit | Generate-on-demand OR static prose | Structured 8-component template, attributed multi-source aggregation |
| Personalization model | Entangled with generation | Layered on deterministic base — cacheable, auditable, testable |
| Spaced retrieval | Unsupported OR forced streaks | Offered via SM-2 with engagement-inferred quality; never pushed |
| New-exam onboarding | Code PR with new tables, migrations, admin UI | Write one YAML file, run three scripts — no code changes |
| Off-syllabus drift | LLM-generated content can wander | Three-layer guardrails on every chunk (concept-scope, depth, restrictions) |
| Content quality measurement | Qualitative review OR vanity metrics | Per-(concept × component) quality scores, iteration snapshots, compounding deltas |
| LLM provider | Single, baked into backend | 8 providers user-selectable in-browser, 30s to switch |
| API key storage | Server-side database or env-var | User's localStorage; server never persists |
| Adding a new LLM provider | Code PR with new client wrapper | Append to registry array (data change) |
| Identity bootstrap | DB migration + admin UI setup | First sign-in auto-claims ownership |
| Channel integration | Separate user account per channel | One account spans web + Telegram + WhatsApp |
| Role management deps | Auth library + session store + DB | Zero new deps (manual JWK + flat file + fetch) |

---

## Slide 32 — Tech Stack

**Backend** (8 runtime deps, 3 dev):
Gemini SDK · Anthropic SDK · pg · tsx · TypeScript · katex ·
resend · yaml · vitest

**Frontend** (12 runtime deps, 8 dev):
React 18 · Vite · Tailwind · framer-motion · react-router-dom 6 ·
`@xenova/transformers` (WASM embeddings) · idb · pdfjs-dist · mammoth ·
lucide-react · clsx · `@tanstack/react-query` · `@supabase/supabase-js`

**External APIs (all optional):**
Google Gemini · Anthropic Claude · Wolfram Alpha · Supabase · Resend ·
OpenAI · Groq · DeepSeek · Mistral · Together · OpenRouter

**Host requirements:**
Node ≥ 20 · npm ≥ 10 · git ≥ 2.30. Nothing else.

---

## Slide 33 — What's Shipped (at v2.27.0)

| Milestone | Commits | Highlights |
|-----------|---------|-----------|
| v2.0.0 | `a60cd78` | Admin dashboard, marketing page, cron, auth wall |
| v2.1.0 | `8c19093` | DB-less GBrain complete (all 7 phases of PLAN-dbless-gbrain.md) |
| v2.2.0 | `3e905f1` | Content Engine with four-tier cascade |
| v2.2.1 | `7ca5a98` | Content telemetry + admin dashboard + OpenStax/OCW sources |
| v2.2.2 | `46c27db` | Resolver tier-0 fixes, concept_id auto-fill, client telemetry |
| v2.2.3 | `a5c88f2` | Wolfram verification pipeline complete, 6 problems verified |
| v2.3.0 | `f5879da` | Scope-aware syllabus + multimodal intent analyzer (Snap) |
| v2.4.0 | `0e71cf9` | Chat image support + SSE diagnostic + polite next-step chips |
| v2.5.0 | `5147cff` | Lesson framework — 8-component template, 4-source aggregation, 6-rule personalizer, SM-2 retrieval |
| v2.5.1 | `0b577a0` | Curated misconceptions for 22 concepts, syllabus→lesson navigation, CI workflow staged |
| v2.6.0 | `888dbd7` | Curriculum framework — admin-owned YAML exams, shared-concept strategy, three-layer guardrails, compounding quality loop |
| v2.7.0 | `8a03c27` | LLM config framework — BYO-key in-browser, 8 providers as data, cascading role defaults, 4 API-shape universal adapter |
| v2.8.0 | `b4f0dd1` | Roles & multi-channel — owner/admin/teacher/student hierarchy, Google OAuth identity, flat-file user store, web/Telegram/WhatsApp adapters, zero new deps |
| v2.9.0 | `ee3da63` | GBrain Integration Bridge — pure-function translation layer connecting cognitive core to Lesson/Curriculum/Multimodal/Roles frameworks; teacher roster + admin cohort dashboard |
| v2.9.1 | `13ce67c` | Refactor — extract shared route + flat-file primitives, −210 LOC |
| v2.9.2 | `fc0445f` | User journey mapped, admin dashboard + student welcome card shipped |
| v2.9.3 | `de75e8a` | Teacher as end-user — /teaching dashboard, student-teacher relationship model with transparency |
| v2.9.4 | `e3fde92` | Compounding Mastery + Smart Notebook — after-each-attempt insight engine + auto-clustered notebook with gap analysis + Markdown export |
| v2.9.5 | `97b45d1` | Syllabus-driven notebook export with per-concept timestamps — every concept listed with clear practiced/not-practiced markers + fixes hidden Map/Array bugs |
| v2.9.6 | `23ff72b` | Notebook watermark + legally-binding-yet-friendly disclaimer — every export carries provenance + scope clarification |
| v2.9.7 | `33447f7` | Dynamic Exam Framework — admin-managed exam registry with LLM-optional progressive enrichment + conversational assistant + unique multi-student IDs |
| v2.9.8 | `3ec9f95` | Exam comparison + personalization — pairwise structured diff, nearest-match ranking across dynamic+static catalogs, GBrain exam-context bridge for student-facing content, urgency-aware insights, countdown chip |
| v2.9.9 | `ddea07d` | Exam groups + giveaway — admin-managed master list of approved exam bundles, approval gate for student-facing activation, explicit "one subscription, many exams" banner at sign-in, zero-LLM pure-data mechanic |
| v2.10.0 | `f98950b` | GBrain sweep — per-exam coverage engine; giveaway banner personalized with per-bonus-exam readiness; unified /api/me/gbrain-summary endpoint; systematic integration audit doc |
| v2.10.1 | `0c00b88` | Customer-centric messaging pass across README, PITCH, FEATURES |
| v2.10.2 | `752aad1` | Pain → bliss framing — 10 pain/bliss pairs across all three customer-facing surfaces |
| v2.10.3 | `56e2b11` | Six more pain/bliss pairs covering world-class access, foundations, pacing, social pressure, motivation, rigor+intuition |
| v2.11.0 | `1a41f15` | Multi-channel interactive rendering framework — enrichment decision logic + channel renderer for web/Telegram/WhatsApp/voice; Framer Motion web components; progressive-reveal state machine for Telegram |
| v2.12.0 | `24beb67` | Objective + GBrain-aware enrichment — same canonical lesson produces different interactive treatment per student based on exam question-type mix, mastery, and exam proximity; README pain/bliss condensed to soundbites |
| v2.13.0 | `72d4cb4` | GBrain sweep to every touchpoint — speed of answering threaded through enrichment; content-routes tier bias by mastery; /api/syllabus/me mastery overlay; /api/admin/gbrain-audit live registry; every student-facing feature confirmed integrated |
| v2.13.1 | `1a62f3b` | Indian-context pain/takeaway experiment |
| v2.13.2 | `3087cd2` | Clean English, Bliss restored with takeaway framing |
| v2.13.3 | `ee773cc` | Reimagined as student-journey Before/After |
| v2.14.0 | `371d751` | BITSAT Mathematics live sample — complete exam spec, full 8-component lesson, 10-Q mock with GBrain-shaped analysis, BITSAT-specific strategies; 7 HTTP endpoints under /api/sample/bitsat/* |
| v2.15.0 | `5705840` | Feedback-driven scope expansion framework — generic across all exams |
| v2.16.0 | `06ca5a0` | Sample-check workflow — admin requests sample, shares /s/:token, collects version-pinned feedback, iterates with carry-forward; cross-exam framework with GBrain-assisted relevance; 13 endpoints |
| v2.17.0 | `3ddf1e1` | LLM-backed sample generation + Course promotion pipeline with lineage log |
| v2.18.0 | `1f9aaf3` | Master orchestrator + exam adapter registry — plugin pattern, GBrain feedback consultation |
| v2.19.0 | `6390db3` | UGEE IIIT Hyderabad Mathematics live sample — proves portability, cross-exam GBrain verified |
| v2.20.0 | `3c10ef8` | Attention primitive — short-session-aware delivery across all modules including GBrain |
| v2.19.1 | `7703e4c` | UGEE full content corpus + end-to-end feedback loop — 10 lessons, 4 mocks, 61 Q, LiveCourse v1.0.0 promotion |
| v2.21.0 | `ef9d378` | Marketing + Acquisition Module — blog with draft→in_review→approved→published→stale→archived lifecycle; content-addressed articles (SHA-256); derived layout engine (landing page auto-recomputes on publish); social card generation across 5 platforms (Twitter, LinkedIn, Instagram, WhatsApp, Telegram) with platform-tuned copy + UTM tags; campaign coordinator for multi-article multi-channel pushes; sync bus with automatic drift detection (app feature change → affected articles auto-marked stale); block-check bulk admin review; dashboard single-pane-of-glass; orchestrator cross-wired to emit `exam_content_promoted` events. 55/55 smoke cases pass |
| v2.22.0 | `ff7aa6c` | Admin Orchestrator Agent — deterministic agentic single source of truth. 25-tool registry across 8 domains (feedback, sample-check, course, exam-builder, attention, marketing, scanner, strategy, task); 8-role registry (owner, admin, content-ops, exam-ops, marketing-lead, qa-reviewer, analyst, author) with tool-level authorization; scanner produces unified HealthReport across all 6 modules emitting 11 distinct signal codes; strategy engine pattern-matches 7 distinct strategy kinds (triage-feedback-backlog, iterate-and-promote-course, rereview-stale-articles, launch-marketing-campaign, address-attention-deferrals, nudge-aging-sample-checks, expand-content-corpus) with P0-P3 priority ordering; task store materializes proposed tasks with append-only activity log + auto-dependency-unblocking; runAdminAgent() performs full scan→propose→enqueue→narrate cycle; 4 cross-module insight kinds (feedback-attention-correlation, course-feedback-debt, campaign-opportunity, marketing-content-gap); 15 HTTP endpoints under /api/admin/agent/*; optional opt-in LLM narration via content resolver cascade with deterministic fallback. 70/70 smoke cases pass |
| v2.23.0 | `21c35bc` | MCP-compliant JSON-RPC server + LLM bridge — external agents can now discover + call admin orchestrator tools. JSON Schema Draft 2020-12 input contracts on every tool (25 existing + 4 new). 4 LLM-backed tools in new `agent` domain: narrate-strategy, summarize-health, suggest-next-action, describe-capabilities — all route through new llm-bridge which reuses existing src/llm/ config-resolver + adapter factory stack (graceful null fallback when no provider+key in environment). MCP JSON-RPC 2.0 server at POST /api/admin/agent/mcp implementing initialize/ping/tools/list/tools/call with protocol version 2024-11-05; tools/list is role-scoped (admin sees 29, analyst sees 18); tools/call enforces role authorization via existing invokeTool path; error codes -32001 tool-not-found / -32002 not-authorized. Public manifest at GET /api/admin/agent/mcp/manifest for unauthenticated discovery. Diagnostic GET /api/admin/agent/llm-status reports bridge availability without making a paid call. Fixed silent-failure bug in v2.22's narrateStrategy (was calling wrong content-resolver API). Fixed two pre-existing adapter bugs: openai.ts + ollama.ts imported non-existent BaseAdapter symbol (should be BaseLLMAdapter). 93/93 smoke cases pass across 18 case groups. |
| v2.24.0 | `d05108c` | MCP protocol completeness — resources primitive + stdio transport + live LLM smoke infrastructure. (1) MCP resources at vidhya://admin/{health,strategies,runs,tasks,insights,tools,roles} URI scheme — 10 resource descriptors (6 concrete, 4 template) with role-scoped resources/list + resources/read methods; capabilities.resources declared with subscribe=false, listChanged=false. (2) stdio transport at src/admin-orchestrator/stdio-server.ts for Claude Desktop — persistent Node process reading newline-delimited JSON-RPC from stdin, writing responses to stdout, structured logs to stderr only; graceful shutdown on SIGTERM/SIGINT/SIGHUP; env-driven role via VIDHYA_MCP_ROLE. (3) Live LLM smoke test at smoke/live-llm-smoke.ts — opt-in, env-gated, exercises bridge end-to-end against real Gemini/Anthropic/OpenAI key; skips cleanly with SKIPPED message when no key present; budget cap <$0.01 per full run. 81/81 smoke cases pass across 21 case groups. |
| v2.25.0 | `e28e9ec` | Admin orchestrator dashboard UI — single-file HTML+CSS+JS served at GET /api/admin/agent/dashboard. Zero build step, zero runtime dependencies, Google Fonts only. Operations control-room aesthetic: dark slate #0a0e13 background, IM Fell English serif section headers pairing with IBM Plex Sans/Mono body, amber #f0b060 accent evoking brass instrumentation, semantic severity colors (crit/warn/info/ok) + P0-P3 priority pills. Layout: header with Run/Refresh/Sign-out + auto-refresh toggle, status bar pill + 6 counters, 3-column main grid (signals+insights / strategies / tasks), collapsible MCP Explorer showing 29 tools with JSON Schemas + 10 resources. Auth via localStorage JWT with paste-token prompt on first load; Bearer header on every fetch; 401 clears token. 30s polling refresh. Task Claim + Complete actions; Run Agent triggers POST /run with auto_enqueue_tasks + attempt_llm_narration. MCP resources/list fetched via JSON-RPC POST. Staggered fade-in animation (40/120/220ms). New sendHTML route helper in lib/route-helpers with Cache-Control: no-cache. 19 admin-agent routes total (18 from v2.24 + 1 new). Version bumped to 2.25.0 across MCP_SERVER_INFO, describe-capabilities, dashboard header. 84/84 smoke cases pass across 13 case groups. |
| v2.26.0 | `cf55c7d` | MCP prompts/ primitive + dashboard relocated to same-origin static. (1) MCP prompts — third primitive after tools + resources, with prompts/list + prompts/get JSON-RPC methods; 6 role-scoped prompt templates (daily-standup, triage-briefing, strategy-review, task-handoff, week-in-review, content-debt-report) that return MCP-formatted messages the CLIENT runs through its own LLM; capabilities.prompts declared with listChanged=false; error codes -32001 prompt-not-found, -32002 not-authorized, -32602 invalid-arguments, -32603 internal; argument validation for required params; all prompt builders deterministic (no server-side LLM calls). (2) Dashboard moved from /api/admin/agent/dashboard to /admin/agent/dashboard — now served from frontend/dist/admin/agent/dashboard/index.html, lives alongside the student-facing SPA under the same origin + CSP, no longer pollutes the /api/ namespace; canonical source remains src/admin-orchestrator/dashboard-html.ts with a new scripts/regenerate-dashboard-static.ts that writes the TS template output to frontend/public (picked up by Vite) AND frontend/dist (for immediate dev) — single source of truth, one committed artifact. (3) gate-server.ts static handler patched to serve index.html from directories matching /foo/ paths (standard static-host behavior). (4) Old /api/admin/agent/dashboard now returns HTTP 301 to /admin/agent/dashboard preserving any existing bookmarks. 97/97 smoke cases pass across 18 case groups. |
| v2.27.0 | *this* | MCP logging/setLevel + Prompts tab in dashboard + integration docs. (1) Central logger (src/admin-orchestrator/logger.ts, ~220 LOC) with 8 MCP-standard levels (debug/info/notice/warning/error/critical/alert/emergency), bounded 200-event ring buffer, subscribe/unsubscribe API, per-session level tracking, stderr passthrough for operator visibility. (2) MCP logging/setLevel method — session-keyed level filter; under stdio transport, logger subscriptions push notifications/message to stdout matching MCP spec (jsonrpc 2.0 + method + params.{level,logger,data}); under HTTP transport, accepts setLevel for compliance then exposes ring buffer via new resource vidhya://admin/logs/recent with session-threshold applied. stdio-server.ts refactored to use central logger throughout (no more local log helper). (3) Prompts tab in dashboard — third tab in MCP Explorer showing all 6 prompts, with per-prompt argument inputs (required params marked with red asterisk), Generate button that calls prompts/get via JSON-RPC, on-success preview in a collapsible details element with character count, Copy to Clipboard button using navigator.clipboard with execCommand fallback for non-HTTPS contexts, and green 'ok' toast on successful copy. (4) Documentation — docs/mcp-integration.md (320 lines) with copy-paste Claude Desktop + Cursor + OpenAI Python configs, HTTP curl examples for all 4 primitives, environment variable reference, surface catalog, error code table, troubleshooting section. docs/admin-dashboard-quickstart.md (160 lines) — 5-step install-to-connected walkthrough. 118/118 smoke cases pass across 17 case groups. |

**Production numbers at v2.6.0:**
- 34 curated + attributed problems across 10 topics
- 82-concept knowledge graph with 22 fully-curated explainers (100% quality)
- 6 problems Wolfram-verified end-to-end
- 4-tier resolver live at `/api/content/resolve`
- **1 admin-owned exam definition** (GATE MA, 27 concept links) with per-exam depth/weight/emphasis/restrictions
- 5 personalized-syllabus exam presets (distinct from admin curricula)
- Multimodal analysis with 6 intents (explain / solve / practice / check / stuck / transcribe)
- **LLM-agnostic runtime** — 8 providers configurable in-browser at `/llm-config`
- **Role-based access** — owner/admin/teacher/student with multi-channel identity (web/Telegram/WhatsApp)
- **GBrain Integration Bridge** — 8 pure translation functions wiring cognitive data to every consumer framework, with centralized privacy filters
- SSE-streaming test-paper diagnostic with auto-generated study plan
- Admin dashboard live at `/admin/content`
- Auth wall verified (HTTP 401 on unauth)
- 83% free-hit rate on smoke-test traffic
- Frontend builds in ~29s, SnapPage chunk 22 KB

**Total code volume:**
- ~11,000 LOC backend + frontend (production)
- ~5,000 LOC scripts + pipeline + CI
- ~5,000 LOC documentation (README, INSTALL, DEPENDENCIES, PLAN docs, CHANGELOG)

---

## Slide 34 — Cost Projections at Scale

Assumes 20 problems/day + 3 tutor turns/day per DAU, 80% tier-0 hit rate,
Gemini 2.5 Flash-Lite pricing (Apr 2026), Wolfram free tier used for
build-time verification only.

| DAU | Naive $/mo | Vidhya $/mo | Vidhya $/user/mo |
|----:|-----------:|------------:|-----------------:|
| 100 | $200 | $28 | $0.28 |
| 1,000 | $2,000 | $280 | $0.28 |
| 10,000 | $20,000 | $2,800 | $0.28 |
| 100,000 | $200,000 | $28,000 | $0.28 |

**Marginal cost scales linearly — but the constant is 14× lower.**

With more bundle content (target: 500 problems in 30 days, 2000 in 90),
tier-0 hit rate climbs toward 95%, driving per-DAU cost below $0.10/mo.

---

## Slide 35 — Why Now

**Three trends converge:**

1. **LLM pricing is collapsing, but still per-token.** Flash-Lite at
   $0.10/M input is 20× cheaper than GPT-4 from 2023, yet edtech apps
   still charge $15/mo because they spend it all on API calls. The
   architecture — not the model — is the expensive part.

2. **Client-side ML has matured.** transformers.js runs MiniLM in 22 MB
   of WebAssembly. Pdfjs is a stable community library. IndexedDB has
   universal browser support. What required a server 5 years ago now
   runs in the browser.

3. **Privacy regulation is tightening.** Students uploading personal
   notes to cloud LLMs is legally ambiguous under FERPA/COPPA/GDPR.
   Local-first architectures sidestep this entirely.

**Vidhya exists at the intersection.**

---

## Slide 36 — Extension points (for contributors)

Vidhya is open source. These are places where a contributor can add
real value without rewriting the foundation:

**Content expansion.** The current bundle ships 34 pre-verified
problems across 82 concepts. Every scraper under `scripts/` is
idempotent and attribution-preserving — add a new source, run the
pipeline, the bundle grows. No architectural lift.

**Explainer content.** 82 concept placeholders live in
`frontend/public/data/explainers.json`. 6 have been filled with
complete 200-word pieces; 76 are awaiting content. Each completed
explainer immediately improves Tier-0 hit rate.

**Domain expansion.** Swap `src/constants/concept-graph.ts` and add
a new curriculum YAML under `data/curriculum/`. Ship for JEE, CAT,
UPSC, or any exam with a defined syllabus. Infrastructure unchanged.

**Mobile wrapper.** Architecture is already local-first. A Capacitor
or Tauri wrap would ship to iOS/Android without restructuring the
backend. Nothing in the codebase assumes a browser.

**Verification layer.** A SymPy micro-service (stateless, optional)
would catch the ~6% of problems where Wolfram refactored algebraically
and the equivalence check fails. Clean interface point exists at
`src/services/wolfram-service.ts`.

These aren't promises of what we'll ship — they're openings in the
architecture where someone else can.

---

## Slide 37 — Invitation

**Project Vidhya is open source under MIT.**

Where to engage:
- **Try it:** `git clone https://github.com/mathconcepts/project-vidhya.git && npm run setup`
- **Deploy it:** One-command Docker or Render setup, see `INSTALL.md`
- **Contribute content:** Every CC-licensed math source can be added via a new scraper
- **Fork the architecture:** Domain-agnostic — drop in your concept graph

*Vidhya (विद्या) — Sanskrit for knowledge, learning, and the means of attaining it.*

---

## Appendix A — File Index

**Core resolver:**
- `src/content/resolver.ts` — four-tier cascade
- `frontend/src/lib/content/resolver.ts` — client mirror
- `src/api/content-routes.ts` — HTTP endpoints

**Wolfram integration:**
- `src/services/wolfram-service.ts` — HTTP client + answersAgree
- `scripts/verify-wolfram-batch.ts` — bulk verifier

**Content pipeline:**
- `scripts/scrape-corpus.ts`
- `scripts/scrape-textbooks.ts`
- `scripts/build-explainers.ts`
- `scripts/build-bundle.ts`

**GBrain cognitive core:**
- `src/gbrain/*.ts` (6 pillars)
- `frontend/src/lib/gbrain/*.ts` (client mirror)
- `src/constants/concept-graph.ts` (82 nodes)

**Local-first runtime:**
- `frontend/src/lib/gbrain/db.ts` — IndexedDB
- `frontend/src/lib/gbrain/embedder.ts` — transformers.js
- `frontend/src/lib/gbrain/materials.ts` — PDF/DOCX parsing

**Observability:**
- `src/content/telemetry.ts`
- `src/api/aggregate.ts`
- `frontend/src/pages/gate/ContentAdminPage.tsx`
- `frontend/src/pages/gate/GBrainAdminPage.tsx`

**User-facing:**
- `frontend/src/pages/gate/SmartPracticePage.tsx` — tier cascade UI
- `frontend/src/pages/gate/MaterialsPage.tsx` — upload/RAG
- `frontend/src/pages/gate/ChatPage.tsx` — grounded tutor

**Documentation:**
- `README.md`, `INSTALL.md`, `DEPENDENCIES.md`, `LICENSE`
- `PLAN-content-engine.md` — cost math
- `PLAN-dbless-gbrain.md` — architecture rationale
- `PLAN-gbrain-mvp.md` — cognitive model design
- `DESIGN.md` — UI principles
- `CHANGELOG.md` — release history

---

## Appendix B — Moat Summary (One Table)

| Moat | Strength | Why it compounds |
|------|----------|------------------|
| **Cost (4-tier cascade)** | 🔵🔵🔵🔵🔵 | Every new problem scraped lowers future cost |
| **Privacy (local-first)** | 🔵🔵🔵🔵 | Architectural, not policy-based |
| **Quality (Wolfram verify)** | 🔵🔵🔵🔵 | Grows with bundle size |
| **Personalization (materials)** | 🔵🔵🔵🔵 | Switching cost rises with upload volume |
| **Cognitive model (GBrain)** | 🔵🔵🔵 | 6 pillars, explicit design, auditable |
| **Pedagogical (Lesson framework)** | 🔵🔵🔵🔵🔵 | Research-grounded template + attributed aggregation + layered personalization; compounds with bundle + user materials growth |
| **Curriculum (admin-owned, compounding)** | 🔵🔵🔵🔵🔵 | Shared-concept strategy pays √N across exams; quality iterations measurably compound via engagement→quality→iteration loop |
| **LLM-agnostic (BYO-key)** | 🔵🔵🔵🔵 | Provider-as-data — 8 providers, 4 API shapes; users pick + pay their own provider, no lock-in, rotate in 30s |
| **Roles & multi-channel** | 🔵🔵🔵🔵 | Flat-file identity, zero-setup bootstrap (first signup = owner), 3 channels one account, zero new deps |
| **GBrain Integration Bridge** | 🔵🔵🔵🔵🔵 | One cognitive source of truth for every consumer; privacy filters centralized; refactor-friendly; unlocks teacher/admin UX that was always in the data |
| **Compounding mastery** | 🔵🔵🔵🔵🔵 | Every attempt produces visible mastery delta + insight + single next step + pattern reinforcement; error-taxonomy-aware explanations reframe wrong answers as learning |
| **Smart Notebook** | 🔵🔵🔵🔵🔵 | Every user input auto-logged, concept-clustered, syllabus gap-analyzed, exportable as Markdown — single source of truth, universal format, privacy-preserving |
| **Dynamic exam framework** | 🔵🔵🔵🔵🔵 | Admin-managed exam registry with 3-field minimal seed, LLM-optional progressive enrichment, conversational assistant, admin-edit-preserving provenance, unique IDs reusable across any number of students |
| **Giveaway layer** | 🔵🔵🔵🔵🔵 | Admin-curated exam bundles with explicit approval gate; student-facing "one subscription, many exams" banner; per-group dismissal; zero-LLM pure-data lookup |
| **GBrain uniformity** | 🔵🔵🔵🔵🔵 | Single /api/me/gbrain-summary endpoint exposes mastery stats + exam context + giveaway coverage + focus signal; cross-exam coverage engine; integration audit proves systematic GBrain application |
| **Multi-channel rendering** | 🔵🔵🔵🔵🔵 | Canonical lessons enriched with interactive blocks; each block has first-class renderers for web (Framer Motion), Telegram (progressive-reveal keyboards), WhatsApp (numbered), voice (narration). v2.12.0: objective + GBrain-aware — MCQ exams get compressed + drilled treatment, descriptive exams get full derivations, struggling students keep full scaffolding. |
| **Content (curated + attributed)** | 🔵🔵🔵🔵 | Nightly CI compounds asset value |
| **Observability (telemetry)** | 🔵🔵🔵 | Flat-file, no DB costs |
| **Graceful degradation** | 🔵🔵🔵 | Works in constrained deployments |
| **UX (no-nagging, permission-first)** | 🔵🔵🔵🔵 | Scarcity → trust → high chip acceptance; compounds via learned trust |
| **Multi-LLM routing** | 🔵🔵 | No single-provider lock-in |
| **Licensing (MIT + attributions)** | 🔵🔵🔵 | Republish-safe at any scale |
| **Domain-agnostic architecture** | 🔵🔵🔵 | One codebase, many subjects |

---

*End of deck. Questions → contributors@project-vidhya.dev*
