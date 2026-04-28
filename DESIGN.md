# Project Vidhya — Design

> The *why* behind the structural choices in this codebase. If you've read [OVERVIEW.md](./OVERVIEW.md) you know what Vidhya is and who it's for; this doc explains why it's built the way it is, including the costs each choice imposes. The visual design language lives in [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md).

---

## Design philosophy in one sentence

**Self-hostable by anyone with a laptop, runnable on free-tier hosting, customisable without forking, honest about what works and what doesn't.**

Every other choice in this section follows from one of those four constraints.

## The five load-bearing decisions

### 1. Flat-file persistence, not a database

Vidhya stores all user data in `.data/*.json` files, written via atomic tmp+rename. There is no Postgres, no Mongo, no SQLite by default.

**Why:**
- A self-hoster can clone the repo, run `npm install && npm run demo:seed`, and have a working multi-user system in 90 seconds. Adding a database step kills that.
- Free-tier cloud hosting (Render, Oracle Cloud) gives you a writable disk easily; managed Postgres on the same tiers is more friction.
- Backups are a `tar` away. Migrations are a script over JSON. State is grep-able.
- The complete data model is ~7 JSON files (users, plans, exam profiles, practice sessions, vector store, …) and stays under a few MB for the demo seed.

**What it costs:**
- Concurrent writers serialise through Node's event loop. This works because Node is single-threaded; it would not survive a multi-process deployment without changes.
- Beyond ~10,000 users, range queries get slow. The fix is to swap `src/lib/flat-file-store.ts` for a Postgres-backed implementation, which the rest of the system is structured to allow without touching call sites.
- Cloud Run-style stateless hosts don't fit by default — you'd need a FUSE-mounted bucket or to accept that every cold start re-runs the demo seed (acceptable for a demo URL, not for a real deployment).

### 2. Bring-your-own-key (BYOK) for LLMs

The platform never holds an LLM provider key. The operator (or admin) pastes their OpenAI / Gemini / Anthropic key into `/gate/llm-config` at runtime. Keys live in `.data/llm-config.json` on the host's disk, encrypted-at-rest only if the host disk is encrypted.

**Why:**
- We're not a SaaS. We don't bill for tokens. The deployer pays each provider directly.
- Compliance with India's data-protection norms is simpler when the platform never touches a key that holds payment authority.
- Switching providers is a `POST /api/llm-config` call — no redeploy.

**What it costs:**
- The demo URL has no AI tutor functionality until someone pastes a key. The product copes by making the chat / tutor / snap pages clearly degraded (not broken) when keys are absent.
- We can't pre-train or fine-tune anything — every request is API-call-priced.
- Cost-per-student is bound by what the operator's chosen provider charges; there's no way to subsidise it.

### 3. Module barrels over sub-repo extraction

Vidhya has 11 modules but only 1 sub-repo (`project-vidhya-content`). The rest live in the main repo with explicit module barrels at `src/modules/<name>/index.ts` declaring the public surface.

**Why:**
- Sub-repos are heavyweight: pin files, separate releases, drift between SHAs, cross-repo PRs to ship a coupled change.
- The barrel pattern (`module by re-export`) gives most of the benefits of extraction (clear public surface, mechanical refactor target, future `git subtree split` is trivial) without the operational cost.
- Of the 11 modules, only `content` has a real external contributor surface (community-authored explainers). That's the one that earned a sub-repo.

**What it costs:**
- A future operator who wants to pin only the auth code at a specific SHA, independent of the rest, can't. They get the whole repo.
- A bug in any module ships in the same release as bug fixes for any other module.
- Some IDEs don't enforce module-barrel-only imports — discipline is conventional, not compiler-checked.

The full argument for keeping each module in-repo lives in commit `ebdf23c` and was a deliberate decision the user signed off on after seeing the trade-off.

### 4. Feature flags as env-var toggles, read once at boot

Module flags (e.g. `auth.google_oidc`, `auth.demo_seed`) are env-var-driven. The module reads `process.env` once at boot, exposes sync getters, and never re-reads.

**Why:**
- Flipping a flag is exactly the kind of thing that should require operator oversight (env-var change + redeploy), not in-band toggling via API.
- Runtime mutation of auth flags is the kind of feature that turns into a CVE.
- Reading once at boot keeps the hot path zero-cost.

**What it costs:**
- No A/B testing of flag states across the same user population — flags are deployment-wide.
- A wrong flag value at boot means a redeploy to fix. Acceptable for ops scenarios; less convenient for development.
- The feature matrix at `/gate/admin/features` is read-only; operators get visibility but not direct control.

### 5. Google OIDC as the only auth path (today)

There is no username/password login, no email magic link, no SAML, no API tokens. Sign-in goes through Google. The flag `auth.google_oidc` exists; flipping it off without an alternative means nobody can log in.

**Why:**
- One auth path means one set of edge cases, one set of attack surfaces, one set of password-reset flows we don't have to implement.
- Google's OIDC integration handles 2FA, account recovery, and trust-level decisions that we'd otherwise be writing ourselves.
- The intended audience (Indian college students prepping for entrance exams) overwhelmingly has a Google account already.

**What it costs:**
- Corporate / government deployments that ban Google sign-in can't run Vidhya as-is. They'd need to add an OIDC provider integration (Microsoft, Auth0, GitHub) — the auth module's structure makes this straightforward but it's a real PR.
- Anonymous / signup-less product trial isn't possible. Every visitor either signs in or is gated.

This is a soft commitment. The brainstorm in commit `ebdf23c` explicitly noted that adding password login or other OIDC providers would be a clean extension, not a rewrite, *if* the user need ever materialises.

## What we deliberately reject

For each, the cost of the alternative tipped the scale:

| Tempting alternative | Why we don't do it |
|---|---|
| Microservices | Operationally incompatible with "self-hostable on free-tier infra." |
| GraphQL | The API surface is small and route-based; GraphQL adds tooling cost without solving a problem we have. |
| Server-side rendering / Next.js | We have static SEO pages from the backend Node process; a separate Next.js layer would multiply build complexity. |
| Tailwind generated stylesheet | Compiling Tailwind requires a build step in artifacts that need to be portable — pre-defined utility classes only. |
| Real-time / WebSocket-first UX | Polling at sane intervals satisfies the actual product need without the connection-state complexity. |
| Database-backed sessions | Same reason as flat-file persistence — the cost of a DB outweighs the benefit for the demo path. |
| Generic permissions strings (listmonk-style) | Already covered: no concrete consumer needs the granularity yet. The role-rank check covers all current routes. |

## What's open for change

The decisions in [§"The five load-bearing decisions"](#the-five-load-bearing-decisions) are stable. These are explicitly *not* stable and the current shape is provisional:

- **The `institution` role**. Type-system scaffolding only; the multi-tenant tenancy model isn't designed yet (PENDING §9).
- **The customer-lifecycle agents**. 4 specialists exist as code; the end-to-end flow isn't wired.
- **The 6 deployment profiles**. They evolved with shipping needs; expect them to be refactored as new tiers land.
- **The agent org chart's 4-tier shape**. Currently 56 agents in 4 tiers; this is convention, not architecture.

If you want to change one of these, do — file an issue, send a PR. If you want to change one of the five load-bearing decisions, that's a much heavier conversation; expect to write a doc explaining the new trade-offs.

## A note on the agent org chart

The codebase ships with a fictional 56-person org chart (CEO, 6 C-suite, 17 managers, 32 specialists). It exists for two reasons:

1. **Conceptual modelling**: it forces clear ownership for every module and tier. Agents are the layer at which we ask "who designed this and who maintains it." See [`agents/ORG-CHART.md`](./agents/ORG-CHART.md).
2. **Future automation**: the constitution at [`agents/_shared/constitution.md`](./agents/_shared/constitution.md) is shaped so individual agents can later be implemented as LLM-driven sub-systems. None of them are today.

The org chart is *not* required to read or contribute to Vidhya. If it confuses you, ignore it; the 11 modules and the file layout in [LAYOUT.md](./LAYOUT.md) are what matter.

## Where this doc came from

This file is a master. It restates and consolidates design language that's also present in:
- [`MODULARISATION.md`](./MODULARISATION.md) — the module/tier/profile registry
- [`PENDING.md`](./PENDING.md) — the staged plan
- Commit messages on `5b4a238`, `d17a365`, `ebdf23c`, `dd7dc2f` — the running recap of trade-offs taken in flight
- [`agents/_shared/constitution.md`](./agents/_shared/constitution.md) — agent-level operating principles

If you want the architectural breakdown of *what* runs where, read [ARCHITECTURE.md](./ARCHITECTURE.md). If you want the file-tree map, [LAYOUT.md](./LAYOUT.md).
