# Manifest schema

> Schema description below. Authoritative YAML conventions for agent manifests and inter-agent messaging. The format is illustrated — actual agent YAMLs conform to this shape.

```yaml
# Agent manifest schema — the contract every agent in Project Vidhya respects.
#
# This file is THE definition of the manifest format. Every agent manifest
# in this repository conforms to it. Orchestrators (Claude Agent SDK,
# LangGraph, MCP runtime, bespoke routers) parse this shape.
#
# Portability: the manifest is plain YAML. It does not depend on any
# runtime. An orchestrator loads all manifests, builds the agent graph
# in memory, and dispatches messages. Switching orchestrators does not
# change the manifests.
#
# Format:

id: string                    # globally unique, kebab-case, matches filename
tier: one-of:                 # which layer of the org chart this agent sits at
  - ceo
  - c-suite
  - manager
  - specialist
reports_to: string | null     # agent id of the direct superior; null only for ceo

mission: string               # one sentence; the reason this agent exists
scope: string                 # one paragraph; what the agent owns and what it does not

# Skills the agent exercises. Short verb-phrases. The LLM running the
# agent uses these as the grounding of its persona. No fluff; no
# superlatives; no marketing copy.
skills:
  - string
  - string

# Tools the agent has authority to call. Each tool is either:
#   - an MCP tool id from src/admin-orchestrator/tool-registry.ts
#   - a direct HTTP route (e.g. POST /api/student/session/plan)
#   - a module function (e.g. src/session-planner#planSession)
# An agent may only call tools listed here. Orchestrators enforce this.
owned_tools:
  - type: mcp | http | module
    id: string
    purpose: string           # one sentence — what the agent uses this tool for

# Other agents this agent communicates with. These edges form the agent
# graph. The graph is not a tree — lateral and cross-functional edges are
# normal and expected.
connections:
  upstream:                   # agents that delegate TO this agent
    - id: string
      channel: string         # what they hand over: 'delegation' | 'query' | 'escalation' | 'signal'
  downstream:                 # agents this agent delegates TO
    - id: string
      channel: string
  peers:                      # cross-functional same-tier agents
    - id: string
      channel: string

# How the agent makes decisions when alone. Short. One to three bullets.
decision_rules:
  - string

# Signals this agent emits into the shared event bus. Other agents can
# subscribe. Enables the graph to be event-driven rather than strictly
# call-response.
emits_signals:
  - name: string
    schema: string            # one-line description of the payload shape
    when: string              # what triggers emission

# Signals this agent subscribes to (emitted by others).
subscribes_to:
  - name: string
    from: string              # the agent that emits it
    action: string            # what this agent does on receipt

# Portability — the agent-manifest is runtime-agnostic. These are the
# adapters this agent has been tested against. Adding a new runtime
# means adding an entry here and confirming all owned_tools have a
# binding in the new runtime.
portability:
  tested_runtimes:
    - claude-agent-sdk
    - mcp-stdio
    - langgraph
  minimum_context_window: integer  # tokens; helps the orchestrator pick a model

# Lifecycle hooks the agent exposes. Optional.
hooks:
  on_start: string | null     # module function called when agent initialised
  on_shutdown: string | null
  health_check: string | null

# Quality gates — what makes this agent's output acceptable.
quality_gates:
  - string                    # e.g. 'Every user-facing answer cites at least one source'
```
