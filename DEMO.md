# Vidhya Demo — walk-through

A **ready-to-test local demo** of Project Vidhya with a pre-seeded
student, two registered exams, a plan history, saved templates, and
practice sessions already in the trailing window.

Designed for you to open the browser and see the four capabilities —
**Calm, Strategy, Focus, Compounding** — working on live data, without
signing up, without Google OAuth, and without any LLM API keys.

---

## One-command start

From a freshly cloned repo:

```bash
npm run demo:setup      # installs deps + builds frontend + seeds data
npm run demo:start      # boots backend + frontend, opens the demo
```

Then open: <http://localhost:3000/demo.html>

That's it. You land on the **Planned Session** page, logged in as the
demo student, with a trailing-stats badge already reading a realistic
number of minutes.

---

## What gets seeded

| Artifact | What's in it | Shows |
|---|---|---|
| Demo user | Priya Sharma (student role) | Auth with JWT, no Google OAuth needed |
| Exam profile | 2 exams — one 7 days out, one 90 days out | **Strategy** — multi-exam planner |
| Plan history | 6 plans over the last 14 days | **Compounding** — trailing stats surface real numbers |
| Saved templates | 3 — commute / morning / weekend | **Calm** — one-tap recall |
| Practice log | Plan executions + 3 ad-hoc entries | **Compounding** — the "this week" badge |

All data lives in flat files under `.data/`. No database. No external service.

---

## The four capabilities — where to click

### 📚 Compounding — *every rep adds to the next*

Open **Planned Session** (`/gate/planned`). Top of the page:

> You've studied **N minutes** across **M sessions** this week.

The N and M come from the seeded practice log. Click any saved
template → the planner generates a fresh plan informed by past activity.

### 🎯 Strategy — *you always know where to focus*

The demo has two registered exams:

- **BITSAT** — 7 days from today → revision-heavy plans
- **JEE Main Maths** — 90 days from today → base-building plans

In **Exam Profile** (`/gate/exam-profile`) you'll see both. Go back to
Planned Session and request a 60-minute plan — the multi-exam planner
splits the budget by exam proximity (the close exam gets the lion's
share of minutes).

### 🧘 Calm — *you study from strength, not fear*

- No streak counter anywhere
- No re-engagement notification
- Miss a day → no shame UI; just "pick a template when you're ready"
- 3 saved templates ready for one-tap use
- Preset cards (the dotted-border ones) for instant adoption

### 🌍 Focus — *the quality teaching travels to you*

After the first page load, open DevTools → Network → reload. Most
content requests are served from the pre-built bundle (tier 0 of the
four-tier cascade). Works offline once the first sync completes.

---

## The demo user

| Field | Value |
|---|---|
| Name | Priya Sharma (demo) |
| Email | priya.demo@vidhya.local |
| Role | student |
| User ID | written to `demo/demo-token.txt` metadata |

The JWT for this user is in `demo/demo-token.txt`. The bootstrap page
at `/demo.html` sets it in `localStorage` automatically. If you need
to manually authenticate a different tab or tool, the header is:

```
Authorization: Bearer <token>
```

---

## Manual setup (if you prefer explicit control)

If `npm run demo:setup` isn't right for your setup:

```bash
# 1. Install dependencies
npm install
cd frontend && npm install && cd ..

# 2. Build the frontend (optional — skip if using vite dev server)
cd frontend && npm run build && cd ..

# 3. Set the JWT secret (must match the seed script's default)
export JWT_SECRET="demo-secret-for-local-testing-only-min-16ch"

# 4. Seed demo data
npm run demo:seed

# 5. Start the backend (port 8080)
npm run dev:server &

# 6. Start the frontend (port 3000, proxies /api to 8080)
cd frontend && npm run dev
```

Open <http://localhost:3000/demo.html> and you're in.

---

## Verifying the demo works (for automated testing)

If you want to verify the demo pipeline from a script:

```bash
# 1. Seed
npm run demo:seed

# 2. Start backend in background
export JWT_SECRET="demo-secret-for-local-testing-only-min-16ch"
npm run dev:server &
SERVER_PID=$!
sleep 3

# 3. Use the minted token to probe a protected endpoint
TOKEN=$(cat demo/demo-token.txt)
curl -sS -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/student/session/trailing-stats \
  | python3 -m json.tool

# Expected: JSON with trailing_7d_minutes > 0

# 4. Clean up
kill $SERVER_PID
npm run demo:reset
```

---

## Resetting between test runs

```bash
npm run demo:reset   # removes all seeded files
npm run demo:seed    # re-seeds from scratch
```

The reset also removes `frontend/public/demo.html` and
`demo/demo-token.txt`.

---

## What you're actually testing

This demo exercises the **shipped** product, not a simplified mock.
Every capability it shows maps to real code:

| What you see | What's running | Doc |
|---|---|---|
| Multi-exam planner | `src/session-planner/planner.ts#planMultiExamSession` | `PLAN-gbrain-mvp.md` |
| Trailing-stats badge | `src/session-planner/practice-session-log.ts` + `attention/store.ts` | Sourced from `.data/practice-sessions.json` |
| Template presets | `src/session-planner/template-presets.ts` | 5 curated starters, one-tap adoption |
| Exam profile | `src/session-planner/exam-profile-store.ts` | Registered exams drive planning |
| Auth + JWT | `src/auth/jwt.ts` + `src/auth/user-store.ts` | Real HS256 tokens, no OAuth needed |

The agent organisation (`agents/ORG-CHART.md`) is the conceptual model
behind all of this — *planner-manager* owns the planning surface,
*student-model-manager* owns the trailing stats, and so on.

---

## Troubleshooting

**The demo page shows the sign-in wall instead of logging in.**
The bootstrap page tried to set localStorage before the frontend
loaded. Refresh. If that fails, the JWT might have expired
(30 days). Re-seed:

```bash
npm run demo:reset && npm run demo:seed
```

**curl returns 401 Unauthorized.**
The `JWT_SECRET` environment variable isn't set on the server to
the same value the seed script used. Either start the server with
`demo/start.sh` (which sets the right secret), or export it
yourself:

```bash
export JWT_SECRET="demo-secret-for-local-testing-only-min-16ch"
```

**The trailing-stats badge says 0 minutes.**
The practice log wasn't seeded. Re-run `npm run demo:seed` and
confirm `.data/practice-sessions.json` contains entries.

**The planner returns "no exam profile found".**
The exam-profile store wasn't seeded. Check `.data/student-exam-profiles.json`
exists. If not, re-seed.

**The frontend dev server fails to start.**
Dependencies haven't been installed:

```bash
cd frontend && npm install
```

---

## Full verification — 6 gates

Before shipping anything, run the full verification matrix
documented in [`docs/08-testing-guide.md`](./docs/08-testing-guide.md):

```bash
npx tsc --noEmit                          # backend typecheck
(cd frontend && npx tsc --noEmit)         # frontend typecheck
npx vitest run src/__tests__/unit         # unit tests
npm run smoke:stdio                       # MCP stdio transport
npm run smoke:sdk-compat                  # MCP SDK compat
python3 agents/validate-graph.py          # agent graph invariants
```

All six passing ≡ the product is shippable.
