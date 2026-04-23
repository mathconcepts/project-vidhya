# Vidhya Agent Organisation

Vidhya runs as a graph of **45 agents** across four tiers:

- **1 CEO** — strategic direction and constitutional enforcement
- **6 C-suite officers** — CPO, CCO, CTO, CDO, CMO, COO
- **17 managers** — functional leads, one to four per C-suite
- **21 specialists** — narrow operators doing the specific work

Every agent is defined by a YAML manifest. The manifests are
runtime-agnostic — the same definitions run under Claude Agent SDK,
MCP, LangGraph, or a bespoke router.

## Start here

- **[`ORG-CHART.md`](./ORG-CHART.md)** — the canonical human-readable
  reference. Who reports to whom, what each agent owns, how the graph
  is wired.
- **[`_shared/constitution.md`](./_shared/constitution.md)** — the four
  product promises and the non-negotiable invariants every agent is
  bound by.
- **[`_shared/manifest-schema.md`](./_shared/manifest-schema.md)** —
  the contract every manifest respects.
- **[`_shared/communication-protocols.md`](./_shared/communication-protocols.md)** —
  the five message channels between agents.

## Directory layout

```
agents/
├── ORG-CHART.md                  # human reference (read this first)
├── README.md                     # this file
├── ceo/
│   └── ceo.yaml                  # 1 agent
├── c-suite/                      # 6 agents
│   ├── cpo.yaml                  # Chief Product Officer
│   ├── cco.yaml                  # Chief Content Officer
│   ├── cto.yaml                  # Chief Technology Officer
│   ├── cdo.yaml                  # Chief Data Officer
│   ├── cmo.yaml                  # Chief Marketing Officer
│   └── coo.yaml                  # Chief Operations Officer
├── managers/                     # 17 agents
│   ├── acquisition-manager.yaml
│   ├── assessment-manager.yaml
│   ├── authoring-manager.yaml
│   ├── curriculum-manager.yaml
│   ├── feedback-manager.yaml
│   ├── health-manager.yaml
│   ├── infrastructure-manager.yaml
│   ├── llm-router-manager.yaml
│   ├── outreach-manager.yaml
│   ├── planner-manager.yaml
│   ├── security-manager.yaml
│   ├── seo-manager.yaml
│   ├── student-model-manager.yaml
│   ├── task-manager.yaml
│   ├── teaching-manager.yaml
│   ├── telemetry-manager.yaml
│   └── verification-manager.yaml
├── specialists/
│   └── specialists.yaml          # 21 agents, consolidated
└── _shared/
    ├── constitution.md           # the CEO's source of authority
    ├── manifest-schema.md      # the manifest contract
    └── communication-protocols.md # the five message channels
```

## Core design commitments

**Modular.** Every agent lives in a single manifest. Add one, remove
one, re-wire one — the rest is untouched.

**Flexible.** The graph is a graph, not a tree. Peer edges and
cross-functional delegations are normal. A manager under CPO routinely
delegates to a manager under CCO; a C-suite officer queries another
peer officer to resolve a decision.

**Portable.** YAML manifests run unchanged across Claude Agent SDK,
MCP runtime, LangGraph, and a bespoke router. Switching orchestrators
touches the adapter layer, not the manifests.

**No functionality changes.** This organisation is a structural
reorganisation of what the codebase already does. Every `owned_tool`
already exists in `src/admin-orchestrator/tool-registry.ts`, in an
API route, or as an importable module.

## Counting the surface

| Layer | Count |
|---|---:|
| CEO | 1 |
| C-suite | 6 |
| Managers | 17 |
| Specialists | 21 |
| **Total agents** | **45** |
| MCP tools owned by agents | 33 (all mapped) |
| Module-level tools | ~15 |
| HTTP route tools | ~10 |

## How to work with this organisation

- **Adding a new capability?** Find the C-suite officer who owns that
  domain. Decide if the capability is a new manager, or fits inside
  an existing manager's scope. See
  [`ORG-CHART.md § How to add a new agent`](./ORG-CHART.md#how-to-add-a-new-agent).

- **Retiring a capability?** Follow
  [`ORG-CHART.md § How to retire an agent`](./ORG-CHART.md#how-to-retire-an-agent).

- **Porting to a new runtime?** Pick up
  [`_shared/communication-protocols.md`](./_shared/communication-protocols.md),
  implement the five-channel envelope in the new runtime, then load
  every manifest in this directory. No manifest changes needed.

- **Evaluating whether the graph is healthy?** The `coo` delegates
  this to `health-manager`. Run the validator; read the org-health
  report.
