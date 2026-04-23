# Communication protocols

> Schema description below. Authoritative YAML conventions for agent manifests and inter-agent messaging. The format is illustrated — actual agent YAMLs conform to this shape.

```yaml
# Communication protocols between Vidhya agents.
#
# Every message between agents is a typed envelope. The envelope format
# is the same regardless of runtime — Claude Agent SDK, MCP, LangGraph,
# bespoke. Orchestrators adapt their transport to this envelope; agents
# do not need to know which transport is in use.

# Envelope shape:
envelope:
  message_id: uuid
  from: agent_id
  to: agent_id | '*'          # '*' means broadcast (signals only)
  type: one-of:
    - delegation              # superior -> subordinate, 'please do X'
    - query                   # any -> any, 'tell me Y'
    - escalation              # subordinate -> superior, 'I cannot resolve X'
    - signal                  # broadcast on the event bus
    - response                # reply to a prior delegation or query
  channel: string             # one of the channel names in the manifest
  payload: json               # shape depends on channel
  context:
    correlation_id: uuid      # links a response back to its request
    parent_trace_id: uuid     # which top-level user request chain this is part of
    budget:
      tokens: integer         # remaining LLM tokens the caller allows
      latency_ms: integer     # soft deadline
      tool_calls: integer     # max downstream tool calls
  issued_at: iso8601

# ─── Channels ──────────────────────────────────────────────────────────

# 'delegation' — vertical, superior -> subordinate
# Used when a parent assigns a task. Subordinate MUST either complete or
# escalate. No silent drops. Subordinate's response includes the result
# or the escalation reason.
delegation:
  payload:
    task: string              # human-readable task description
    inputs: json              # typed inputs the subordinate needs
    deliverable: string       # shape of the expected response
    deadline: iso8601 | null

# 'query' — any direction, read-only lookup
# Used for cross-functional information. Respondent is expected to
# answer within the caller's latency_ms budget. Queries are idempotent
# and side-effect-free by contract.
query:
  payload:
    question: string          # what is being asked
    filters: json             # constraints on the answer
    max_rows: integer | null  # for list-shaped queries

# 'escalation' — subordinate -> superior
# When a subordinate hits a blocker — policy ambiguity, tool failure,
# conflicting instructions — it escalates rather than guesses.
# Superior resolves and responds with a 'delegation' reply carrying the
# resolution.
escalation:
  payload:
    blocker: string           # why the subordinate is stuck
    attempted: [string]       # what the subordinate already tried
    options: [string]         # if the subordinate sees choices, enumerate them
    recommendation: string | null

# 'signal' — broadcast to the event bus
# Any agent can emit. Any agent can subscribe. Used for cross-cutting
# events like 'content-drift-detected' or 'student-inactive-7-days'.
# Signals are fire-and-forget — the emitter does not wait for handlers.
signal:
  payload:
    event_name: string        # matches emits_signals in the emitter's manifest
    data: json                # shape documented in the emitter's manifest
    severity: one-of:         # low | normal | high | critical

# 'response' — reply to a prior delegation or query
# correlation_id MUST match the originating envelope's message_id.
response:
  payload:
    status: one-of:           # ok | error | partial
    result: json | null       # if status=ok
    error:                    # if status=error or status=partial
      code: string
      message: string
      retriable: boolean

# ─── Policies that every agent enforces ────────────────────────────────

policies:

  # Every delegation must complete or escalate. Timeouts count as
  # escalation with blocker='timeout'.
  no_silent_drops: true

  # Budget propagation — when a parent delegates, the budget in the
  # envelope is split (not copied). If A has 10k tokens and calls B and
  # C in parallel, the orchestrator allocates a subset to each; the
  # unused portion returns to A.
  budget_propagation: split

  # Loop detection — if the same correlation_id visits the same agent
  # twice in the same trace, the orchestrator aborts with a
  # 'cycle-detected' error. Agents do not need to track this themselves.
  loop_detection: orchestrator-owned

  # Least privilege — an agent may only call tools listed in its
  # owned_tools. Attempting to call another tool raises
  # 'unauthorised-tool' and the attempt is logged for audit.
  least_privilege: true

  # Failure containment — one specialist failing does not fail the
  # whole org. The manager that delegated to it receives an error
  # response and decides (via decision_rules) whether to retry, route
  # to a peer, or escalate to the C-suite.
  failure_containment: by-layer

# ─── Event bus ─────────────────────────────────────────────────────────

event_bus:
  implementation: runtime-owned   # Claude Agent SDK / MCP / LangGraph
                                  # each have their own pub-sub; agents
                                  # do not see the transport
  signal_retention_hours: 24      # signals older than this are dropped
                                  # from replay; the aggregator persists
                                  # what matters for history
  max_subscribers_per_signal: 32  # sanity cap; an agent subscribing to
                                  # more than this probably needs a
                                  # dedicated aggregator
```
