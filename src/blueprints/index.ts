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
  TEMPLATE_VERSION,
  type TemplateInput,
} from './template-engine';

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
} from './to-unit-spec';
