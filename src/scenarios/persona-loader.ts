/**
 * src/scenarios/persona-loader.ts
 *
 * Loads + validates `data/personas/*.yaml` into typed Persona objects.
 *
 * Personas describe SCRIPTED demo students for the scenario runner. They
 * are NOT real users — the runner seeds a namespaced student_model row
 * with a deterministic UUID derived from the persona id (see
 * persona-seeder.ts).
 *
 * Schema is versioned (schema_version: 1). Future shape changes ship as
 * v: 2; we never mutate v: 1 in place.
 *
 * Surveillance discipline: persona files MUST NOT contain real UUIDs,
 * real session ids, or any PII. CI invariant test enforces this.
 */

import fs from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';

export type RepresentationMode = 'algebraic' | 'geometric' | 'numerical' | 'balanced';
export type MotivationState = 'driven' | 'steady' | 'flagging' | 'frustrated' | 'anxious';

export interface PersonaSeed {
  representation_mode: RepresentationMode;
  motivation_state: MotivationState;
  knowledge_track_id: string;
  exam_id: string;
  initial_mastery: Record<string, number>;
  recent_misconceptions: string[];
}

export type PolicyAction =
  | { on: 'first_exposure'; action: 'pick_distractor_kind'; kind: string; probability: number }
  | { on: 'default'; action: 'pick_correct'; probability_fn: 'mastery_plus_0_2' };

export interface AnswerPolicy {
  type: 'scripted';
  rules: PolicyAction[];
}

export interface Persona {
  schema_version: 1;
  id: string;
  display_name: string;
  description: string;
  seed: PersonaSeed;
  answer_policy: AnswerPolicy;
}

const REP_MODES: ReadonlySet<string> = new Set(['algebraic', 'geometric', 'numerical', 'balanced']);
const MOTIVATION_STATES: ReadonlySet<string> = new Set(['driven', 'steady', 'flagging', 'frustrated', 'anxious']);

const PERSONAS_DIR = path.join(process.cwd(), 'data', 'personas');

export function loadPersona(idOrPath: string): Persona {
  const filePath = idOrPath.endsWith('.yaml') || idOrPath.includes('/')
    ? idOrPath
    : path.join(PERSONAS_DIR, `${idOrPath}.yaml`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Persona not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = parseYaml(raw);
  return validatePersona(parsed, filePath);
}

export function listPersonaIds(dir: string = PERSONAS_DIR): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => f.slice(0, -'.yaml'.length))
    .sort();
}

/** Exposed for tests; throws on any structural problem. */
export function validatePersona(parsed: unknown, sourcePath: string): Persona {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`${sourcePath}: persona must be a YAML object`);
  }
  const p = parsed as Record<string, unknown>;

  if (p.schema_version !== 1) {
    throw new Error(`${sourcePath}: schema_version must be 1 (got ${p.schema_version})`);
  }
  if (typeof p.id !== 'string' || !/^[a-z0-9-]+$/.test(p.id)) {
    throw new Error(`${sourcePath}: id must be a slug (lowercase letters/digits/hyphen)`);
  }
  if (typeof p.display_name !== 'string' || p.display_name.length === 0) {
    throw new Error(`${sourcePath}: display_name required`);
  }
  if (typeof p.description !== 'string') {
    throw new Error(`${sourcePath}: description required`);
  }

  const seed = p.seed as Record<string, unknown> | undefined;
  if (!seed || typeof seed !== 'object') {
    throw new Error(`${sourcePath}: seed required`);
  }
  if (!REP_MODES.has(seed.representation_mode as string)) {
    throw new Error(`${sourcePath}: seed.representation_mode invalid`);
  }
  if (!MOTIVATION_STATES.has(seed.motivation_state as string)) {
    throw new Error(`${sourcePath}: seed.motivation_state invalid`);
  }
  if (typeof seed.knowledge_track_id !== 'string') {
    throw new Error(`${sourcePath}: seed.knowledge_track_id required`);
  }
  if (typeof seed.exam_id !== 'string') {
    throw new Error(`${sourcePath}: seed.exam_id required`);
  }
  if (!seed.initial_mastery || typeof seed.initial_mastery !== 'object') {
    throw new Error(`${sourcePath}: seed.initial_mastery required`);
  }
  for (const [k, v] of Object.entries(seed.initial_mastery as Record<string, unknown>)) {
    if (typeof v !== 'number' || v < 0 || v > 1) {
      throw new Error(`${sourcePath}: seed.initial_mastery[${k}] must be 0..1`);
    }
  }
  if (!Array.isArray(seed.recent_misconceptions)) {
    throw new Error(`${sourcePath}: seed.recent_misconceptions must be an array`);
  }

  const policy = p.answer_policy as Record<string, unknown> | undefined;
  if (!policy || policy.type !== 'scripted') {
    throw new Error(`${sourcePath}: answer_policy.type must be 'scripted'`);
  }
  if (!Array.isArray(policy.rules)) {
    throw new Error(`${sourcePath}: answer_policy.rules must be an array`);
  }
  for (const rule of policy.rules as Record<string, unknown>[]) {
    if (rule.on === 'first_exposure') {
      if (rule.action !== 'pick_distractor_kind') {
        throw new Error(`${sourcePath}: first_exposure rule must use pick_distractor_kind`);
      }
      if (typeof rule.kind !== 'string') {
        throw new Error(`${sourcePath}: first_exposure rule needs kind`);
      }
      const prob = rule.probability as number;
      if (typeof prob !== 'number' || prob < 0 || prob > 1) {
        throw new Error(`${sourcePath}: first_exposure rule probability must be 0..1`);
      }
    } else if (rule.on === 'default') {
      if (rule.action !== 'pick_correct') {
        throw new Error(`${sourcePath}: default rule must use pick_correct`);
      }
      if (rule.probability_fn !== 'mastery_plus_0_2') {
        throw new Error(`${sourcePath}: default rule probability_fn must be mastery_plus_0_2`);
      }
    } else {
      throw new Error(`${sourcePath}: unknown rule.on=${rule.on}`);
    }
  }

  return parsed as Persona;
}
