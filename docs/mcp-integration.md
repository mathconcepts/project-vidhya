# MCP Integration Guide

Connect external LLM agents (Claude Desktop, Cursor, OpenAI tool-calling, custom clients) to Project Vidhya's admin orchestrator MCP server.

This guide is for consumers — teams building agents that want to discover + invoke admin orchestrator capabilities without reading the source.

Server version: **2.27.0**. MCP protocol version: **2024-11-05**.

---

## Table of contents

- [What you get](#what-you-get)
- [Two transports](#two-transports)
- [Quick-start: Claude Desktop (stdio)](#quick-start-claude-desktop-stdio)
- [Quick-start: Cursor (stdio)](#quick-start-cursor-stdio)
- [Quick-start: OpenAI tool-calling (HTTP)](#quick-start-openai-tool-calling-http)
- [Quick-start: custom HTTP client](#quick-start-custom-http-client)
- [The admin dashboard](#the-admin-dashboard)
- [Environment variables](#environment-variables)
- [Surface reference](#surface-reference)
- [Troubleshooting](#troubleshooting)

---

## What you get

The server exposes the full core MCP surface:

| Primitive | Methods | What it does |
|---|---|---|
| **Tools** | `tools/list`, `tools/call` | 29 role-scoped actions — scanner runs, strategy proposal, feedback triage, task claiming, etc. Every tool ships a JSON Schema Draft 2020-12 input contract. |
| **Resources** | `resources/list`, `resources/read` | 11 URI-addressed read-only views: `vidhya://admin/health/latest`, `.../strategies/latest`, `.../tasks/by-role/{role}`, `.../logs/recent`, ... |
| **Prompts** | `prompts/list`, `prompts/get` | 6 structured templates — `daily-standup`, `triage-briefing`, `strategy-review`, `task-handoff`, `week-in-review`, `content-debt-report`. Returns MCP-formatted messages you run through your own LLM. |
| **Logging** | `logging/setLevel` | Set a severity threshold; under stdio transport, matching events push as `notifications/message`. Under HTTP, pull via `vidhya://admin/logs/recent`. |

Role scoping is enforced at every method: an `analyst` client sees 18 tools, 11 resources, 4 prompts; an `admin` sees all 29 / 11 / 6.

---

## Two transports

The server supports two MCP transports. Pick based on where your client lives.

| Transport | When to use | Entry |
|---|---|---|
| **stdio** | Claude Desktop, Cursor, any subprocess-launching client | `npx tsx src/admin-orchestrator/stdio-server.ts` |
| **HTTP + JSON-RPC** | OpenAI tool-calling loop, Anthropic Messages API, browsers, curl scripts | `POST /api/admin/agent/mcp` |

stdio is bidirectional — the server can push `notifications/message` log events back to the client. HTTP is request-response — log events must be pulled.

Both transports share the same `handleMCPRequest` dispatcher in-process; behaviour is identical except for the push/pull distinction.

---

## Quick-start: Claude Desktop (stdio)

**1. Clone + install.**

```bash
git clone https://github.com/mathconcepts/project-vidhya.git
cd project-vidhya
npm install
```

**2. Edit Claude Desktop config.**

On macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "vidhya-admin": {
      "command": "npx",
      "args": [
        "-y", "tsx",
        "/ABSOLUTE/PATH/TO/project-vidhya/src/admin-orchestrator/stdio-server.ts"
      ],
      "env": {
        "VIDHYA_MCP_ROLE": "admin",
        "VIDHYA_MCP_ACTOR": "claude-desktop-user",
        "VIDHYA_LLM_PRIMARY_PROVIDER": "anthropic",
        "VIDHYA_LLM_PRIMARY_KEY": "sk-ant-..."
      }
    }
  }
}
```

Replace `/ABSOLUTE/PATH/TO/` with your real path. `VIDHYA_LLM_PRIMARY_KEY` is optional — only needed for the four LLM-backed tools (`agent:narrate-strategy`, etc.).

**3. Restart Claude Desktop.** The orchestrator will appear in the tools list.

**4. Try it.** Ask Claude:

> Use the vidhya-admin server. Run `tools/list`, then call `agent:describe-capabilities`. What do you see?

Claude will call `tools/list` + `tools/call agent:describe-capabilities` and summarize the result.

**5. Fetch a prompt template.**

> Fetch the `daily-standup` prompt from vidhya-admin and use it to brief me.

Claude calls `prompts/get name=daily-standup`, receives the pre-built user message with embedded system state, runs it through its own inference, and replies with your brief.

---

## Quick-start: Cursor (stdio)

Cursor's MCP support ships with 0.42+. Config lives in settings.

**1. Open Cursor Settings → Features → MCP.**

**2. Click Add new MCP server**, choose "stdio".

**3. Fill in:**

- **Name**: `vidhya-admin`
- **Command**: `npx`
- **Args**: `-y tsx /ABSOLUTE/PATH/TO/project-vidhya/src/admin-orchestrator/stdio-server.ts`
- **Env** (one per line):
  ```
  VIDHYA_MCP_ROLE=admin
  VIDHYA_LLM_PRIMARY_PROVIDER=anthropic
  VIDHYA_LLM_PRIMARY_KEY=sk-ant-...
  ```

**4. Save + restart Cursor.** The server appears in the MCP panel as connected.

**5. In any chat**: Cursor's composer now has access to all 29 tools + 11 resources + 6 prompts. Try:

> @vidhya-admin list the critical signals from the latest scan, then triage them by priority.

---

## Quick-start: OpenAI tool-calling (HTTP)

OpenAI's Chat Completions doesn't speak MCP natively, but the HTTP transport is plain JSON-RPC and easy to adapt.

**1. Start the server locally** (or point at your deployed instance):

```bash
cd project-vidhya
npm run start:gate  # starts on :8080
```

**2. Get an auth token** — one of the existing admin JWTs. If you don't have one yet, hit `POST /api/auth/bootstrap` per the main docs.

**3. Wrap the MCP endpoint as an OpenAI tool.** Example in Python:

```python
import os, requests
from openai import OpenAI

VIDHYA_BASE = "http://localhost:8080"
VIDHYA_TOKEN = os.environ["VIDHYA_TOKEN"]

def mcp_call(method, params=None):
    r = requests.post(
        f"{VIDHYA_BASE}/api/admin/agent/mcp",
        headers={
            "Authorization": f"Bearer {VIDHYA_TOKEN}",
            "Content-Type": "application/json",
        },
        json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params or {}},
    )
    r.raise_for_status()
    data = r.json()
    if "error" in data:
        raise RuntimeError(f"{data['error']['code']}: {data['error']['message']}")
    return data["result"]

# Discover the tool surface
tools_list = mcp_call("tools/list")["tools"]

# Convert to OpenAI tool schema
openai_tools = [
    {
        "type": "function",
        "function": {
            "name": t["name"].replace(":", "__"),  # OpenAI dislikes ':'
            "description": t["description"],
            "parameters": t["inputSchema"],
        },
    }
    for t in tools_list
]

client = OpenAI()
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "What's the current system health?"}],
    tools=openai_tools,
)

# When OpenAI calls a tool, route it back through MCP:
tool_call = response.choices[0].message.tool_calls[0]
mcp_name = tool_call.function.name.replace("__", ":")
mcp_args = tool_call.function.arguments  # already a JSON-decoded dict
result = mcp_call("tools/call", {"name": mcp_name, "arguments": mcp_args})
print(result["content"][0]["text"])
```

The `::` → `__` transform works around OpenAI's tool-name regex (`^[a-zA-Z0-9_-]+$`). Map it back on the call path. The server handles both directions.

**4. For prompts**, fetch + inject into the conversation:

```python
prompt = mcp_call("prompts/get", {
    "name": "daily-standup",
    "arguments": {},
})
# prompt["messages"] is already in OpenAI-compatible shape
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": m["role"], "content": m["content"]["text"]}
        for m in prompt["messages"]
    ],
)
print(response.choices[0].message.content)
```

---

## Quick-start: custom HTTP client

The HTTP transport is plain JSON-RPC 2.0 with Bearer auth. No MCP SDK required.

**Manifest** (public, unauthenticated):

```bash
curl -s http://localhost:8080/api/admin/agent/mcp/manifest | jq
```

```json
{
  "serverInfo": {
    "name": "project-vidhya-admin-orchestrator",
    "version": "2.27.0",
    "protocolVersion": "2024-11-05"
  },
  "capabilities": { ... },
  "endpoints": { "jsonrpc": "/api/admin/agent/mcp", ... },
  "methods_supported": [...]
}
```

**Initialize**:

```bash
curl -s http://localhost:8080/api/admin/agent/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05"}}'
```

**List tools** (role-scoped by the `role` query parameter or `params._role`):

```bash
curl -s "http://localhost:8080/api/admin/agent/mcp?role=analyst" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

**Call a tool**:

```bash
curl -s http://localhost:8080/api/admin/agent/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "feedback:list-pending-triage",
      "arguments": {}
    }
  }'
```

**Read a resource**:

```bash
curl -s http://localhost:8080/api/admin/agent/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "resources/read",
    "params": { "uri": "vidhya://admin/health/latest" }
  }'
```

**Get a prompt**:

```bash
curl -s http://localhost:8080/api/admin/agent/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "prompts/get",
    "params": {
      "name": "task-handoff",
      "arguments": { "task_id": "TSK-abc12345" }
    }
  }'
```

---

## The admin dashboard

If you want a UI without writing any integration code, the admin dashboard is at `/admin/agent/dashboard` on your server:

```
http://localhost:8080/admin/agent/dashboard
```

The page prompts for a JWT on first load, stores it in localStorage, polls `/api/admin/agent/latest` every 30s, and surfaces all three MCP primitives (tools, resources, prompts) in an explorer panel. Each prompt has a **Generate** button (which calls `prompts/get` via JSON-RPC) and a **Copy to Clipboard** button on the result, so you can paste a `daily-standup` straight into any chat window without writing integration code.

---

## Environment variables

| Variable | Purpose | Example |
|---|---|---|
| `VIDHYA_MCP_ROLE` | Role claimed by the stdio client for all tool invocations | `admin`, `analyst`, `content-ops` |
| `VIDHYA_MCP_ACTOR` | User id attributed to invocations (shows in activity logs) | `claude-desktop-user` |
| `VIDHYA_LLM_PRIMARY_PROVIDER` | Provider for the 4 LLM-backed tools | `anthropic`, `google-gemini`, `openai` |
| `VIDHYA_LLM_PRIMARY_KEY` | API key for the chosen provider | `sk-ant-...` |
| `VIDHYA_LOG_STDERR` | Set to `off` to suppress stderr logging (tests) | `off` |
| `ANTHROPIC_API_KEY` | Legacy alias; discovered automatically | — |
| `GEMINI_API_KEY` | Legacy alias; discovered automatically | — |
| `OPENAI_API_KEY` | Legacy alias; discovered automatically | — |

If no LLM credential is set, the 4 LLM-backed tools still run their deterministic fallbacks (summaries, task picks) and return `llm_summary: null`. Everything else works without any LLM configured.

---

## Surface reference

### 29 tools (admin role)

| Domain | Tools |
|---|---|
| `feedback` | list-pending-triage, list-by-exam, triage, approve, apply |
| `sample-check` | list-open, get-latest-for-exam, close-resolved |
| `course` | get-for-exam, list-all, list-promotions |
| `exam-builder` | list-adapters, build-or-update |
| `attention` | get-overdue-deferrals, coverage-for-user |
| `marketing` | list-stale-articles, list-articles-for-exam, get-dashboard, detect-drift, launch-campaign |
| `scanner` | run-full-scan |
| `strategy` | list-proposed |
| `task` | list-open, claim, complete |
| `agent` | narrate-strategy, summarize-health, suggest-next-action, describe-capabilities |

### 11 resources

```
vidhya://admin/health/latest
vidhya://admin/strategies/latest
vidhya://admin/strategies/{strategy_id}
vidhya://admin/insights
vidhya://admin/runs/latest
vidhya://admin/runs/{run_id}
vidhya://admin/tasks/by-role/{role}
vidhya://admin/tasks/{task_id}
vidhya://admin/tools/catalog
vidhya://admin/roles/catalog
vidhya://admin/logs/recent
```

### 6 prompts

| Name | Args | Founder-scope? |
|---|---|---|
| `daily-standup` | — | yes |
| `triage-briefing` | `exam_id?` | ops |
| `strategy-review` | `priority_filter?` | yes |
| `task-handoff` | `task_id` (required) | all roles |
| `week-in-review` | `week_start?` | yes |
| `content-debt-report` | — | ops |

### Error codes

| Code | Meaning |
|---|---|
| `-32700` | Parse error (malformed JSON) |
| `-32600` | Invalid request envelope |
| `-32601` | Method not found |
| `-32602` | Invalid params (missing required argument, bad format) |
| `-32603` | Internal error |
| `-32001` | Tool/resource/prompt not found (application-level) |
| `-32002` | Role not authorized for the requested operation |

---

## Troubleshooting

**Claude Desktop says "server failed to start".**
Check the stderr log at `~/Library/Logs/Claude/mcp-server-vidhya-admin.log`. The most common issue is the absolute path to `stdio-server.ts` — it must point at the real on-disk location inside the checkout.

**`tools/list` returns fewer tools than expected.**
The caller's role is being applied. The default role for stdio is `admin` (29 tools). For HTTP, pass `?role=admin` on the query string or `params._role` in the JSON body.

**`tools/call` returns `{ error: { code: -32002 } }`.**
Role authorization rejected. Check `listToolsForRole(role)` — your role doesn't have this tool. Example: `analyst` cannot call `feedback:apply`.

**LLM-backed tools return `llm_summary: null`.**
No LLM is configured. Check `GET /api/admin/agent/llm-status` — if `available=false`, set `VIDHYA_LLM_PRIMARY_PROVIDER` + `VIDHYA_LLM_PRIMARY_KEY`. The deterministic fallback always works; only the LLM enrichment is skipped.

**The dashboard shows "Loading…" forever.**
Open the browser console. Most likely: no JWT, expired JWT, or 401 from the API. Clear localStorage key `vidhya_auth_token` and paste a fresh one.

**stdio server emits a flood of log lines and my client disconnects.**
Default level is `info`. Call `logging/setLevel` with `warning` or `error` to quiet it down:

```json
{"jsonrpc":"2.0","id":1,"method":"logging/setLevel","params":{"level":"warning"}}
```

**I changed `dashboard-html.ts` and the page didn't update.**
The dashboard is a static artifact — re-run:

```bash
npx tsx scripts/regenerate-dashboard-static.ts
```

This writes the updated HTML to both `frontend/public/admin/agent/dashboard/index.html` and `frontend/dist/admin/agent/dashboard/index.html`.

---

## Pointers

- Server entry points: `src/api/admin-agent-routes.ts` (HTTP) + `src/admin-orchestrator/stdio-server.ts` (stdio)
- Protocol dispatch: `src/admin-orchestrator/mcp-server.ts`
- Tool catalog + JSON Schemas: `src/admin-orchestrator/tool-registry.ts`, `src/admin-orchestrator/input-schemas.ts`
- Resource catalog: `src/admin-orchestrator/mcp-resources.ts`
- Prompt templates: `src/admin-orchestrator/mcp-prompts.ts`
- Central logger: `src/admin-orchestrator/logger.ts`
- Dashboard template: `src/admin-orchestrator/dashboard-html.ts`

For protocol-level questions: [modelcontextprotocol.io](https://modelcontextprotocol.io) — the canonical MCP specification. This server targets protocol version `2024-11-05`.
