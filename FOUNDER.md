# FOUNDER

> The runbook for running Vidhya as a solo founder. What tools, in what order, for what purpose, with cost estimates. The code in this repo handles the product — this doc handles the business.

This file does not pretend to be a marketing curriculum. It's a *running list of decisions* a solo founder will need to make, with the answers I'd give if I were starting today. Honest about the trade-offs. Skip sections you don't need.

---

## The honest framing

Almost nothing a solo founder needs lives in this codebase. A "marketing module" written in TypeScript would be a worse Mailchimp. A "revenue module" would be a worse Stripe. A "support module" would be a worse Plain or Crisp.

What the codebase *does* is:

1. Make sure your business stack has clean places to plug in (the `src/operator/` module — payments adapter, analytics adapter, founder dashboard endpoint)
2. Document what to plug in, what it costs, and why

Everything else is configuration of external tools. This doc has the configuration.

---

## The stack — what to use, what it costs, why

| Concern | Recommended | Free tier OK? | Lock-in | Why this one |
|---|---|---|---|---|
| Hosting (backend) | [Render](https://render.com/) free tier | Yes (750 hrs/mo) | Low — runs Node, swap in 30 min | Already wired via `render.yaml`. One-click deploy |
| Hosting (frontend) | [Netlify](https://netlify.com) free tier | Yes | Low — static SPA | Edge CDN, branch previews, instant rollback |
| Domain | [Cloudflare Registrar](https://cloudflare.com) | $0 + at-cost | Low | At-cost pricing, free DNS |
| TLS | Let's Encrypt via Render/Netlify | Yes | None | Auto-renewal |
| Email (transactional) | [Resend](https://resend.com) — 3000/mo free | Yes | Low | Cleanest API; swap to Postmark later if needed |
| Auth | This codebase + Google OAuth | Yes | None — built in | Already implemented |
| Payments | [Stripe](https://stripe.com) | Pay-per-tx (2.9% + $0.30) | Medium | Standard. Razorpay if India-only |
| Analytics | [Plausible](https://plausible.io) ($9/mo) OR local JSONL | Free local | None | Privacy-respecting, no cookie banner |
| Errors | [Sentry](https://sentry.io) free tier (5k events/mo) | Yes | Low | The rest of your time goes to fixing real errors. Knowing which ones is the first step |
| Status page | [BetterStack](https://betterstack.com) free tier | Yes | None | A status page you can point users at when things break |
| Support inbox | [Plain](https://plain.com) free tier OR a `support@` email forwarded to your personal inbox | Yes | Low | At founder scale, an email address is a support system |
| Newsletter / drip | [Buttondown](https://buttondown.email) ($9/mo) OR ConvertKit free tier | Yes | Low | Send the launch email, send updates, that's it |
| Community | Discord OR a private Telegram group | Yes | Low | Where students hang out and you watch |
| Repo / CI | GitHub free tier | Yes | None | Already there |

**Total floor cost** (free tiers everywhere): **$0**
**Realistic monthly cost** with one paid tool each (Plausible + a real status page): **~$20**
**At ~50 paying users**: Stripe fees become the biggest line item; everything else still on free tiers.

The principle: **don't pay for tools until they save you more time than you spend evaluating alternatives**. Free tiers are usually fine for a first hundred users.

---

## Day-1 checklist

If you cloned this repo today and want to ship something users could actually use:

```
[ ] Click the Render Deploy button — get a live URL in 5 minutes
[ ] Set GEMINI_API_KEY (free tier, https://aistudio.google.com)
[ ] Set JWT_SECRET to a 32+ random char string
[ ] Run `bash scripts/update-readme-url.sh https://your-url.onrender.com` to commit the URL
[ ] Buy a domain at Cloudflare ($10/yr); point CNAME to Render
[ ] Set up Google OAuth — go to console.cloud.google.com, create credentials, paste GOOGLE_OAUTH_CLIENT_ID
[ ] Tweet / post on r/learnmath / share with one IRL student — get one user
[ ] Watch them use it. Take notes. Don't ship features without watching at least one user use the current ones
[ ] Bookmark `/gate/admin/founder` on your auto-promoted admin account — single-screen dashboard with users, revenue, activity, LLM cost, module health
```

Total time: ~1 hour. Total cost: $10 (domain).

---

## Marketing — what actually moves the needle

There is no founder advice that won't be wrong for someone. What's worked for similar products:

**Channels worth trying** (rough order of leverage, will vary):

- **Reddit communities** — r/learnmath, r/IndiaInvestments-type subs (whatever exam you're targeting). Be a useful person before you're a vendor. Ban-fast on direct promotion in most subs.
- **YouTube tutorials** — long-tail SEO. One good video on "how to solve X" with your app shown solving it gets ~50 sign-ups over a year. Compounding.
- **Direct outreach to teachers / tutors** — they have students, you have a product. Free tier for them; they tell their students.
- **WhatsApp / Telegram groups** — exam prep groups already exist. Join 3, contribute, mention your tool when relevant.
- **Hacker News** — once. Show HN posts work for technical products, less so for student-facing ones. Don't burn your one shot on a half-finished product.

**Channels that probably won't work for you yet**:

- Google Ads (no LTV data, can't justify CAC)
- Influencer partnerships ("send the YouTuber a free month" rarely converts)
- LinkedIn ads (B2C consumer ed isn't here)

**What to track**: sign-ups per week, week-over-week. That's it for the first 6 months. You'll know if you're growing or dying. Anything more sophisticated is a distraction at this scale.

---

## Acquisition — the funnel that matters

For a free-tier-first product, the funnel is:

```
   visit homepage → sign up → use it twice → use it weekly
       ↓              ↓            ↓             ↓
     visitor        user      activated      retained
```

Numbers to keep in your head (illustrative; instrument and watch yours):

- Visitor → user: 5-10% if your homepage is clear about what you do
- User → activated (used twice): 30-40% if the first session lands
- Activated → retained (weekly for a month): 15-25% if the product is useful

These compound: 1000 visitors → 75 users → 25 activated → ~5 retained. At those rates, you need 200 visitors per retained user. Marketing's job is bringing those 200 visitors. The product's job is the rest.

**The biggest lever**: time-to-value. The first session must feel useful. The 2 a.m. eigenvalue scene from the README is the test — does a brand-new user actually solve a problem in their first 10 minutes? If not, fix that before fixing anything else.

---

## Strategy — how to decide what to build next

You have one rule: **do the thing that makes the next user successful**.

Not "what would scale to a million users." Not "what's most technically interesting." Not "what would impress a VC." The thing that makes the *next* user — the one who signs up tomorrow — succeed.

Concrete heuristic: **rank every backlog item by how many of your current users it helps**. The item that helps the most users wins. The item that "future-proofs" the architecture loses unless someone is currently breaking the architecture.

**Five questions to ask before building anything**:

1. Has at least one current user complained about this absence?
2. If they did, was it the first or the third thing they complained about?
3. Do I know how to ship this in a week?
4. Will I learn something by shipping this?
5. Can I undo it if it turns out wrong?

Three-yes minimum. Five-yes is a strong signal.

**Things to deliberately NOT build at this stage**:

- A mobile app (the web app is responsive; mobile native is months of work for marginal gain)
- Multi-tenancy (you're not a SaaS yet)
- Onboarding videos (your first 100 users will tolerate a friction-y onboarding)
- A blog (write one post; share it; don't commit to a blog calendar)
- A "scale story" (you're 1 person; "we plan to scale to a million users" is not strategy, it's wishful thinking)

---

## Revenue — when to charge, how, what

**When to charge**: when you have at least 20 active weekly users who would be sad if you turned the product off. Earlier than that, charging blocks signups for data you don't yet need; later than that, you're leaving validation signal on the table.

**How to charge**: simplest is best. Two tiers max — free (limited) and paid (unlimited). Pricing options for the paid tier:

- **$5-10/month** — cheap enough that students self-pay; cheap enough that parents don't argue. India-friendly: ₹399/month is a good round number.
- **$50/year** — bias toward annual to reduce churn arithmetic. Discount of ~30% vs monthly.
- **One-time $29** — a "lifetime" feel that's actually 6-month break-even on Gemini cost. Risky if you have churners; safe if you have committed users.

**What to charge for**: things that cost you money OR things that scale. The chat path costs Gemini tokens — that's your obvious paid feature (free tier: 50 chats/month; paid: unlimited). Library reads are free (zero marginal cost). Studio is admin-only so doesn't apply to students.

**Stripe integration path**:

1. Sign up for Stripe (~10 min). Stripe Connect is unnecessary at this stage.
2. Create a single Product → single recurring Price.
3. Stripe Checkout is enough — don't build a custom payments page.
4. Configure the webhook to POST to `/api/operator/payments/webhook` with header `X-Operator-Webhook-Secret`.
5. Set `OPERATOR_WEBHOOK_SECRET` in your env to match.
6. Webhook payload needs to be normalised to `PaymentEvent` shape — Stripe's raw shape isn't this. The simplest path: a Stripe webhook target that's not your server, but a tiny service like [Hookdeck](https://hookdeck.com) or [n8n](https://n8n.io) that does the mapping, then forwards. OR write a 30-line shim function that takes Stripe's payload and POSTs to `/api/operator/payments/record` (admin-authenticated) with the normalised shape.

That last decision (Hookdeck vs in-process shim) depends on whether you want a no-code path or a in-codebase path. Both work. The in-codebase shim adds 30 LOC; Hookdeck is $0 free tier and zero code.

---

## Operations — you are the on-call

A solo founder is the on-call for everything. Specific things to set up:

**Monitoring**: free UptimeRobot or BetterStack pinging `/api/orchestrator/health` every 5 minutes. If it returns non-200, you get an email/SMS/Telegram. Set this up day 1.

**Errors**: Sentry catches uncaught exceptions and reports the stack. The free 5k events/month is plenty for solo-founder scale. Add the JS SDK to the frontend; add the Node SDK as a wrapper around your error handler in `src/lib/route-helpers.ts` (~20 LOC).

**Status page**: BetterStack free tier gives you a status page at a subdomain (status.yourdomain.com). When something breaks, post there before users tweet about it. Builds trust.

**Backups**: `npm run backup:create` produces a tarball of `.data/`. Cron it daily (or use Render's persistent disk snapshots). Test the restore path quarterly — backups you've never tested don't work.

**Incident response runbook** — you are this. Write down:

- What does "down" mean? (API returns 5xx for 5 consecutive minutes)
- What do you check first? (`/api/orchestrator/health`, Render dashboard, the `/gate/admin/founder` page for the at-a-glance view)
- Who do you tell? (status page; email to active users if more than an hour)
- When do you escalate? (when you've spent an hour without progress, ask for help in your community)

Even a 10-line runbook beats none. Iterate after the first incident.

**The founder dashboard at `/gate/admin/founder`** surfaces the metrics that matter (users, revenue, activity, LLM cost, lifecycle events, module health) on one screen. Bookmark it. The same data is available at `GET /api/operator/dashboard` if you'd rather curl from a script or wire to your monitoring tool.

**Lifecycle events** are recorded automatically into `.data/analytics.jsonl` whenever a user signs up, links a channel (Telegram/WhatsApp), or has their role changed by an admin. The dashboard's "Lifecycle events (30d)" section shows counts; the raw JSONL has full attribution (which actor changed which user, what email domain signed up, etc.). PII-aware by default: email is never stored in events, only the domain.

**Pipe events to PostHog** by setting `POSTHOG_API_KEY` (your project token, starts with `phc_`) and optionally `POSTHOG_HOST` (defaults to `https://us.i.posthog.com`; use `https://eu.i.posthog.com` for EU or your self-hosted URL). Events dual-write to both PostHog AND the local JSONL by default — the dashboard keeps reading from local-fast storage; PostHog gets the same events for funnel / cohort / retention analysis. Set `VIDHYA_ANALYTICS_DISABLE_LOCAL=true` to skip the JSONL mirror (PostHog-only mode; the dashboard's lifecycle card will be empty in that mode). No retry on PostHog 5xx — events buffered in-memory at the moment of crash are lost from PostHog's perspective (still in JSONL); for at-least-once delivery use PostHog's official Node SDK. For other tools (Plausible, Segment, Mixpanel), implement the `AnalyticsAdapter` interface in a new file and update the selector at `src/operator/analytics-selector.ts`.

---

## Support — at solo-founder scale

A `support@yourdomain.com` email forwarded to your inbox is a support system. Skip ticket trackers until you have more than 30 messages a week.

Reply to every message in 24 hours, even just "thanks, looking into this." Users at this scale value the human reply more than the speed of the fix.

Build a FAQ from the questions you get more than twice. Pin it in a /help page. Update it weekly.

When you turn down a feature request, do it in person (in the reply). "I won't build this because <reason>" is more respectful than silence. Some users will leave; that's data.

---

## Dependencies — what depends on what

The codebase has explicit dependencies declared in `modules.yaml`. Each module declares `depends_on: [...]`. This is the truth-source.

Cross-cutting external dependencies the founder picks up:

```
                   ┌─────────────────────────────────────┐
                   │                                     │
                   │           Vidhya codebase           │
                   │                                     │
                   │   ┌──────────────────────────┐      │
                   │   │ src/operator/ (payments, │      │
                   │   │ analytics, dashboard)    │      │
                   │   └─────┬────────┬───────────┘      │
                   │         │        │                  │
                   └─────────┼────────┼──────────────────┘
                             │        │
              webhook        │        │   recordEvent
        ─────────────────────┘        └─────────────────
                             │        │
                             ▼        ▼
                     ┌──────────┐  ┌──────────┐
                     │  Stripe  │  │ Plausible│   ← Founder's external accounts
                     └──────────┘  └──────────┘
                             │
                             │
                     ┌──────────────────────────────┐
                     │ Other external dependencies: │
                     │  - Render (hosting)          │
                     │  - Cloudflare (DNS)          │
                     │  - Resend (email, optional)  │
                     │  - Sentry (errors, optional) │
                     │  - BetterStack (status)      │
                     │  - GitHub (repo, CI)         │
                     │  - Gemini (LLM)              │
                     │  - Wolfram (verification)    │
                     └──────────────────────────────┘
```

**Critical-path dependencies** (system breaks if down):

- Render (the host) — fallback: deploy to a $5 VPS in 30 minutes
- Gemini API — fallback: chat returns 503 with a clear message; the rest of the app works
- The repo itself (GitHub) — fallback: GitHub uptime is high enough that this isn't a real risk
- Your domain registrar — fallback: usually fine; transfer takes a week if it goes wrong

**Convenience dependencies** (system degrades if down):

- Stripe — payments stop accepting; existing customers keep their access via the local-jsonl record
- Plausible / analytics — you have less data temporarily
- Resend / email — transactional emails don't go out; users see in-app instead
- Sentry — you don't see errors as they happen; logs still in Render
- BetterStack — your status page is less pretty

**Setup-time dependencies**:

- Cloudflare for DNS (set up once, forget)
- GitHub for the repo (already there)
- A computer with Node 22 (you've got this)

The principle: **every external dependency should fail soft**. A solo founder can't be the on-call for 8 vendors. The codebase already does this for Gemini and Wolfram (graceful degradation table in PRODUCTION.md). The same pattern applies to the founder stack.

---

## Anti-patterns to avoid

Honest list of things solo founders waste time on:

- **Over-architecting for scale you don't have**. You have 0 users today. Architecting for 100,000 is a procrastination strategy.
- **Premature monetization**. Charging before validating that people want the thing leads to wrong product calls.
- **Premature platforming**. Building "for institutions" before you have one institution interested.
- **Designing the perfect logo / colour palette / brand book**. Use a default-Tailwind look. Iterate when you have signal.
- **Picking the perfect tech stack**. You picked one. It works. Move on.
- **Reading too many other founder blog posts** (yes, including this one). Read enough to make a decision; then make the decision.
- **Counting users before the floor**. "I'd be happy at 100 users" before you have 1 is fantasy. Pick the next 10.
- **Hiring**. You don't have product-market fit. Hiring delays the search; it doesn't help.

---

## What's NOT in this doc

- Specific marketing copy (depends on positioning, your voice, your channel)
- Specific pricing for your geography (do market research)
- Legal stuff (you'll need terms of service, a privacy policy — get a template, get it reviewed)
- Tax stuff (talk to an accountant in your country once you're earning enough that it matters)

---

## Where this doc fits

- [README.md](./README.md) — the product pitch
- [OVERVIEW.md](./OVERVIEW.md) — what Vidhya is and who for
- [DEPLOY.md](./DEPLOY.md) — getting it live
- [PRODUCTION.md](./PRODUCTION.md) — what's production-ready
- **FOUNDER.md (this file)** — running the business around the product

If a real-world experience shows any advice in this doc to be wrong, a PR with the correction is welcome. Founder advice ages fast; what worked in 2024 may not work in 2026.
