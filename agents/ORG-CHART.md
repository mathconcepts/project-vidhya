# Project Vidhya — The Agent Organisation

Vidhya is a one-person company run by a graph of agents. The CEO agent
sits at the top. Under the CEO, six C-suite officers run departments.
Under each C-suite officer, managers run lanes. Under managers,
specialists do the narrow work.

This document is the canonical reference. Agent manifests in
[`agents/`](./) are authoritative for machine consumers; this document
is authoritative for humans.

## Design goals

- **Modular.** Every agent lives in its own manifest file (or a single
  entry in `specialists/specialists.yaml`). An agent can be added,
  removed, or re-wired without touching the rest.

- **Flexible.** The agent graph is a graph, not a tree. Lateral edges
  (peer queries) and cross-functional delegations exist. A C-suite
  officer in one department routinely queries another to resolve a
  decision.

- **Portable.** Manifests are plain YAML. An orchestrator — Claude
  Agent SDK, MCP stdio runtime, LangGraph, a bespoke router — parses
  the manifests and builds the agent graph in memory. Switching
  orchestrators does not touch the manifests.

- **No functionality changes.** The agent organisation is a structural
  reorganisation of shipped code. Every tool in the `owned_tools` of
  an agent exists in `src/admin-orchestrator/tool-registry.ts`, in
  `src/api/*-routes.ts`, or as an importable module. Nothing is
  aspirational.

## The org chart

```
                                    ┌───────┐
                                    │ CEO   │                (1)
                                    └───┬───┘
                                        │
        ┌───────────┬───────────┬───────┼───────┬───────────┬──────────┐
        ▼           ▼           ▼       ▼       ▼           ▼          ▼
      ┌───┐       ┌───┐       ┌───┐   ┌───┐   ┌───┐       ┌───┐      
      │CPO│       │CCO│       │CTO│   │CDO│   │CMO│       │COO│        (6)
      └─┬─┘       └─┬─┘       └─┬─┘   └─┬─┘   └─┬─┘       └─┬─┘
        │           │           │       │       │           │
        │           │           │       │       │           │
  ┌─────┼────┐      │           │       │       │           │
  ▼     ▼    ▼      │           │       │       │           │
┌───┐ ┌───┐┌───┐    │           │       │       │           │
│ P │ │ T ││ A │    │    [managers under each C-suite]              (17 managers)
└─┬─┘ └─┬─┘└─┬─┘
  │     │   │     (specialists reporting to managers)                (21 specialists)
```

- **CEO** (1) — strategic direction, refusal of off-mission work
- **C-suite** (6) — CPO, CCO, CTO, CDO, CMO, COO
- **Managers** (17) — functional leads, one or more per C-suite
- **Specialists** (21) — narrow operators doing specific jobs

Total: 45 agents. Every one maps to code or tools that already ship.

## The C-suite and their charters

### CPO · Chief Product Officer

Owns everything the student sees and touches — the planner, the
teaching surface, the assessment loop, the feedback loop.

Managers: **planner-manager**, **teaching-manager**, **assessment-manager**,
**feedback-manager**.

Charter: the four core promises (Calm, Strategy, Focus, Compounding)
are student-facing. The CPO holds them at the surface layer.

### CCO · Chief Content Officer

Owns every piece of teachable material that reaches a student —
acquisition, verification, authoring, curriculum integrity.

Managers: **acquisition-manager**, **verification-manager**,
**authoring-manager**, **curriculum-manager**.

Charter: the verified-teaching invariant. No mathematical answer
ships without Wolfram verification or an explicit exemption record.

### CTO · Chief Technology Officer

Owns the platform — the four-tier content cascade, the stateless
Express server, LLM routing, security, the local-first client.

Managers: **infrastructure-manager**, **llm-router-manager**,
**security-manager**.

Charter: the stateless-server and BYO-key invariants. User state on
the device; AI costs to the provider; no analytics table.

### CDO · Chief Data Officer

Owns the student model — the GBrain Bayesian knowledge model,
attention tracking, opt-in cohort aggregation.

Managers: **student-model-manager**, **telemetry-manager**.

Charter: the on-device-first invariant. PII never leaves the device;
opt-in anonymous deltas only.

### CMO · Chief Marketing Officer

Owns outreach — campaigns, public articles, drift detection on the
public marketing surface.

Managers: **outreach-manager**, **seo-manager**.

Charter: marketing fidelity. Every claim is traceable to shipped code
or to `FEATURES.md`. No dark patterns, no inflated claims, no fake
urgency.

### COO · Chief Operations Officer

Owns the agent organisation itself — task queue, health, escalation
policies.

Managers: **task-manager**, **health-manager**.

Charter: no silent drops. Every delegation completes or escalates;
every failure contains at the layer it occurs.

## The graph is a graph, not a tree

Vertical delegation is only one axis. The agent graph carries three
kinds of edge:

- **Vertical** (parent ↔ child) — delegation downward, escalation upward
- **Peer** (same tier) — queries between C-suite officers, between
  managers, between specialists
- **Cross-functional** (across departments) — e.g. feedback-manager
  (under CPO) delegates to authoring-manager (under CCO) when triage
  identifies a concept that needs re-authoring

The cross-functional edges exist because the real work happens across
department boundaries. The org chart names the accountability; the
graph shows the actual flow.

## Communication — one envelope, five channels

All agent-to-agent messages carry the same envelope shape (defined in
[`agents/_shared/communication-protocols.md`](./_shared/communication-protocols.md)).
Five channels cover every legitimate traffic pattern:

| Channel | Direction | Use |
|---|---|---|
| **delegation** | parent → child | "Please do X" |
| **query** | any → any | Read-only lookup |
| **escalation** | child → parent | "I cannot resolve X" |
| **signal** | broadcast | Event bus — any subscriber reacts |
| **response** | reply to delegation or query | Result or error |

Every channel has a typed payload. An orchestrator that supports the
envelope supports every agent.

## Running the org in a real orchestrator

The agent manifests are deliberately runtime-agnostic. Four runtimes
have been thought through:

### Claude Agent SDK

Each agent maps to a sub-agent with its `owned_tools` exposed via the
tool registry. Delegations are `invoke_subagent` calls. The CEO is the
root; the graph is resolved per envelope's `correlation_id`.

### MCP (stdio or HTTP)

Each agent is an MCP server exposing its `owned_tools`. A supervisor
MCP client holds the graph. Messages route as `tools/call` with the
envelope in the arguments. Signals ride on `notifications/*`.

### LangGraph

Each agent becomes a node. Edges in `connections` become LangGraph
edges. The envelope is the state. Delegations are conditional
transitions; signals are published to a shared state channel.

### Bespoke router

Load every YAML in `agents/`. Build a node per agent. Enforce
`owned_tools` as a permission list. Route envelopes by `to`. This is
what the Vidhya MCP server already does under
`src/admin-orchestrator/`.

## How to add a new agent

1. **Name the mission.** One sentence. If you cannot write the mission
   in one sentence, the agent's scope is too broad.
2. **Pick the tier.** CEO, C-suite, manager, or specialist.
3. **Assign a parent.** Every non-CEO agent reports to exactly one
   parent. If a new agent needs two parents, split into two agents.
4. **List owned tools.** Every tool must already exist. No aspirational
   entries.
5. **Map connections.** Name the peers the agent will query, the
   signals it will emit, the signals it will subscribe to.
6. **Write the YAML.** Use
   [`_shared/manifest-schema.md`](./_shared/manifest-schema.md) as
   the reference.
7. **Add the edge from the parent.** The parent's `downstream` list
   gets the new agent's id.
8. **Run the graph validator.** (See below.)

## How to retire an agent

1. Move its `owned_tools` to a peer or to a new agent that absorbs its
   scope. Or mark them retired if they are genuinely unused.
2. Remove its `id` from every manifest's `connections`.
3. Delete the manifest.
4. Run the graph validator.

## Graph invariants

The validator enforces these at load time:

- Every `reports_to` resolves to an existing agent, or is `null`
  (only CEO has null).
- Every `downstream.id`, `upstream.id`, `peers.id` resolves.
- Every `owned_tools[*].id` exists in the project (MCP registry, route
  table, or module index).
- No cycles in the `reports_to` chain.
- No agent has more than 8 direct downstreams (human cognitive limit,
  enforced on agents for orchestrator readability).
- No tool is owned by more than one agent unless it is read-only.
- **GBrain cognitive-spine invariant.** Every cognitively-dependent
  agent must declare at least one `src/gbrain/*` module in its
  `owned_tools`. The cognitively-dependent set — `cdo`,
  `student-model-manager`, `planner-manager`, `teaching-manager`,
  `assessment-manager`, `authoring-manager`, `feedback-manager` — is
  enforced by the validator. See
  [`_shared/gbrain-integration.md`](./_shared/gbrain-integration.md)
  for the full contract.

## GBrain — the cognitive spine

GBrain is not a module that some agents happen to call; it is the
cognitive spine that every cognitively-dependent agent leans on. All
four of the constitutional promises rest on it:

- **Compounding** is GBrain's persistent Bayesian model
- **Strategy** is GBrain's `exam-strategy` + `task-reasoner` modules
- **Focus** is GBrain's `error-taxonomy` + `cross-exam-coverage`
- **Calm** is GBrain's local-first, on-device posture

The eight GBrain modules (`student-model`, `error-taxonomy`,
`task-reasoner`, `problem-generator`, `exam-strategy`,
`after-each-attempt`, `integration`, `cross-exam-coverage`) are wired
into specific agents. Writes flow through a single canonical path —
`after-each-attempt`. Reads are explicit and declared in each agent's
manifest.

The full integration contract, including which agents read, which
write, the signals emitted, and the invariants the validator checks,
is defined in [`_shared/gbrain-integration.md`](./_shared/gbrain-integration.md).

## Agents by department — the full roster

### Under CEO

- [`ceo/ceo.yaml`](./ceo/ceo.yaml) — strategic direction, constitutional
  enforcement

### Under CPO

- [`c-suite/cpo.yaml`](./c-suite/cpo.yaml)
- [`managers/planner-manager.yaml`](./managers/planner-manager.yaml) —
  session plans across exam profiles *(reads GBrain: `student-model`,
  `exam-strategy`, `cross-exam-coverage`, `task-reasoner`)*
- [`managers/teaching-manager.yaml`](./managers/teaching-manager.yaml) —
  explanations, walkthroughs, four-tier content access *(reads GBrain:
  `integration`, `student-model`, `problem-generator`)*
- [`managers/assessment-manager.yaml`](./managers/assessment-manager.yaml) —
  attempt capture, micro-mocks *(writes GBrain via `after-each-attempt`)*
- [`managers/feedback-manager.yaml`](./managers/feedback-manager.yaml) —
  triage and cross-functional routing to CCO lanes *(reads GBrain:
  `error-taxonomy`)*
- Specialists: `session-executor`, `template-curator`, `explainer-
  specialist`, `walkthrough-specialist`, `content-resolver`,
  `attempt-logger`, `mock-exam-builder`, `problem-generator-specialist`
  (GBrain-calibrated problems), `attempt-insight-specialist` (GBrain
  write path)

### Under CCO

- [`c-suite/cco.yaml`](./c-suite/cco.yaml)
- [`managers/acquisition-manager.yaml`](./managers/acquisition-manager.yaml)
- [`managers/verification-manager.yaml`](./managers/verification-manager.yaml)
- [`managers/authoring-manager.yaml`](./managers/authoring-manager.yaml)
  *(reads GBrain: `error-taxonomy` — designs explainers to anticipate
  the 7 specific error categories)*
- [`managers/curriculum-manager.yaml`](./managers/curriculum-manager.yaml)
- Specialists: `scraper-operator`, `licence-checker`, `wolfram-verifier`,
  `sample-reviewer`, `explainer-writer`, `concept-reviewer`

### Under CTO

- [`c-suite/cto.yaml`](./c-suite/cto.yaml)
- [`managers/infrastructure-manager.yaml`](./managers/infrastructure-manager.yaml)
- [`managers/llm-router-manager.yaml`](./managers/llm-router-manager.yaml)
- [`managers/security-manager.yaml`](./managers/security-manager.yaml)
- Specialists: `bundle-builder`, `cascade-tuner`, `provider-adapter-
  gemini`, `provider-adapter-anthropic`, `provider-adapter-openai`,
  `cost-accountant`

### Under CDO

- [`c-suite/cdo.yaml`](./c-suite/cdo.yaml) *(GBrain departmental
  oversight — owns `src/gbrain/index` + the `gbrain-integration.md`
  contract)*
- [`managers/student-model-manager.yaml`](./managers/student-model-manager.yaml)
  *(authoritative GBrain ownership — all 8 modules; sole write path)*
- [`managers/telemetry-manager.yaml`](./managers/telemetry-manager.yaml)
- Specialists: `mastery-estimator`, `error-classifier`,
  `aggregation-specialist`

### Under CMO

- [`c-suite/cmo.yaml`](./c-suite/cmo.yaml)
- [`managers/outreach-manager.yaml`](./managers/outreach-manager.yaml)
- [`managers/seo-manager.yaml`](./managers/seo-manager.yaml)

### Under COO

- [`c-suite/coo.yaml`](./c-suite/coo.yaml)
- [`managers/task-manager.yaml`](./managers/task-manager.yaml)
- [`managers/health-manager.yaml`](./managers/health-manager.yaml)

## Shared resources

- [`_shared/constitution.md`](./_shared/constitution.md) — the four
  promises and non-negotiable invariants
- [`_shared/gbrain-integration.md`](./_shared/gbrain-integration.md) —
  the GBrain cognitive-spine integration contract (which agents read,
  which write, the invariants the validator enforces)
- [`_shared/manifest-schema.md`](./_shared/manifest-schema.md) — the
  contract every manifest respects
- [`_shared/communication-protocols.md`](./_shared/communication-protocols.md) —
  the envelope, the five channels, the policies

## Why this shape

The six-C-suite shape is not a vanity org chart. Each office owns a
distinct lens on the product:

- **CPO** asks: *what does the student experience?*
- **CCO** asks: *what are we teaching them, and is it right?*
- **CTO** asks: *what runs underneath, and is it sustainable?*
- **CDO** asks: *what do we know about this student, and is it private?*
- **CMO** asks: *how do they find us, and does our claim hold?*
- **COO** asks: *how do all five of the above coordinate without
  dropping anything?*

Without any one of these six, the product develops a blind spot.
Without CPO the teaching is right but inaccessible; without CCO it is
accessible but wrong; without CTO it is right and accessible but
unsustainable; without CDO it treats every student as the average;
without CMO nobody finds it; without COO the whole graph starves on
its own coordination overhead.

The managers and specialists are the narrower work underneath. Their
shape follows from what the code already does, not from an
organisational aesthetic.
