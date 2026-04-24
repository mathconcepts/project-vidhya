# Vidhya demo — the multi-role walkthrough

A **ready-to-test local demo** of Project Vidhya that covers every
role the product has: **owner, admin, teacher, student**. One seed
creates all of them — interlinked. One picker page lets testers
sign in as any of them. No sign-up. No Google OAuth. No LLM keys
required for the baseline experience.

```
  one-command setup + one-click role switching + owner-visible telemetry
```

---

## Quick reference — every demo command

```bash
# First time
npm run demo:setup             # install deps + seed (one-off)
npm run demo:start             # boot backend + frontend
# → open http://localhost:3000/demo.html

# Day-to-day
npm run demo:reset             # clear seed artefacts
npm run demo:seed              # reseed (without reinstalling)
npm run demo:verify            # 14 checks across all 4 roles
npm run demo:log               # owner-visible usage log (+ --summary, --all)

# Channels (Telegram / WhatsApp — see demo/CHANNELS.md)
npm run demo:channel-setup     # validate operator-provided creds
npm run demo:channel-link      # bind a demo role to a channel identity
```

## What ships — one scrollable page

| Piece | Where | Status |
|---|---|---|
| 6 seeded users across 4 roles | `demo/seed.ts` | ✓ shipped |
| Role picker (one-click sign-in) | `/demo.html` | ✓ shipped |
| BYOK discovery page | `/demo-api-keys.html` | ✓ shipped |
| Owner-visible usage telemetry | `.data/demo-usage-log.json` | ✓ shipped |
| Telegram + WhatsApp channel linking | `demo/CHANNELS.md` | ✓ shipped |
| **Demo → paid conversion flow** | `/gate/convert-demo` + `/api/demo/convert` | ✓ shipped |
| **Self-service account deletion** | `/api/me/delete*` + `/api/me/export` | ✓ shipped |
| **Activation-funnel metrics (admin)** | `/api/admin/lifecycle/funnel` | ✓ shipped |
| **Cohort-retention analysis (admin)** | `/api/admin/lifecycle/retention` | ✓ shipped |
| Deployment (Render / Railway / Fly / Docker) | `demo/HOSTING.md` | ✓ documented |

The **four exam adapters** the demo exercises — BITSAT, JEE Main,
UGEE — are documented separately in [`EXAMS.md`](./EXAMS.md). The
demo seed uses the real canonical exam IDs, so everything the
planner computes for a demo student is the same computation it
would run for a production student on the same exam.

---

## One-command start

```bash
npm run demo:setup      # install deps + build frontend + seed all six users
npm run demo:start      # boot backend + frontend
# open http://localhost:3000/demo.html
```

The landing page shows six cards. Click any one to auto-login as that
user.

---

## Who gets seeded

| Card | Role | Name | What their view shows |
|---|---|---|---|
| 👑 | owner | Nisha Rao | Platform-wide user list, role promotion, ownership transfer |
| ⚙️ | admin | Arjun Gupta | Content management, campaigns, user admin, dashboard summary |
| 🎓 | teacher | Kavita Menon | Roster of 2 students, push-to-review queue |
| 📚 | student · active | Priya Sharma | 2 exams (7d + 90d out), 6 plans, trailing stats, 3 templates |
| 📖 | student · light | Rahul Iyer | 1 exam (30d out), 2 plans, minimal activity |
| 🆕 | student · new | Aditya Shah | Empty account — feel the first-time UX |

Kavita (the teacher) is explicitly wired to Priya and Rahul. Aditya
has no teacher — testers can try assigning one from the admin view.

---

## The demo → real account flow

Every demo student sees a sticky **"Demo mode — Make this real →"**
banner at the top of `/gate/planned`. Clicking it opens a page at
`/gate/convert-demo` where they enter a real email and name. A
single API call to `POST /api/demo/convert`:

1. Creates a real user account
2. Carries over exam profiles, plans, templates, and practice-log
   entries (so the trailing-stats badge doesn't reset to zero — the
   act of signing up is not punished)
3. Anonymises `demo-usage-log.json` entries tied to the demo user
   (the owner keeps the cohort aggregate but loses the per-user link)
4. Returns a success summary with the carry-over counts

Proven end-to-end: on a clean demo seed, **Priya's 97 min trailing
stats / 6 plans / 3 templates / 2 exam registrations / 9 practice
sessions** all survive the conversion. See the worked scenario in
[`agents/CUSTOMER-LIFECYCLE.md`](./agents/CUSTOMER-LIFECYCLE.md) for
the field-by-field migration specification.

## Admin lifecycle reports

Two owner-facing endpoints expose the customer-lifecycle health at a
glance. Both are `admin+` gated; student tokens get HTTP 403.

```
GET /api/admin/lifecycle/funnel        # activation funnel per cohort
GET /api/admin/lifecycle/retention     # cohort disengagement signals
```

- **Funnel** reports the 5-step conversion: *signed_up →
  exam_registered → first_plan → first_attempt → activated (trailing
  stats > 0)*. Cohorts under 5 members merge into
  `small-cohorts-combined` to avoid fingerprinting.
- **Retention** reports week-over-week practice-minutes per cohort.
  Findings emit at ≥50% drop (`severity: warn`); alert at ≥75%.
  K-anonymity threshold of 30 — populations below that produce an
  explicit `under-threshold` finding rather than noise.

Both modules are pure read-only queries; they have no outbound
surface and cannot trigger per-user messaging. This is enforced
constitutionally in the owning specialist manifests (onboarding-
specialist and retention-specialist; see
[`agents/CUSTOMER-LIFECYCLE.md`](./agents/CUSTOMER-LIFECYCLE.md)).

---

## The four capabilities each role highlights

The same four promises (**Calm, Strategy, Focus, Compounding**) appear
differently depending on who is looking:

### As a **student** (Priya)

- **Compounding** — the trailing-stats badge at the top of
  `/gate/planned` already reads "You've studied 97 min across 6
  sessions this week." Real seed data, real math.
- **Strategy** — two exams registered, one 7 days out (BITSAT) and
  one 90 days out (JEE Maths). Request a 60-minute plan — the
  multi-exam planner proximity-weights the close exam.
- **Focus** — content bundle loads offline after first sync.
  One-tap recall of saved templates (commute / morning / weekend).
- **Calm** — no streaks, no guilt pings, no re-engagement logic.
  Miss a day (Aditya already has) → no shame UI.

### As a **teacher** (Kavita)

- Roster of 2 students (Priya + Rahul) visible at `/api/teacher/roster`.
- Per-student progress views — you can open each student's plan
  history, error-patterns page, etc.
- Push a concept to a student's review queue via `push-to-review` —
  it appears in their notebook next time they sign in.
- No view into other teachers' students — role boundary is structural.

### As an **admin** (Arjun)

- User admin: list every user, promote/demote, assign teachers.
- Content admin: browse the exam library, inspect exam adapters,
  trigger content refresh.
- Campaign dashboard: run / retire / check drift on public articles.
- Feedback triage: pending clusters, route to authoring or verification.
- Everything at `/gate/admin` and `/gate/content-admin`.

### As the **owner** (Nisha)

- Everything admins can do, plus:
- Transfer ownership (to another user).
- Constitutional authority — read-only but system-wide.
- See the demo-usage log of every tester who has touched the demo.
- `/gate/user-admin` is the entry point.

---

## BYOK — full functionality without shipping our keys

Most of the demo works with zero API keys — planning, templates,
trailing stats, admin views, teacher roster. A few features call a
live LLM: the AI tutor chat, photo-snap problem analysis, explainer
generation, the admin's `narrate-strategy` / `summarize-health` /
`suggest-next-action` tools.

For those, **every demo user can plug in their own provider key**:

1. Sign in as any role (student gives the richest BYOK UX).
2. Open `/gate/llm-config`.
3. Pick a provider (Gemini / Claude / OpenAI / Groq / OpenRouter / Ollama).
4. Paste the key, click **Validate**.
5. Done — chat, Snap, and explainers now use live LLM.

Keys stay in `localStorage`. The backend receives them only as
request headers and never persists them. This is the design:
**student pays the LLM directly, we don't sit in the middle**.

A full matrix of which features need which keys is published at
`/demo-api-keys.html` (visible without login).

---

## Data logging back to the owner

Every demo session is logged. The log is **owner-visible only**.

**What gets logged:** demo-user id, event code (e.g. `seed.user-created`,
`http.POST /api/student/session/plan`), timestamp, optional structured
detail. No free-text content. No request bodies. No responses.

**Why:** testers want to know their demo session is observable; the
owner wants to see how testers use the product. The log is the
demonstrable proof that cohort analytics can run at the system level
without touching what individual users type.

**Storage:** `.data/demo-usage-log.json` — flat file, append-only,
trimmed to last 1000 entries.

**Reading it:**

```bash
npm run demo:log              # last 50 events, newest first
npm run demo:log -- --all     # everything in the log
npm run demo:log -- --summary # aggregate counts, no per-event list
```

Example output:

```
Demo usage log
────────────────────────────────────────────────────
  total events: 10
  first:        2026-04-24T01:30:12.341Z
  last:         2026-04-24T01:30:14.022Z

  by role:
    student    5
    owner      2
    admin      1
    teacher    1
    unknown    1

  by event kind:
    seed.user-created    5
    seed.plans-written   2
    seed.started         1
    seed.completed       1
    seed.owner-elevated  1
```

**Telling testers:** the role-picker page displays an explicit notice
above the cards: *"Heads up — this session is logged."* It's visible
every time anyone opens the demo.

**Opting out:** there is no opt-out inside the demo; it's a demo
session, everyone who uses it accepts the logging. For a production
deployment, the CDO department's `telemetry-manager` enforces
k-anonymity and PII-free aggregation
(see `agents/_shared/gbrain-integration.md`).

---

## Hosting — running this for a team, not just yourself

Full guide in [`demo/HOSTING.md`](./demo/HOSTING.md). Four paths
covered:

| Path | Effort | Persistent data | URL |
|---|---|---|---|
| **Local** | 0 min | Yes (your disk) | `http://localhost:3000` |
| **Render** | 10 min | With paid disk add-on | `https://<your-app>.onrender.com` |
| **Railway** | 5 min | Yes (volumes default) | `https://<your-app>.up.railway.app` |
| **Fly.io** | 15 min | Yes (mounted volumes) | `https://<your-app>.fly.dev` |
| **Docker** | any | Via `-v` volume mount | Wherever you run it |

A `demo/Dockerfile` is bundled and tested. It builds frontend + backend
into one image; the container runs the seed + serve on boot.

---

## Via Telegram or WhatsApp — not just the browser

The role-picker at `/demo.html` is the easiest path, but Vidhya was
designed to reach students on the channels they already use. Demo
testers can message the product on Telegram or WhatsApp too — with
their real chat account mapped to any seeded demo user.

This path is **genuinely more complex than the web demo**:
it requires real bot credentials (from @BotFather and Meta) and a
publicly reachable URL for webhooks. Full guide in
[`demo/CHANNELS.md`](./demo/CHANNELS.md).

**Operator quickstart:**

```bash
# 1. Get a Telegram bot token from @BotFather and a public URL
#    (via ngrok for local, or Render/Railway/Fly for hosted)
export TELEGRAM_BOT_TOKEN="7112345678:AAE…"
export PUBLIC_URL="https://<public-domain>"

# 2. Verify credentials and get exact webhook URL + next steps
npm run demo:channel-setup

# 3. Register the webhook with Telegram (command printed by step 2)
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
     -d "url=$PUBLIC_URL/api/channels/telegram/webhook"

# 4. Start the backend with the bot token in the env
npm run demo:start

# 5. Bind your own Telegram user id to a demo role
#    (Use @userinfobot on Telegram to find your numeric id.)
npm run demo:channel-link -- --role=student-active \
    --channel=telegram --id=<your-tg-user-id>
```

Message the bot; the conversation arrives server-side as Priya
Sharma. Same pattern for WhatsApp — `demo/CHANNELS.md` documents
both.

**What works, what doesn't:**

| Capability | Telegram | WhatsApp |
|---|---|---|
| Text chat with the demo tutor | ✓ (needs server-side LLM key) | ✓ (same) |
| Photo upload for Snap problem analysis | ✓ | ✓ |
| Scheduled daily-problem push | ✓ | ✓ |
| Role switching via `/demo-as <role>` | pattern in `CHANNELS.md` | same |
| Inline buttons | ✓ keyboard | limited (list messages) |
| Per-user BYOK | ✗ server-side key only | ✗ same |

**The BYOK caveat.** In the web demo, each tester's LLM key stays in
their browser. Messages on Telegram/WhatsApp arrive at the server,
which means chat responses use the server-side default provider
(`VIDHYA_LLM_PRIMARY_PROVIDER` + matching `*_API_KEY`). That key is
paid for by the demo operator. Budget accordingly; the admin
dashboard's usage panel shows spend.

**The hosting dependency.** Both channels require HTTPS webhooks.
localhost will not work — Telegram and Meta both reject non-public
URLs. Either use ngrok (local dev) or deploy to any of the
hosting paths in `HOSTING.md`. Full matrix of options in
`CHANNELS.md`.

---

## API keys — the full matrix

Full table at `demo/API-KEYS.md`, or open `/demo-api-keys.html` in the
running demo.

| Category | Works without key | Needs which key |
|---|---|---|
| Session planner | ✓ | — |
| Trailing stats | ✓ | — |
| Exam profile | ✓ | — |
| Templates + presets | ✓ | — |
| Notebook | ✓ | — |
| Admin / teacher views | ✓ | — |
| Content bundle | ✓ (tier-0 cached) | — |
| AI tutor chat | — | any LLM provider |
| Photo-snap analysis | — | Gemini / Claude / OpenAI (vision) |
| Explainer generation | — | any LLM |
| Admin agent tools | — | any LLM |
| Wolfram-verified maths | — | `WOLFRAM_APP_ID` |
| Telegram delivery | — | `TELEGRAM_BOT_TOKEN` |
| WhatsApp delivery | — | WhatsApp Cloud API |

Every feature that *needs* a key degrades gracefully. The absence of
`WOLFRAM_APP_ID` downgrades maths verification from "proven correct"
to "LLM-checked". The absence of any LLM key disables chat but keeps
everything planning-related fully functional.

---

## Automated verification

```bash
npm run demo:verify
```

Probes each role's JWT against its role-specific endpoints:

```
Multi-role demo verification

  ✓ tokens loaded: owner, admin, teacher, student-active, student-light, student-new
  ✓ backend reachable at http://localhost:8080

── owner ────────────────────────────────────────
  ✓ owner lists 6 users

── admin ────────────────────────────────────────
  ✓ admin can list users
  ✓ admin can fetch dashboard summary

── teacher ──────────────────────────────────────
  ✓ teacher roster: 2 students

── student · active (Priya) ─────────────────────
  ✓ Priya: 2 registered exams
  ✓ Priya trailing stats: 97 min / 6 sessions
  ✓ Priya: 3 saved templates
  ✓ Priya live plan: 3 actions, 15 min

── student · light (Rahul) ──────────────────────
  ✓ Rahul: 1 registered exam
  ✓ Rahul: 2 plans in history

── student · new (Aditya) ───────────────────────
  ✓ Aditya: empty profile (first-time-UX)

── demo telemetry ───────────────────────────────
  ✓ demo log: 10 events across 5 roles

═════════════════════════════════════════════════
All 13 checks passed. Multi-role demo working end-to-end.
```

No browser, no clicks, no sleep statements. The script hits real HTTP
routes with real JWTs. Confidence that the verify passes IS confidence
that the demo works for every role.

---

## Resetting between test runs

```bash
npm run demo:reset   # clear seed data + tokens + landing pages + log
npm run demo:seed    # re-seed from scratch
```

---

## Commands, consolidated

```bash
# First time
npm run demo:setup             # install deps + seed
npm run demo:start             # boot backend + frontend

# Between test runs
npm run demo:reset             # clean
npm run demo:seed              # reseed
npm run demo:verify            # automated end-to-end check
npm run demo:log               # owner-visible usage log

# Deployment
# see demo/HOSTING.md for Render / Railway / Fly / Docker
```

---

## Full verification — 7 gates

Before shipping the demo to testers, run the full matrix:

| Gate | Command |
|---|---|
| 1 · Backend typecheck | `npx tsc --noEmit` |
| 2 · Frontend typecheck | `cd frontend && npx tsc --noEmit` |
| 3 · Unit tests | `npx vitest run src/__tests__/unit` |
| 4 · Smoke stdio | `npm run smoke:stdio` |
| 5 · Smoke SDK compat | `npm run smoke:sdk-compat` |
| 6 · Agent graph | `python3 agents/validate-graph.py` |
| 7 · Demo verify | `npm run demo:verify` |

All seven passing ≡ the demo is shippable.
