/**
 * src/blueprints/validator.ts
 *
 * Runtime validation of BlueprintDecisionsV1. Rejects malformed
 * blueprints BEFORE they reach the orchestrator. Used by:
 *   - the persistence layer on INSERT/UPDATE (refuses bad rows)
 *   - the admin REST PATCH (returns 400 with a structured error)
 *   - the orchestrator read path (falls through to legacy on bad data)
 *
 * Surveillance check: refuses any decisions JSONB containing a key
 * whose name matches /user_id|session_id|student_id|behavior|tracked_/i
 * at any depth. Defense-in-depth — the migration grep + this runtime
 * check together cover both write paths.
 */

import {
  ATOM_KINDS,
  STAGE_KINDS,
  CONSTRAINT_SOURCES,
  type BlueprintDecisionsV1,
  type AtomKind,
  type StageKind,
  type ConstraintSource,
  type DifficultyLabel,
} from './types';

export interface ValidationError {
  path: string;
  reason: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
}

const SURVEILLANCE_FORBIDDEN = /(?:^|_)(user_id|session_id|student_id|behavior|tracked|surveillance)(?:_|$)/i;
const VALID_DIFFICULTIES: ReadonlyArray<DifficultyLabel> = ['easy', 'medium', 'hard'];

export function validateDecisions(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const at = (path: string, reason: string) => errors.push({ path, reason });

  if (!value || typeof value !== 'object') {
    return { ok: false, errors: [{ path: '', reason: 'decisions must be an object' }] };
  }
  const d = value as Record<string, unknown>;

  // version
  if (d.version !== 1) at('version', `must be 1 (got ${JSON.stringify(d.version)})`);

  // metadata
  const meta = d.metadata as Record<string, unknown> | undefined;
  if (!meta || typeof meta !== 'object') {
    at('metadata', 'required');
  } else {
    if (typeof meta.concept_id !== 'string' || meta.concept_id.length === 0) {
      at('metadata.concept_id', 'required string');
    }
    if (typeof meta.exam_pack_id !== 'string' || meta.exam_pack_id.length === 0) {
      at('metadata.exam_pack_id', 'required string');
    }
    if (!VALID_DIFFICULTIES.includes(meta.target_difficulty as DifficultyLabel)) {
      at('metadata.target_difficulty', `must be one of ${VALID_DIFFICULTIES.join('|')}`);
    }
  }

  // stages
  if (!Array.isArray(d.stages)) {
    at('stages', 'must be an array');
  } else if (d.stages.length === 0) {
    at('stages', 'must have at least one stage');
  } else {
    d.stages.forEach((s, i) => validateStage(s, `stages[${i}]`, at));
  }

  // constraints
  if (!Array.isArray(d.constraints)) {
    at('constraints', 'must be an array');
  } else {
    d.constraints.forEach((c, i) => validateConstraint(c, `constraints[${i}]`, at));
  }

  // surveillance: deep grep for forbidden field names
  walkKeys(d, '', (key, path) => {
    if (SURVEILLANCE_FORBIDDEN.test(key)) {
      at(path, `surveillance: field name "${key}" is forbidden in blueprints`);
    }
  });

  return { ok: errors.length === 0, errors };
}

function validateStage(stage: unknown, path: string, at: (p: string, r: string) => void): void {
  if (!stage || typeof stage !== 'object') return at(path, 'must be an object');
  const s = stage as Record<string, unknown>;

  if (!STAGE_KINDS.includes(s.id as StageKind)) {
    at(`${path}.id`, `must be one of ${STAGE_KINDS.join('|')}`);
  }
  if (!ATOM_KINDS.includes(s.atom_kind as AtomKind)) {
    at(`${path}.atom_kind`, `must be one of ${ATOM_KINDS.join('|')}`);
  }
  if (typeof s.rationale_id !== 'string' || s.rationale_id.length === 0) {
    at(`${path}.rationale_id`, 'required string');
  }
  if (s.rationale_note !== undefined && typeof s.rationale_note !== 'string') {
    at(`${path}.rationale_note`, 'must be a string when present');
  }

  // practice stages MUST declare count + difficulty_mix
  if (s.id === 'practice') {
    if (typeof s.count !== 'number' || s.count <= 0 || !Number.isInteger(s.count)) {
      at(`${path}.count`, 'practice stages require a positive integer count');
    }
    if (!s.difficulty_mix || typeof s.difficulty_mix !== 'object') {
      at(`${path}.difficulty_mix`, 'practice stages require a difficulty_mix');
    } else {
      const m = s.difficulty_mix as Record<string, unknown>;
      const sum = (Number(m.easy) || 0) + (Number(m.medium) || 0) + (Number(m.hard) || 0);
      if (sum !== 100) {
        at(`${path}.difficulty_mix`, `must sum to 100 (got ${sum})`);
      }
      for (const k of ['easy', 'medium', 'hard']) {
        const v = (m as Record<string, unknown>)[k];
        if (typeof v !== 'number' || v < 0 || v > 100) {
          at(`${path}.difficulty_mix.${k}`, 'must be 0..100');
        }
      }
    }
  }
}

function validateConstraint(c: unknown, path: string, at: (p: string, r: string) => void): void {
  if (!c || typeof c !== 'object') return at(path, 'must be an object');
  const x = c as Record<string, unknown>;
  if (typeof x.id !== 'string' || x.id.length === 0) {
    at(`${path}.id`, 'required string');
  }
  if (!CONSTRAINT_SOURCES.includes(x.source as ConstraintSource)) {
    at(`${path}.source`, `must be one of ${CONSTRAINT_SOURCES.join('|')}`);
  }
}

function walkKeys(value: unknown, path: string, visit: (key: string, path: string) => void): void {
  if (Array.isArray(value)) {
    value.forEach((v, i) => walkKeys(v, `${path}[${i}]`, visit));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [k, v] of Object.entries(value)) {
    const p = path ? `${path}.${k}` : k;
    visit(k, p);
    walkKeys(v, p, visit);
  }
}

/** Convenience: throws on invalid; used at trust boundaries. */
export function assertValidDecisions(value: unknown): asserts value is BlueprintDecisionsV1 {
  const r = validateDecisions(value);
  if (!r.ok) {
    const summary = r.errors.map((e) => `${e.path}: ${e.reason}`).join('; ');
    throw new Error(`invalid blueprint decisions: ${summary}`);
  }
}
