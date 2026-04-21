# Vidhya — Your AI study partner that actually teaches

*A tutor that knows your exam, reads your notes, answers at 2am,
and respects your privacy.*

---

## The 30-second version

Imagine a tutor who:

- **Knows your exam inside out** — your syllabus, your weightages, the common traps examiners set
- **Has read all your class notes** — upload your PDFs; lessons adapt to what you've already written
- **Is there whenever you're stuck** — at midnight before an exam, on the bus, in the library
- **Double-checks every answer** — computationally verified, not just "the AI said so"
- **Keeps your data on your device** — your notes, your progress, your questions never leave your phone
- **Costs nothing to try** — use the free AI tier, or plug in your own key if you have one
- **Works where you already are** — web app, Telegram, WhatsApp, same progress across all of them

That's Vidhya.

---

## Why students use it

**You're stuck on a problem at 11pm.** Take a photo. Vidhya reads the image,
tells you exactly which concept it's testing, walks you through the solution
step by step, and flags the exact point where students usually go wrong. Not
just "here's the answer" — here's *why* it's the answer, and here's what to
watch out for next time.

**You're halfway through your syllabus and don't know what to focus on.**
Upload a photo of your last mock test. Vidhya grades each question, finds
your weak spots, and builds you a focused study plan — "next 14 days, these
12 concepts in this order." Gentle, no nagging. It's there if you want it.

**You want to actually understand, not just memorize.** Every lesson is eight
bite-sized pieces: hook → definition → intuition → worked example → mini
exercise → common mistakes → formal statement → what it connects to. Built
on how human memory actually works. No 45-minute video lectures, no
copy-pasted textbook chapters.

**You're prepping on a cheap laptop, on campus wifi.** Vidhya pre-loads the
most common problems to your device. You can keep studying even when the
internet drops.

**You don't want to hand over your study data to anyone.** Your materials stay
in your browser. Your progress lives on your device. Your AI key (if you
choose to use one) never touches our servers.

---

## What makes it different from "another ChatGPT wrapper"

1. **It teaches; it doesn't just answer.** Most AI chatbots give you the
   answer. Vidhya gives you the method, the intuition, the common mistake,
   the connection to what you already know. Students who just want the
   answer can find it in one tap; students who want to learn get the full
   lesson.

2. **It sticks to your syllabus.** ChatGPT will happily explain functional
   analysis when you asked about 2×2 eigenvalue problems. Vidhya has
   guardrails so materials you upload don't drag lessons into topics that
   won't be on your exam.

3. **Answers are verified, not made up.** Where possible, we run answers
   through Wolfram Alpha. Where the problem is from a past paper, we've
   already pre-checked it. The AI doesn't get to invent numbers.

4. **Your syllabus is on your phone, not in the cloud.** Even if our servers
   are down, the app works for the 80% of questions students actually ask.

5. **No gamification, no streaks, no notifications.** You study when you
   want. The app doesn't manipulate you.

---

## How to get started

**As a student** — open the app, upload your class notes if you have them,
ask a question or snap a photo. That's it. Sign-in is optional (adds
cross-device sync and chat-app access).

**As a teacher** — sign in, get your admin to promote you, then visit
`/admin/users` to see your students' roster.

**As an admin/institution** — follow `INSTALL.md` Path 4. Your first
Google sign-in becomes the owner. Add Telegram/WhatsApp channels if you
want to reach students where they chat. Deploy on a $5/month VPS or
hosted free tier — Vidhya has no per-user infrastructure cost.

---

## For teachers & institutions

**Free to run.** No per-seat licensing. Install on your own infrastructure
(a $5/month VPS is plenty for a class of 50). Students who opt to use
their own AI key pay their own AI provider directly — you don't carry
that cost.

**You own your data.** Student progress lives on student devices.
Cross-device sync, if they opt in, lives in your deployment's flat-file
store — not ours.

**One account, three channels.** Students reach the app via web,
Telegram, or WhatsApp — whichever they actually use. Same identity, same
progress, same curriculum.

**Customizable curriculum.** Define your exam's syllabus once in a YAML
file. Adjust which concepts matter, at what depth, with what emphasis.
The system auto-adapts lessons and practice to your definition.

---

## For developers & technical evaluators

This one-pager deliberately leads with student value. For the complete
technical architecture — cost tables, verification pipeline, DB-less
runtime, provider-agnostic LLM routing, role-based access with zero new
dependencies — read:

- [FEATURES.md](./FEATURES.md) — full technical pitch deck with every
  moat, metric, and file reference
- [docs/LESSON-FRAMEWORK.md](./docs/LESSON-FRAMEWORK.md) — pedagogical
  design with research bibliography
- [docs/CURRICULUM-FRAMEWORK.md](./docs/CURRICULUM-FRAMEWORK.md) — admin-
  owned two-layer curriculum with compounding quality loop
- [docs/LLM-CONFIGURATION.md](./docs/LLM-CONFIGURATION.md) — BYO-key setup
  across 8 providers
- [docs/ROLES-AND-ACCESS.md](./docs/ROLES-AND-ACCESS.md) — role hierarchy
  and authorization model
- [docs/MULTI-CHANNEL-SETUP.md](./docs/MULTI-CHANNEL-SETUP.md) — web +
  Telegram + WhatsApp integration walkthroughs
- [INSTALL.md](./INSTALL.md) — 5-path install guide

---

## The short technical summary

If you only read one technical paragraph: Vidhya is a DB-less, local-first
adaptive learning engine with a four-tier content cascade (bundle → client
RAG → LLM → Wolfram verification), a research-grounded 8-component lesson
framework, an admin-owned YAML curriculum with three-layer guardrails and a
compounding quality loop, BYO-key LLM configuration across 8 providers, and
a four-role access system (owner/admin/teacher/student) with multi-channel
identity (web/Telegram/WhatsApp) — all shipped with zero enterprise
dependencies. Cost per daily active user: **$0.01–$0.30** where typical
edtech spends **$1.50–$2.50**.

---

*Vidhya is open source and runs on your own infrastructure. Your students,
your curriculum, your AI provider, your data.*
