/**
 * src/registry/seed-rulesets.ts
 *
 * DB-less seed fallback for rulesets and blueprints (Track F1/F2).
 *
 * Reads YAML files from data/registry/{rulesets,blueprints}/ and
 * returns lightweight in-memory objects. These are served by the
 * admin routes when DATABASE_URL is absent (mode: 'seed_readonly').
 *
 * Pattern D: existsSync guard — file absent → console.warn + [].
 * Items carry _seed: true so the UI can show read-only indicators
 * without parsing error strings.
 *
 * Surveillance: seed content describes content choices only. No
 * student or session data.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RULESETS_DIR = path.join(ROOT, 'data/registry/rulesets');
const BLUEPRINTS_DIR = path.join(ROOT, 'data/registry/blueprints');

// ---------------------------------------------------------------------------
// Types — mirror the DB row shapes the routes already return
// ---------------------------------------------------------------------------

export interface SeedRuleset {
  id: string;
  exam_pack_id: string;
  concept_pattern: string;
  rule_text: string;
  enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  _seed: true;
}

export interface SeedBlueprintStage {
  id: string;
  atom_kind: string;
  count?: number;
  difficulty_mix?: { easy: number; medium: number; hard: number };
  rationale_id: string;
  rationale_note?: string;
}

/** Mirrors the ContentBlueprint DB shape so seed data renders without UI changes. */
export interface SeedBlueprint {
  id: string;
  exam_pack_id: string;
  concept_id: string;
  template_version: string;
  arbitrator_version: string | null;
  /** Nested decisions structure, same shape as DB blueprints. */
  decisions: {
    version: 1;
    metadata: { concept_id: string; exam_pack_id: string; target_difficulty: string };
    stages: SeedBlueprintStage[];
    constraints: [];
  };
  confidence: number;
  requires_review: boolean;
  created_by: 'template';
  approved_at: string | null;
  approved_by: string | null;
  superseded_by: string | null;
  created_at: string;
  updated_at: string;
  _seed: true;
}

// ---------------------------------------------------------------------------
// YAML file shapes (raw parse)
// ---------------------------------------------------------------------------

interface RawRuleset {
  id: string;
  concept_pattern?: string;
  rule_text: string;
  enabled?: boolean;
}

interface RawRulesetFile {
  exam_pack_id: string;
  rulesets: RawRuleset[];
}

interface RawStage {
  id: string;
  atom_kind: string;
  count?: number;
  difficulty_mix?: { easy: number; medium: number; hard: number };
  rationale_id: string;
  rationale_note?: string;
}

interface RawBlueprint {
  id: string;
  concept_id: string;
  target_difficulty?: string;
  template_version?: string;
  created_by?: string;
  stages?: RawStage[];
}

interface RawBlueprintFile {
  exam_pack_id: string;
  blueprints: RawBlueprint[];
}

// ---------------------------------------------------------------------------
// Loaders
// ---------------------------------------------------------------------------

const NOW = '2026-01-01T00:00:00.000Z';

function loadRulesetsFromFile(filePath: string): SeedRuleset[] {
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = yaml.load(fs.readFileSync(filePath, 'utf-8')) as RawRulesetFile;
    if (!raw || !Array.isArray(raw.rulesets)) return [];
    return raw.rulesets.map((r) => ({
      id: r.id,
      exam_pack_id: raw.exam_pack_id,
      concept_pattern: r.concept_pattern ?? '%',
      rule_text: r.rule_text,
      enabled: r.enabled !== false,
      created_by: 'seed',
      created_at: NOW,
      updated_at: NOW,
      _seed: true as const,
    }));
  } catch (err) {
    console.warn(`[seed-rulesets] failed to load ${filePath}:`, err);
    return [];
  }
}

function loadBlueprintsFromFile(filePath: string): SeedBlueprint[] {
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = yaml.load(fs.readFileSync(filePath, 'utf-8')) as RawBlueprintFile;
    if (!raw || !Array.isArray(raw.blueprints)) return [];
    return raw.blueprints.map((b) => {
      const targetDifficulty = b.target_difficulty ?? 'medium';
      const stages: SeedBlueprintStage[] = (b.stages ?? []).map((s) => ({
        id: s.id,
        atom_kind: s.atom_kind,
        ...(s.count !== undefined ? { count: s.count } : {}),
        ...(s.difficulty_mix !== undefined ? { difficulty_mix: s.difficulty_mix } : {}),
        rationale_id: s.rationale_id,
        ...(s.rationale_note !== undefined ? { rationale_note: s.rationale_note } : {}),
      }));
      return {
        id: b.id,
        exam_pack_id: raw.exam_pack_id,
        concept_id: b.concept_id,
        template_version: b.template_version ?? 'v1',
        arbitrator_version: null,
        decisions: {
          version: 1 as const,
          metadata: { concept_id: b.concept_id, exam_pack_id: raw.exam_pack_id, target_difficulty: targetDifficulty },
          stages,
          constraints: [] as [],
        },
        confidence: 0.8,
        requires_review: false,
        created_by: 'template' as const,
        approved_at: null,
        approved_by: null,
        superseded_by: null,
        created_at: NOW,
        updated_at: NOW,
        _seed: true as const,
      };
    });
  } catch (err) {
    console.warn(`[seed-blueprints] failed to load ${filePath}:`, err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Singleton caches — loaded once per process
// ---------------------------------------------------------------------------

let _rulesets: SeedRuleset[] | null = null;
let _blueprints: SeedBlueprint[] | null = null;

function getAllSeedRulesets(): SeedRuleset[] {
  if (_rulesets !== null) return _rulesets;
  if (!fs.existsSync(RULESETS_DIR)) {
    console.warn('[seed-rulesets] rulesets directory not found — returning empty set');
    _rulesets = [];
    return _rulesets;
  }
  const results: SeedRuleset[] = [];
  for (const file of fs.readdirSync(RULESETS_DIR)) {
    if (!file.endsWith('.yml') && !file.endsWith('.yaml')) continue;
    results.push(...loadRulesetsFromFile(path.join(RULESETS_DIR, file)));
  }
  _rulesets = results;
  return _rulesets;
}

function getAllSeedBlueprints(): SeedBlueprint[] {
  if (_blueprints !== null) return _blueprints;
  if (!fs.existsSync(BLUEPRINTS_DIR)) {
    console.warn('[seed-blueprints] blueprints directory not found — returning empty set');
    _blueprints = [];
    return _blueprints;
  }
  const results: SeedBlueprint[] = [];
  for (const file of fs.readdirSync(BLUEPRINTS_DIR)) {
    if (!file.endsWith('.yml') && !file.endsWith('.yaml')) continue;
    results.push(...loadBlueprintsFromFile(path.join(BLUEPRINTS_DIR, file)));
  }
  _blueprints = results;
  return _blueprints;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Returns seed rulesets, optionally filtered by exam_pack_id. */
export function getSeedRulesets(examPackId?: string): SeedRuleset[] {
  const all = getAllSeedRulesets();
  return examPackId ? all.filter((r) => r.exam_pack_id === examPackId) : all;
}

/** Returns seed blueprints, optionally filtered by exam_pack_id or concept_id. */
export function getSeedBlueprints(opts?: { examPackId?: string; conceptId?: string }): SeedBlueprint[] {
  let all = getAllSeedBlueprints();
  if (opts?.examPackId) all = all.filter((b) => b.exam_pack_id === opts.examPackId);
  if (opts?.conceptId) all = all.filter((b) => b.concept_id === opts.conceptId);
  return all;
}

/** Returns a single seed blueprint by id, or null. */
export function getSeedBlueprint(id: string): SeedBlueprint | null {
  return getAllSeedBlueprints().find((b) => b.id === id) ?? null;
}
