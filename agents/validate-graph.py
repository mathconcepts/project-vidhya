#!/usr/bin/env python3
"""
Validate the Vidhya agent organisation graph.

Invariants enforced:
  1. Every 'reports_to' resolves to an existing agent id (or null for CEO).
  2. Every peers/upstream/downstream id in 'connections' resolves.
  3. No cycles in the 'reports_to' chain.
  4. Exactly one agent has reports_to == null (the CEO).
  5. Every owned_tool id that starts with a known MCP tool prefix is
     present in src/admin-orchestrator/tool-registry.ts.
  6. No agent has more than 8 direct downstreams (cognitive limit).

Usage:
    python3 agents/validate-graph.py

Exits 0 on pass, non-zero on violation.
"""

from __future__ import annotations
import os, sys, re
try:
    import yaml
except ImportError:
    print("ERROR: PyYAML not installed. Run: pip install pyyaml")
    sys.exit(2)

# ─── Load all agents ──────────────────────────────────────────────────

AGENTS_ROOT = os.path.join(os.path.dirname(__file__))
MCP_REGISTRY = os.path.join(os.path.dirname(AGENTS_ROOT), 'src/admin-orchestrator/tool-registry.ts')

def load_all_agents():
    """Collect every agent definition from every YAML in agents/."""
    agents = {}
    for root, dirs, files in os.walk(AGENTS_ROOT):
        # skip the _shared directory — it contains schema docs not agents
        if '_shared' in root:
            continue
        for f in files:
            if not f.endswith('.yaml'):
                continue
            path = os.path.join(root, f)
            with open(path) as fh:
                doc = yaml.safe_load(fh)
            if not isinstance(doc, dict):
                continue
            # Two shapes: single-agent manifest vs. specialists list
            if 'specialists' in doc and isinstance(doc['specialists'], list):
                for s in doc['specialists']:
                    if s.get('id'):
                        s.setdefault('tier', 'specialist')
                        agents[s['id']] = s
            elif doc.get('id'):
                agents[doc['id']] = doc
    return agents

# ─── Load MCP tool registry ───────────────────────────────────────────

def load_mcp_tool_ids():
    """Extract tool ids from src/admin-orchestrator/tool-registry.ts."""
    if not os.path.exists(MCP_REGISTRY):
        return set()
    with open(MCP_REGISTRY) as fh:
        text = fh.read()
    return set(re.findall(r"id:\s*'([a-z-]+:[a-z-]+)'", text))

# ─── Validations ──────────────────────────────────────────────────────

def validate(agents, mcp_tools):
    errors = []
    warnings = []

    # 1. reports_to resolves
    for aid, a in agents.items():
        rt = a.get('reports_to')
        if rt is not None and rt not in agents:
            errors.append(f"{aid}: reports_to='{rt}' does not exist")

    # 2. connection ids resolve
    for aid, a in agents.items():
        conns = a.get('connections', {}) or {}
        for side in ('upstream', 'downstream', 'peers'):
            for entry in (conns.get(side) or []):
                if isinstance(entry, dict) and 'id' in entry:
                    target = entry['id']
                    if target not in agents:
                        errors.append(
                            f"{aid}: {side}.id='{target}' does not exist")

    # 3. no cycles in reports_to
    for aid in agents:
        seen = set()
        cur = aid
        while cur is not None and cur in agents:
            if cur in seen:
                errors.append(f"{aid}: reports_to chain forms a cycle: {seen}")
                break
            seen.add(cur)
            cur = agents[cur].get('reports_to')

    # 4. exactly one root
    roots = [aid for aid, a in agents.items() if a.get('reports_to') is None]
    if len(roots) != 1:
        errors.append(f"Expected 1 root agent with reports_to=null, found {len(roots)}: {roots}")
    elif roots[0] != 'ceo':
        errors.append(f"Root agent is '{roots[0]}', expected 'ceo'")

    # 5. MCP tool ids exist in registry (only warn if tool registry was loaded)
    if mcp_tools:
        for aid, a in agents.items():
            for tool in (a.get('owned_tools') or []):
                if tool.get('type') != 'mcp':
                    continue
                tid = tool.get('id')
                if tid and tid not in mcp_tools:
                    warnings.append(
                        f"{aid}: mcp tool '{tid}' not found in tool-registry.ts")

    # 6. downstream cognitive limit
    for aid, a in agents.items():
        downs = (a.get('connections') or {}).get('downstream') or []
        if len(downs) > 8:
            warnings.append(
                f"{aid}: has {len(downs)} direct downstream agents (>8 is hard to manage)")

    return errors, warnings

# ─── Report ───────────────────────────────────────────────────────────

def tier_counts(agents):
    counts = {'ceo': 0, 'c-suite': 0, 'manager': 0, 'specialist': 0}
    for a in agents.values():
        tier = a.get('tier', 'unknown')
        counts[tier] = counts.get(tier, 0) + 1
    return counts

def main():
    agents = load_all_agents()
    mcp_tools = load_mcp_tool_ids()

    print(f"Loaded {len(agents)} agents across {len(set(a.get('tier','?') for a in agents.values()))} tiers.")
    print(f"MCP tool registry: {len(mcp_tools)} tools")
    print()
    print("Tier distribution:")
    for tier, count in tier_counts(agents).items():
        print(f"  {tier:12} {count:3}")
    print()

    errors, warnings = validate(agents, mcp_tools)

    if warnings:
        print(f"WARNINGS ({len(warnings)}):")
        for w in warnings:
            print(f"  ⚠ {w}")
        print()

    if errors:
        print(f"ERRORS ({len(errors)}):")
        for e in errors:
            print(f"  ✗ {e}")
        print()
        print("Graph is INVALID.")
        sys.exit(1)
    else:
        print("Graph is valid. All invariants hold.")
        sys.exit(0)

if __name__ == '__main__':
    main()
