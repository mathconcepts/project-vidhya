// @ts-nocheck
/**
 * src/orchestrator/registry.ts
 *
 * Owning agent: orchestrator-specialist (under task-manager).
 *
 * Reads modules.yaml at startup, validates integrity, exposes
 * queries. Every other part of the orchestrator (composer, health,
 * routes) reads from this registry.
 *
 * Invariants enforced at load:
 *   - Every module has a unique name
 *   - Every depends_on entry resolves to a declared module
 *   - No cycles in module deps
 *   - Every tier's modules[] resolves
 *   - Every profile's tiers[] resolves
 */

import { readFileSync, existsSync } from 'fs';
import { parse as yamlParse } from 'yaml';

const MODULES_YAML = 'modules.yaml';

// ─── types ────────────────────────────────────────────────────────────

export interface ModuleFeatureFlag {
  flag:        string;
  env_var:     string;
  default:     boolean;
  description: string;
}

export interface Module {
  name:               string;
  description:        string;
  source:             string;           // comma-separated paths
  depends_on:         string[];
  health_check:       string;
  subrepo_candidate:  boolean;
  subrepo_url?:       string;
  pin_file?:          string;
  public_api?:        string[];
  owning_agents?:     string[];
  /**
   * Foundation modules are implicit dependencies of every other
   * module. They don't need to appear in any other module's
   * depends_on list. Currently: core, auth.
   */
  foundation?:        boolean;
  /**
   * Per-module env-var feature flags. Mirrored at runtime by the
   * module's feature-flags.ts, which is the source of truth for
   * actual flag state. The yaml entry is for operators reading the
   * config + the orchestrator features endpoint.
   */
  feature_flags?:     ModuleFeatureFlag[];
}

export type TierStatus = 'shipped' | 'partial' | 'stub' | 'planned' | 'future';

export interface Tier {
  name:         string;
  description:  string;
  modules:      string[];
  status:       TierStatus;
  notes?:       string;
  requires_env?: string[];
}

export interface Profile {
  name:         string;
  description:  string;
  tiers:        string[];
  status?:      string;
}

export interface Registry {
  modules:  Record<string, Module>;
  tiers:    Record<string, Tier>;
  profiles: Record<string, Profile>;
}

// ─── load + validate ─────────────────────────────────────────────────

let _cached: Registry | null = null;

export function loadRegistry(opts?: { reload?: boolean }): Registry {
  if (_cached && !opts?.reload) return _cached;
  if (!existsSync(MODULES_YAML)) {
    throw new Error(`${MODULES_YAML} not found — orchestrator cannot boot without it`);
  }
  const raw = readFileSync(MODULES_YAML, 'utf-8');
  const doc: any = yamlParse(raw);

  const modules: Record<string, Module> = {};
  for (const m of doc.modules ?? []) {
    if (!m.name) throw new Error('module missing name');
    if (modules[m.name]) throw new Error(`duplicate module: ${m.name}`);
    modules[m.name] = {
      name: m.name,
      description: m.description ?? '',
      source: m.source ?? '',
      depends_on: m.depends_on ?? [],
      health_check: m.health_check ?? '',
      subrepo_candidate: !!m.subrepo_candidate,
      subrepo_url: m.subrepo_url,
      pin_file: m.pin_file,
      public_api: m.public_api,
      owning_agents: m.owning_agents,
      foundation: !!m.foundation,
      feature_flags: m.feature_flags,
    };
  }

  // Validate deps resolve + no cycles
  for (const m of Object.values(modules)) {
    for (const d of m.depends_on) {
      if (!modules[d]) {
        throw new Error(`module "${m.name}" depends_on "${d}" which is not declared`);
      }
    }
  }
  _detectCycles(modules);

  const tiers: Record<string, Tier> = {};
  for (const t of doc.tiers ?? []) {
    if (!t.name) throw new Error('tier missing name');
    if (tiers[t.name]) throw new Error(`duplicate tier: ${t.name}`);
    for (const mm of t.modules ?? []) {
      if (!modules[mm]) {
        throw new Error(`tier "${t.name}" references undeclared module "${mm}"`);
      }
    }
    tiers[t.name] = {
      name: t.name,
      description: t.description ?? '',
      modules: t.modules ?? [],
      status: t.status ?? 'shipped',
      notes: t.notes,
      requires_env: t.requires_env,
    };
  }

  const profiles: Record<string, Profile> = {};
  for (const p of doc.profiles ?? []) {
    if (!p.name) throw new Error('profile missing name');
    if (profiles[p.name]) throw new Error(`duplicate profile: ${p.name}`);
    for (const tt of p.tiers ?? []) {
      if (!tiers[tt]) {
        throw new Error(`profile "${p.name}" references undeclared tier "${tt}"`);
      }
    }
    profiles[p.name] = {
      name: p.name,
      description: p.description ?? '',
      tiers: p.tiers ?? [],
      status: p.status,
    };
  }

  _cached = { modules, tiers, profiles };
  return _cached;
}

// ─── queries ─────────────────────────────────────────────────────────

export function listModules(): Module[] {
  return Object.values(loadRegistry().modules);
}

export function getModule(name: string): Module | null {
  return loadRegistry().modules[name] ?? null;
}

export function listTiers(): Tier[] {
  return Object.values(loadRegistry().tiers);
}

export function getTier(name: string): Tier | null {
  return loadRegistry().tiers[name] ?? null;
}

export function listProfiles(): Profile[] {
  return Object.values(loadRegistry().profiles);
}

export function getProfile(name: string): Profile | null {
  return loadRegistry().profiles[name] ?? null;
}

// ─── helpers ─────────────────────────────────────────────────────────

function _detectCycles(modules: Record<string, Module>): void {
  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(name: string, path: string[]): void {
    if (stack.has(name)) {
      throw new Error(`cycle in module deps: ${[...path, name].join(' → ')}`);
    }
    if (visited.has(name)) return;
    visited.add(name);
    stack.add(name);
    const m = modules[name];
    for (const d of m.depends_on) {
      dfs(d, [...path, name]);
    }
    stack.delete(name);
  }

  for (const name of Object.keys(modules)) {
    dfs(name, []);
  }
}
