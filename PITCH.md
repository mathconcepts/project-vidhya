# Project Vidhya — One-Pager

**Cost-minimal, local-first adaptive learning engine.**

Vidhya delivers personalized practice at **~$0.01 per DAU per month** — where
naive LLM-per-request edtech apps cost $2.

---

## The story in three sentences

- **Problem:** Adaptive learning apps spend $1.50–$2.50 per daily active user per month on LLM calls, most of which ask for content that could have been pre-computed once and cached forever.
- **Solution:** A four-tier content cascade (bundle → client RAG → LLM generation → Wolfram verification) where every request flows through the cheapest matching tier, with 80%+ resolved at $0.
- **Result:** 86% cost reduction verified in production, plus a local-first architecture that runs without any external services.

---

## The numbers

| Metric | Value |
|--------|-------|
| Cost per DAU per month | **$0.01–$0.30** |
| Cost reduction vs naive LLM architecture | **86%** |
| Tier-0 hit rate (smoke test) | **83%** |
| Problems Wolfram-verified end-to-end | **6 / 34** |
| Concepts in knowledge graph | **82** |
| External services required to run | **0** |
| First byte of Tier-0 response | **<10ms** |
| Bundle size (CDN-cached) | **82 KB** |

---

## The fourteen moats

1. **Four-tier cascade** — every content request routes to the cheapest source
2. **Client-side embeddings** — transformers.js WASM, zero API cost for RAG
3. **Wolfram-verified content** — computational truth, not LLM hallucination
4. **DB-less runtime** — student state in IndexedDB, no Postgres ops burden
5. **In-browser PDF/DOCX parsing** — student materials never leave the device
6. **6-pillar cognitive model** — Bayesian student model, error taxonomy, ZPD targeting
7. **Attributed content pipeline** — OpenStax, OCW, GATE, math.SE, per-record licensing
8. **Graceful degradation** — works with zero external services, any feature missing
9. **Flat-file observability** — admin dashboards with no DB overhead
10. **Domain-agnostic architecture** — swap the concept graph for any subject
11. **No-nagging UX** — at most one dismissible next-step chip per response, never blocks
12. **Admin-owned curriculum** — per-exam YAML definitions, shared concepts across exams, three-layer guardrails, compounding quality loop
13. **LLM-agnostic (BYO-key)** — 8 providers as data, in-browser setup at `/llm-config`, keys stay in localStorage, 30-second provider switch
14. **Roles & multi-channel** — owner/admin/teacher/student hierarchy, flat-file identity, web + Telegram + WhatsApp under one account, zero new deps

## What's new in v2.8

- **Roles & multi-channel framework** — 4-role hierarchy (owner/admin/teacher/student) with Google OAuth identity, flat-file user directory, JWT sessions — all DB-less
- **First signup = owner bootstrap** — no DB migration, no admin-panel setup; deployment claims itself
- **Three access channels** — web (primary), Telegram bot, WhatsApp Business Cloud API; same identity across all
- **Anonymous flow preserved** — app works without sign-in; auth is additive, not mandatory
- **LLM config framework (v2.7)** — 8 providers as data, BYO-key in-browser at `/llm-config`, cascading role defaults
- **Curriculum framework (v2.6)** — per-exam YAML definitions, shared concept strategy, three-layer guardrails, compounding quality loop

---

## Try it in 60 seconds

```bash
git clone https://github.com/mathconcepts/project-vidhya.git
cd project-vidhya
npm run setup
npm run dev:server
```

Open `http://localhost:8080`. Works immediately with bundled content.

---

## Why now

Three trends converge:

1. **LLM pricing has collapsed** (Flash-Lite at $0.10/M) but edtech costs haven't — the architecture is the expensive part, not the model
2. **Client-side ML has matured** — 22 MB of WebAssembly runs what required a server 5 years ago
3. **Privacy regulation has tightened** — local-first architectures sidestep FERPA/COPPA/GDPR ambiguity

---

## Deep dives

- [README.md](./README.md) — architecture + quick start
- [FEATURES.md](./FEATURES.md) — 23-slide pitch deck, every moat detailed
- [INSTALL.md](./INSTALL.md) — cross-platform installation (Linux, macOS, Windows, Docker)
- [DEPENDENCIES.md](./DEPENDENCIES.md) — canonical dep inventory, tagged Required/Recommended/Optional
- [PLAN-content-engine.md](./PLAN-content-engine.md) — cost math, Wolfram integration rationale

---

## Repo

**https://github.com/mathconcepts/project-vidhya**

MIT licensed. Content attributed per-record. Contributions welcome.

*Vidhya (विद्या) — Sanskrit for knowledge, learning, and the means of attaining it.*
