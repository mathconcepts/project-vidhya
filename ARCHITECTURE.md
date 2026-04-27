# Project Vidhya — Architecture

> The *how*: modules, deployment topology, data flow at runtime. Read [DESIGN.md](./DESIGN.md) first for the *why*. The module registry is canonical at [`modules.yaml`](./modules.yaml); this doc is the human-readable companion.

---

## The 9 modules

Every directory under `src/` belongs to exactly one module. Modules can depend on other modules; the dependency graph is a DAG, validated at boot in [`src/orchestrator/registry.ts`](./src/orchestrator/registry.ts).

| Module | Source dirs | Foundation? | Sub-repo? | Purpose |
|---|---|---|---|---|
| **core** | `src/lib`, `src/utils`, `src/events`, `src/constants`, `src/services` | yes | no | Shared library layer. Response helpers, event bus, time/string utils. Every other module depends on it. |
| **auth** | `src/auth`, `src/modules/auth` | yes | no | User identity, role/permission model, JWT, Google OIDC, flat-file user store. Public surface at `src/modules/auth/index.ts`. |
| **content** | `src/content`, `src/content-pipeline`, `src/curriculum`, `src/syllabus`, `src/exam-builder`, `src/samples`, `src/sample-check` | no | **yes** | Sources → acquisition → authoring → verification → routing. The community-contributed half lives at [`modules/project-vidhya-content/`](./modules/project-vidhya-content/), pinned via `content.pin`. |
| **rendering** | `src/rendering`, `src/explainer`, `src/snap-solve` | no | no | Lesson rendering, explainer pipeline, snap-a-photo OCR. |
| **channels** | `src/channels`, `src/channels-runtime` | no | no | Telegram + WhatsApp adapters, channel link tokens. |
| **learning** | `src/session-planner`, `src/spaced-repetition`, `src/mastery` | no | no | Daily plan, study commander priority engine, spaced repetition, mastery tracking. |
| **exams** | `src/exam-engine`, `src/proctored` | no | no | Exam adapters (BITSAT, JEE Main, UGEE, NEET), proctored mode, scoring. |
| **lifecycle** | `src/lifecycle`, `src/data-rights`, `src/jobs` | no | no | Funnel + retention specialists, GDPR-style data rights (export/delete), in-process job scheduler. |
| **orchestrator** | `src/orchestrator` | no | no | Module registry, profile composer, health probes, feature aggregation. |

`core` and `auth` are **foundation modules** (`foundation: true` in `modules.yaml`). They're implicit dependencies of every other module — a tier doesn't need to list them in `modules:`, the composer auto-includes them.

## The 20 tiers

Tiers are activatable capabilities composed from one or more modules. A tier is the unit of "this feature exists in this deployment."

The full list lives in [`modules.yaml`](./modules.yaml) under the `tiers:` section. The current census:

| Status | Count | Examples |
|---|---|---|
| `shipped` | 9 | `web-app`, `telegram-channel`, `whatsapp-channel`, `web-seo`, `wolfram-live`, `admin-dashboard`, `agent-org-health`, `content-create`, `content-verify` |
| `partial` | 1 | `content-sync` |
| `stub` | 1 | `manim-animation` |
| `planned` | 1 | `parent-guardian-view` |
| `future` | 8 | `institutional-b2b`, `proctored-exam`, `reporting-dashboard`, `language-localisation`, `accessibility`, `api-as-service`, `research-tier`, `blog-video` |

Tier status is observational, not prescriptive. The orchestrator doesn't refuse to activate a `stub` tier; it just lets `/api/orchestrator/health` flag the gap.

## The 6 deployment profiles

Profiles are named tier mixes — what most operators actually pick.

| Profile | Tiers | Use case |
|---|---|---|
| `minimal` | 3 | Free-tier Render deploy, no channels, no Wolfram. The smallest viable Vidhya. |
| `full` | 9 | Everything shipped today. The default for development. |
| `channel-only` | 3 | No web UI; WhatsApp + Telegram only. For chat-first deployments. |
| `institutional-b2b` | 6 | College / coaching-centre multi-tenant deploy (PENDING §9 — partial). |
| `demo` | 4 | The multi-role demo URL — seeded users, BYOK-ready, public. |
| `content-author` | 4 | Content team only — authoring + verification + sync. No student-facing surfaces. |

Profile composition is a transitive closure over the listed tiers' modules + foundation modules. See `composeDeployment` in [`src/orchestrator/composer.ts`](./src/orchestrator/composer.ts).

## Runtime topology

Vidhya is one Node process. There's no service mesh, no message broker, no sidecar.

```
┌────────────────────────────────────────────────────────────────────┐
│   one Node 22 process running tsx-compiled TypeScript               │
│                                                                    │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│   │ HTTP server  │  │  Job         │  │  Channel runtime         │ │
│   │ (gate-server │  │  scheduler   │  │  (Telegram, WhatsApp     │ │
│   │  .ts, port   │  │  (cleanup,   │  │  webhook handlers — only │ │
│   │  8080)       │  │  health,     │  │  if env vars set)        │ │
│   │              │  │  retention)  │  │                          │ │
│   └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘ │
│          │                 │                       │               │
│          └────────┬────────┴───────────────────────┘               │
│                   │ in-process event bus (src/events/signal-bus)   │
│                   ▼                                                │
│          ┌─────────────────┐                                       │
│          │ flat-file store │  (.data/*.json — atomic tmp+rename)   │
│          └─────────────────┘                                       │
└────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                  outbound HTTPS to BYOK LLMs:
                    OpenAI / Gemini / Anthropic
                  (per-deployment, set in /gate/llm-config)
```

What's not in this diagram by design:

- **No database**. The flat-file store is *the* persistence layer.
- **No reverse proxy required**. The Node process binds directly to the host's port. Render's TLS-termination front-end is what makes the public URL HTTPS.
- **No Redis / no cache**. The dataset fits in memory; in-process is the cache.
- **No worker pool**. The job scheduler is in the same process, hooked into the event loop.

## Request lifecycle (a typical POST)

Walking through `POST /api/student/session/plan` as an example:

1. **TLS termination** at the host (Render / Oracle Cloud / wherever) → HTTP/1.1 to port 8080.
2. **Route resolution** in `src/gate-server.ts`'s router — matches `(method, path)`.
3. **Auth check** via `requireAuth` (middleware from the auth module) — validates the JWT, loads the user record from `.data/users.json`, attaches `auth.user` to the request.
4. **Role check** via `requireRole(req, res, 'student')` — fails fast with 403 if the user's role rank is below `student`.
5. **Body parse** — JSON body parser produces the request DTO.
6. **Handler** in `src/api/student-routes.ts` — calls into the learning module (`src/session-planner`).
7. **Module call** → `planSession({student_id, exam_id, ...})` → reads from `.data/exam-profiles.json`, `.data/practice-sessions.json`, etc.
8. **Persistence** — if the handler creates state, it writes through `createFlatFileStore`'s atomic tmp+rename.
9. **Event emission** — `signalBus.emit({type: 'plan.created', ...})` for any subscribers.
10. **Response** via `sendJSON(res, plan)` — the plan returned directly, not wrapped (a documented invariant).

Most routes in the system follow this exact shape. The 113 vitest unit tests cover this lifecycle end-to-end without booting the HTTP server, by calling handlers with synthetic `(req, res)` pairs.

## How the orchestrator fits in

The orchestrator module doesn't *do* anything at request-time. It exposes a control plane:

| Endpoint | Purpose |
|---|---|
| `GET /api/orchestrator/modules` | List all 9 modules + their feature-flag declarations |
| `GET /api/orchestrator/tiers` | List 20 tiers + status |
| `GET /api/orchestrator/profiles` | List 6 profiles + their tier compositions |
| `POST /api/orchestrator/compose` | Given a profile name, return the resolved active modules + required env vars + warnings |
| `GET /api/orchestrator/graph` | The agent org-chart graph (56 agents) |
| `GET /api/orchestrator/health` | Per-module health probes (status: healthy / degraded / unavailable) |
| `GET /api/orchestrator/jobs` | In-process scheduler status |
| `GET /api/orchestrator/signals` | Recent signals on the event bus |
| `GET /api/orchestrator/features` | Per-module feature flag inventory + current state + overridden status |

All admin-only. The corresponding UI lives at `/admin/dashboard` (overview) and `/admin/features` (feature matrix).

## Feature flags

Each module that has flags ships a `feature-flags.ts` file. Currently only `auth` has one; the pattern is:

```ts
// src/modules/<n>/feature-flags.ts
const FLAGS = [
  { flag: 'foo.bar', env_var: 'VIDHYA_FOO_BAR', default: true, description: '…' },
  …
];
const STATE: Record<string, boolean> = readEnvOnce(FLAGS);
export function isFooFeatureEnabled(f: string): boolean { return STATE[f] ?? false; }
export function fooFeatureFlags() { return FLAGS.map(... + overridden status); }
```

Read once at boot. Flipping a flag requires a server restart. Aggregated at `/api/orchestrator/features`. Surfaced in the UI at `/admin/features`. See [AUTH.md](./AUTH.md) for the auth module's specific flag inventory.

## Persistence layout

Every module that persists data does so via [`src/lib/flat-file-store.ts`'s `createFlatFileStore`](./src/lib/flat-file-store.ts). Files in `.data/`:

| File | Module | Shape |
|---|---|---|
| `users.json` | auth | `{users: Record<id, User>, owner_id: string \| null}` |
| `exam-profiles.json` | learning | per-student exam profile state |
| `templates.json` | learning | session-plan templates |
| `plans.json` | learning | generated daily plans |
| `practice-sessions.json` | learning | log of completed practice sessions |
| `vector-store.json` | content | in-memory vector store for RAG (rebuilt at boot from sources) |
| `chat-history.json` | content | per-user chat transcripts with the AI tutor |
| `community-content/` *(directory)* | content | resolved subrepo content (when `content.pin` is `local` or a SHA) |
| `llm-config.json` | (admin route, not module-owned) | provider config + BYOK keys |
| `demo-usage-log.json` | lifecycle | demo telemetry, owner-visible only |

For deployment hosts: as long as `.data/` is on a persistent disk, the flat-file model works. Render's "Persistent Disk" feature is configured in `render.yaml` to mount at `/app/.data`.

## Scaling characteristics

Honest about the ceiling:

- **Read throughput** — limited by JSON parsing on each request; the `users.json` is loaded fully into memory at boot and cached in process. Realistic ceiling: ~500 req/s on a single instance for read-heavy traffic.
- **Write throughput** — limited by atomic tmp+rename + JSON serialise. Realistic ceiling: ~50 writes/s, more than enough for any educational deployment.
- **Concurrent users** — limited by Node's event loop, not the storage. ~10,000 active users on a 512 MB / 1 vCPU box before the JSON files become slow to parse.
- **Beyond 10,000 users** — swap `flat-file-store.ts` for a Postgres-backed implementation. The exported API is stable; call sites don't change.

For the demo URL, the practical ceiling is whatever the host's free-tier hours allow before the service spins down. See [DEPLOY.md](./DEPLOY.md) for current hosting realities.

## What's deliberately not in this doc

- **Visual design.** See [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md).
- **File-tree map.** See [LAYOUT.md](./LAYOUT.md).
- **Why we made these choices.** See [DESIGN.md](./DESIGN.md).
- **What's planned.** See [PENDING.md](./PENDING.md).
- **Auth surface specifically.** See [AUTH.md](./AUTH.md).
- **Content engine internals.** See [CONTENT.md](./CONTENT.md).

This doc is the snapshot of *what's wired right now*. If something here drifts from `modules.yaml` or the running code, the running code wins; this doc has a bug.
