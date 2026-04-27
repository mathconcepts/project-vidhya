// @ts-nocheck
/**
 * src/orchestrator/composer.ts
 *
 * Given a deployment profile, resolve:
 *   - which tiers are active
 *   - the transitive union of modules those tiers need
 *   - a load order respecting depends_on (topological sort)
 *   - which env vars are required for the chosen tiers
 *
 * The composer is the decision function that turns declarative
 * modules.yaml + a profile into an actionable deployment plan.
 */

import { loadRegistry, type Module, type Tier, type Profile } from './registry';

export interface ComposedDeployment {
  profile_name:    string;
  profile_desc:    string;
  active_tiers:    Tier[];
  active_modules:  Module[];              // in load order
  required_env:    string[];              // union of all tiers' requires_env
  warnings:        string[];              // non-fatal issues
  errors:          string[];              // fatal — deployment should not start
}

/**
 * Compose a deployment from a profile name.
 */
export function composeDeployment(profile_name: string): ComposedDeployment {
  const reg = loadRegistry();
  const profile = reg.profiles[profile_name];

  if (!profile) {
    return {
      profile_name,
      profile_desc: '',
      active_tiers: [],
      active_modules: [],
      required_env: [],
      warnings: [],
      errors: [`profile "${profile_name}" does not exist; available: ${Object.keys(reg.profiles).join(', ')}`],
    };
  }

  const active_tiers: Tier[] = profile.tiers.map(t => reg.tiers[t]);
  const warnings: string[] = [];
  const errors: string[] = [];

  // Union of modules across active tiers
  const needed_module_names = new Set<string>();
  for (const t of active_tiers) {
    for (const m of t.modules) needed_module_names.add(m);
  }

  // Foundation modules (e.g. core, auth) are implicitly part of every
  // composition — every tier needs them, so requiring each tier to
  // list them is busywork. Add them after the tier-driven union.
  for (const m of Object.values(reg.modules)) {
    if (m.foundation) needed_module_names.add(m.name);
  }

  // Transitive closure of depends_on
  function closure(name: string, acc: Set<string>): void {
    if (acc.has(name)) return;
    acc.add(name);
    const m = reg.modules[name];
    if (!m) return;
    for (const d of m.depends_on) closure(d, acc);
  }
  const all_needed = new Set<string>();
  for (const n of needed_module_names) closure(n, all_needed);

  // Topological sort by depends_on
  const load_order: Module[] = [];
  const visited = new Set<string>();
  function visit(name: string): void {
    if (visited.has(name)) return;
    const m = reg.modules[name];
    if (!m) return;
    for (const d of m.depends_on) visit(d);
    visited.add(name);
    load_order.push(m);
  }
  for (const n of all_needed) visit(n);

  // Required env vars across all active tiers
  const required_env_set = new Set<string>();
  for (const t of active_tiers) {
    for (const e of t.requires_env ?? []) required_env_set.add(e);
  }
  const required_env = [...required_env_set];

  // Warn on planned/future/stub tiers
  for (const t of active_tiers) {
    if (t.status === 'planned') {
      warnings.push(`tier "${t.name}" is planned; activation may not be fully wired`);
    } else if (t.status === 'future') {
      errors.push(`tier "${t.name}" is future — modules it needs do not exist yet`);
    } else if (t.status === 'stub') {
      warnings.push(`tier "${t.name}" is in stub mode; see its notes: ${t.notes ?? '(none)'}`);
    }
  }

  // Warn on missing required env
  for (const env of required_env) {
    if (!process.env[env]) {
      warnings.push(`env var ${env} is required for an active tier but not set`);
    }
  }

  return {
    profile_name: profile.name,
    profile_desc: profile.description,
    active_tiers,
    active_modules: load_order,
    required_env,
    warnings,
    errors,
  };
}

/**
 * Compose from an ad-hoc tier list (not a named profile).
 */
export function composeFromTiers(tier_names: string[]): ComposedDeployment {
  return composeDeployment(`__ad_hoc_${Date.now()}`) /* would be implemented */
    || {
      profile_name: '__ad_hoc__',
      profile_desc: 'ad-hoc tier selection',
      active_tiers: [],
      active_modules: [],
      required_env: [],
      warnings: [],
      errors: ['composeFromTiers not yet implemented — use a named profile'],
    };
}

/**
 * Produce a DOT-format dependency graph. Useful for
 * `dot -Tpng deps.dot -o deps.png` visualisations.
 */
export function renderDependencyGraph(): string {
  const reg = loadRegistry();
  const lines: string[] = ['digraph modules {'];
  lines.push('  rankdir=BT;');
  lines.push('  node [shape=box, style=filled, fillcolor=lightblue];');
  for (const m of Object.values(reg.modules)) {
    const label = m.subrepo_candidate ? `${m.name}\\n(subrepo)` : m.name;
    const color = m.subrepo_candidate ? 'lightyellow' : 'lightblue';
    lines.push(`  "${m.name}" [label="${label}", fillcolor=${color}];`);
    for (const d of m.depends_on) {
      lines.push(`  "${m.name}" -> "${d}";`);
    }
  }
  lines.push('}');
  return lines.join('\n');
}
