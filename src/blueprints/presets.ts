/**
 * src/blueprints/presets.ts
 *
 * Pre-built starter packs that an admin can install with one click.
 *
 * Each preset is a hand-curated bundle of (rulesets + blueprints) for
 * a known scenario — e.g. "JEE Main, anxious cohort, state-board prior
 * curriculum". The whole point: get a new admin from /admin/journey
 * milestone 1 to milestone 4 in a single click instead of authoring
 * 4 rulesets + 3 blueprints from scratch.
 *
 * Presets are LITERAL (defined in TS, not the DB). The install path
 * creates DB rows by calling the existing createRuleset() and
 * insertBlueprint(). Idempotent: re-installing the same preset skips
 * rulesets with identical rule_text and skips blueprints whose
 * (concept_id, exam_pack_id) already has a non-superseded row.
 *
 * Surveillance discipline: presets describe content choices only. No
 * student-facing fields, no behavioural language. The same validator
 * + invariant 8 that gates manual rulesets/blueprints applies here.
 */

import {
  createRuleset,
  listRulesets,
  insertBlueprint,
  listBlueprints,
  buildTemplateBlueprint,
  TEMPLATE_VERSION,
} from './index';
import type { DifficultyLabel } from './types';

export interface PresetRulesetSpec {
  concept_pattern?: string;
  rule_text: string;
}

export interface PresetBlueprintSpec {
  concept_id: string;
  target_difficulty: DifficultyLabel;
  topic_family?: string;
  requires_pyq_anchor?: boolean;
}

export interface PresetDescriptor {
  id: string;
  name: string;
  exam_pack_id: string;
  description: string;
  cohort_hint: string;
  rulesets: PresetRulesetSpec[];
  blueprints: PresetBlueprintSpec[];
}

// ----------------------------------------------------------------------------
// The locked v1 preset library. Add new presets forward; never mutate
// existing ones (operators may have installed them; mutating breaks
// the lift-ledger groupby).
// ----------------------------------------------------------------------------

export const PRESETS: ReadonlyArray<PresetDescriptor> = [
  {
    id: 'jee-main-tn-anxious',
    name: 'JEE Main · TN board · anxious cohort',
    exam_pack_id: 'jee-main',
    description:
      'Starter pack for Tamil Nadu state-board class 12 students preparing for IIT JEE Main, ' +
      'several anxious post-mid-term. Four cohort rulesets + three concept blueprints (limits, ' +
      'derivatives, continuity).',
    cohort_hint: 'Pair with the priya-cbse-12-anxious or anitha-tn-12-anxious persona for validation.',
    rulesets: [
      {
        concept_pattern: '%',
        rule_text:
          'Lead with intuition before any formal definition. These students freeze when jargon ' +
          'appears first.',
      },
      {
        concept_pattern: '%',
        rule_text:
          'Where possible, tie new concepts to the Tamil Nadu Class 12 syllabus — students ' +
          'recognise vectors and calculus from the state board, but the JEE framings push further. ' +
          'Build on what they already trust.',
      },
      {
        concept_pattern: '%',
        rule_text:
          'Default tone: gentle and concrete. One step at a time. Avoid "obviously", "clearly", ' +
          '"trivially", and any phrasing that implies a missed concept is unusual.',
      },
      {
        concept_pattern: '%',
        rule_text:
          'When introducing a new technique, anchor it to a real PYQ from the last 5 years. ' +
          'These students have been told for a year that JEE is hard; show them the actual ' +
          'question is approachable.',
      },
    ],
    blueprints: [
      { concept_id: 'limits-jee', target_difficulty: 'medium', topic_family: 'calculus', requires_pyq_anchor: true },
      { concept_id: 'derivatives-basic', target_difficulty: 'medium', topic_family: 'calculus', requires_pyq_anchor: true },
      { concept_id: 'continuity-differentiability-jee', target_difficulty: 'medium', topic_family: 'calculus', requires_pyq_anchor: true },
    ],
  },
  {
    id: 'jee-main-cbse-driven',
    name: 'JEE Main · CBSE board · driven cohort',
    exam_pack_id: 'jee-main',
    description:
      'Starter pack for CBSE class 12 students who are confident and want crisp, rigorous ' +
      'treatment. Two cohort rulesets emphasising rigor + edge cases; three concept blueprints ' +
      'at hard difficulty.',
    cohort_hint: 'Pair with the arjun-iit-driven persona for validation.',
    rulesets: [
      {
        concept_pattern: '%',
        rule_text:
          'Default tone: crisp, no fluff. Skip introductory framing for concepts these students ' +
          'have likely seen at school. Lead with the formal statement, then walk an edge case.',
      },
      {
        concept_pattern: '%',
        rule_text:
          'Include at least one "watch out for" subtlety per concept — sign error in chain rule, ' +
          'discontinuity at endpoints, etc. Driven students want to feel the concept tested at ' +
          'its corners.',
      },
    ],
    blueprints: [
      { concept_id: 'limits-jee', target_difficulty: 'hard', topic_family: 'calculus', requires_pyq_anchor: true },
      { concept_id: 'derivatives-basic', target_difficulty: 'hard', topic_family: 'calculus', requires_pyq_anchor: true },
      { concept_id: 'continuity-differentiability-jee', target_difficulty: 'hard', topic_family: 'calculus', requires_pyq_anchor: true },
    ],
  },
];

export function listPresets(): PresetDescriptor[] {
  return [...PRESETS];
}

export function getPreset(id: string): PresetDescriptor | null {
  return PRESETS.find((p) => p.id === id) ?? null;
}

// ----------------------------------------------------------------------------
// Install path
// ----------------------------------------------------------------------------

export interface InstallResult {
  preset_id: string;
  rulesets_created: string[];
  rulesets_skipped: number;
  blueprints_created: string[];
  blueprints_skipped: number;
}

/**
 * Idempotent install: skips rulesets whose rule_text already exists for
 * the same exam_pack, and blueprints whose (concept_id, exam_pack_id)
 * already has a non-superseded row.
 *
 * Returns IDs of created rows so the caller can pre-fill UI selections.
 */
export async function installPreset(preset_id: string, created_by: string): Promise<InstallResult | null> {
  const preset = getPreset(preset_id);
  if (!preset) return null;

  const rulesets_created: string[] = [];
  let rulesets_skipped = 0;

  // Read existing rulesets once; check rule_text equality for idempotency.
  const existingRulesets = await listRulesets({ exam_pack_id: preset.exam_pack_id });
  const existingTexts = new Set(existingRulesets.map((r) => r.rule_text.trim()));

  for (const spec of preset.rulesets) {
    if (existingTexts.has(spec.rule_text.trim())) {
      rulesets_skipped++;
      continue;
    }
    try {
      const r = await createRuleset({
        exam_pack_id: preset.exam_pack_id,
        concept_pattern: spec.concept_pattern,
        rule_text: spec.rule_text,
        created_by,
        enabled: true,
      });
      if (r) rulesets_created.push(r.id);
    } catch {
      rulesets_skipped++;
    }
  }

  const blueprints_created: string[] = [];
  let blueprints_skipped = 0;

  for (const spec of preset.blueprints) {
    const existing = await listBlueprints({
      exam_pack_id: preset.exam_pack_id,
      concept_id: spec.concept_id,
      limit: 1,
    });
    if (existing.length > 0) {
      blueprints_skipped++;
      continue;
    }
    const decisions = buildTemplateBlueprint({
      concept_id: spec.concept_id,
      exam_pack_id: preset.exam_pack_id,
      target_difficulty: spec.target_difficulty,
      topic_family: spec.topic_family,
      requires_pyq_anchor: spec.requires_pyq_anchor,
    });
    try {
      const bp = await insertBlueprint({
        exam_pack_id: preset.exam_pack_id,
        concept_id: spec.concept_id,
        decisions,
        template_version: TEMPLATE_VERSION,
        created_by: 'template',
      });
      if (bp) blueprints_created.push(bp.id);
    } catch {
      blueprints_skipped++;
    }
  }

  return {
    preset_id,
    rulesets_created,
    rulesets_skipped,
    blueprints_created,
    blueprints_skipped,
  };
}

export const __testing = {
  PRESETS,
};
