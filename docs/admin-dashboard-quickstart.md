# Admin Dashboard & MCP — Quick-Start

Get the admin orchestrator's dashboard UI and MCP server running in under five minutes.

---

## What you're about to run

Two things that share code but run separately:

1. The **admin dashboard** — a single-file UI at `/admin/agent/dashboard` that polls the agent's state and surfaces tools, resources, and prompts interactively.
2. The **MCP server** — the same 29 tools + 11 resources + 6 prompts exposed over JSON-RPC (HTTP) and stdio, for external LLM agents to consume.

Neither requires a build step. The dashboard is a static HTML file; the MCP server runs from source via `tsx`.

---

## Prerequisites

- **Node.js 18+**
- **npm**
- **Git**
- Optional: an **API key** for one of `anthropic` / `google-gemini` / `openai` — needed only if you want the 4 LLM-backed tools (`agent:narrate-strategy`, etc.) to actually call an LLM. All other functionality works without one.

---

## Step 1 — Install

```bash
git clone https://github.com/mathconcepts/project-vidhya.git
cd project-vidhya
npm install
```

---

## Step 2 — Start the server

```bash
npm run start:gate
```

The API now listens on `http://localhost:8080`. Keep this terminal open.

To enable LLM-backed tools, set one of these before `npm run start:gate`:

```bash
export VIDHYA_LLM_PRIMARY_PROVIDER=anthropic
export VIDHYA_LLM_PRIMARY_KEY=sk-ant-...
# OR the legacy form:
export ANTHROPIC_API_KEY=sk-ant-...
```

Confirm the bridge sees the key:

```bash
curl -s http://localhost:8080/api/admin/agent/llm-status \
  -H "Authorization: Bearer $TOKEN" | jq
# → { "llm": { "available": true, "provider_id": "anthropic" } }
```

---

## Step 3 — Open the dashboard

Open your browser at:

```
http://localhost:8080/admin/agent/dashboard
```

The page prompts for an admin JWT. Paste one (see `docs/01-quick-start.md` in the main docs for how to mint one), click Authenticate, and the dashboard loads:

- **Top status bar** — health pill, signal + task counts
- **Left column** — critical/warning/info signals + cross-module insights
- **Middle column** — P0→P3 strategies with proposed tasks
- **Right column** — open tasks with role filter and Claim/Complete buttons
- **Bottom** — collapsible MCP Explorer with three tabs:
  - **Tools** — all 29 tools with their JSON Schemas
  - **Resources** — all 11 `vidhya://admin/...` URIs
  - **Prompts** — all 6 prompt templates with form inputs for their arguments, a **Generate** button that calls `prompts/get`, and a **Copy to Clipboard** button on the result

Click **Run Agent** to trigger a fresh run.

---

## Step 4 — Connect an external agent

### Claude Desktop (easiest path)

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS (or the Windows equivalent):

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
        "VIDHYA_LLM_PRIMARY_PROVIDER": "anthropic",
        "VIDHYA_LLM_PRIMARY_KEY": "sk-ant-..."
      }
    }
  }
}
```

Restart Claude Desktop. The orchestrator appears in the tool menu.

### Cursor

Settings → Features → MCP → Add new MCP server (stdio) — same command/args as above. Cursor 0.42+.

### OpenAI, curl, custom clients

HTTP transport: `POST /api/admin/agent/mcp` with a Bearer token. See [MCP Integration Guide](./mcp-integration.md) for code samples in Python, curl, and TypeScript.

---

## Step 5 — Verify

Try each primitive from any of the three quick-start paths:

**List tools**:

```bash
curl -s http://localhost:8080/api/admin/agent/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.result.tools | length'
# → 29  (for admin role)
```

**Read a resource**:

```bash
curl -s http://localhost:8080/api/admin/agent/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"resources/read","params":{"uri":"vidhya://admin/health/latest"}}' \
  | jq '.result.contents[0].text | fromjson | .overall'
```

**Fetch a prompt**:

```bash
curl -s http://localhost:8080/api/admin/agent/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"prompts/get","params":{"name":"daily-standup"}}' \
  | jq '.result.messages[0].content.text'
```

If all three return without error, you're integrated.

---

## Regenerate the dashboard after changing `dashboard-html.ts`

The dashboard's canonical source is the TypeScript template. A script writes its output to the two locations Vite and the static server read:

```bash
npx tsx scripts/regenerate-dashboard-static.ts
```

Generates:

- `frontend/public/admin/agent/dashboard/index.html` — picked up by `vite build`
- `frontend/dist/admin/agent/dashboard/index.html` — for immediate dev without rebuild

Both files are committed to the repo; treat them as derived artifacts.

---

## Next steps

- Dive into the full **[MCP Integration Guide](./mcp-integration.md)** — covers all three clients (Claude Desktop, Cursor, OpenAI) plus the HTTP surface, environment variables, and troubleshooting.
- Read the **[feature ledger](../FEATURES.md)** for the v2.22 → v2.27 arc.
- Check the **server source**:
  - `src/admin-orchestrator/mcp-server.ts` — protocol dispatch
  - `src/admin-orchestrator/mcp-resources.ts` — resource catalog
  - `src/admin-orchestrator/mcp-prompts.ts` — prompt builders
  - `src/admin-orchestrator/logger.ts` — central logger with MCP notifications/message push
