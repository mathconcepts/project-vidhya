export type ModifierType = string;

export interface PromptCompileOptions {
  variables?: Record<string, unknown>;
  modifiers?: ModifierType[];
}
