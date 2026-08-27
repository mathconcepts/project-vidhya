/**
 * Barrel for the blueprint module. Locked v1 — see types.ts for the
 * schema-evolution rule (never mutate v1 in place).
 */

export type {
  AtomKind,
  StageKind,
  DifficultyLabel,
  DifficultyMix,
  BlueprintStage,
  ConstraintSource,
  BlueprintConstraint,
  BlueprintMetadata,
  BlueprintDecisionsV1,
  ContentBlueprint,
  CreatedBy,
  RationaleCode,
} from './types';

export {
  ATOM_KINDS,
  STAGE_KINDS,
  CONSTRAINT_SOURCES,
  RATIONALE_CODES,
} from './types';

export {
  validateDecisions,
  assertValidDecisions,
  type ValidationError,
  type ValidationResult,
} from './validator';

export {
  buildTemplateBlueprint,
  buildIntentBlueprint,
  TEMPLATE_VERSION,
  type TemplateInput,
} from './template-engine';

export {
  INTENT_STAGE_SEQUENCES,
  CONCEPT_DOMINANT_INTENT,
  CONCEPT_INVENTORY_TOTALS,
  DIFFICULTY_LABEL_FROM_CATALOGUE,
  FAMILY_STAGE_SEQUENCES,
  CONCEPT_TEMPLATE_FAMILY,
  type IntentId,
  type GeneratedStage,
  type TemplateFamilyId,
} from './intent-tables.gen';

export {
  insertBlueprint,
  getBlueprint,
  listBlueprints,
  updateBlueprint,
  supersedeBlueprint,
  newBlueprintId,
  type ListFilter,
  type UpdateInput,
  type InsertBlueprintInput,
} from './persistence';

export {
  blueprintToUnitSpec,
  type BlueprintDerivedSpec,
  type StageAnchor,
} from './to-unit-spec';

export {
  computeAnchorId,
} from './anchor-id';

export {
  proposeBlueprint,
  applyOverlay,
  buildJudgePrompt,
  parseJudgeOutput,
  ARBITRATOR_VERSION,
  type ArbitratorInput,
  type ArbitratorResult,
  type LlmJudgeFn,
  type LlmJudgeInput,
  type LlmJudgeOutput,
} from './arbitrator';

export {
  createRuleset,
  listRulesets,
  deleteRuleset,
  setRulesetEnabled,
  applicableRulesets,
  rulesetsToConstraints,
  newRulesetId,
  type BlueprintRuleset,
  type CreateRulesetInput,
} from './rulesets';

export {
  listPresets,
  getPreset,
  installPreset,
  type PresetDescriptor,
  type PresetRulesetSpec,
  type PresetBlueprintSpec,
  type InstallResult,
} from './presets';
