/**
 * src/content/prompt-registry/resources/personas.ts
 *
 * Wraps Phase B personalization's student_context payload
 * (src/personalization/student-context.ts) as a 'persona' PromptResource.
 * Unlike orchestrator.ts's own decoupled dynamic-import of
 * toPromptText() (kept that way so orchestrator.ts survives the
 * personalization module being removed), this new module imports it
 * directly — the prompt-registry package already depends on Vidhya's
 * content layer, so there is no decoupling benefit to preserve here.
 */

import { toPromptText, type StudentContext } from '../../../personalization/student-context';
import type { PromptResource, PromptResourceBuildArgs } from '../types';
import { registerPromptResource } from '../registry';

export const studentContextPersona: PromptResource = {
  resource_id: 'persona.student_context',
  version: '1.0.0',
  category: 'persona',
  topics: ['*'],
  required_inputs: ['student_context'],
  outputs: ['student_context_block'],
  approval_state: 'released',
  evidence_requirements: ['built on demand from student_model + error_log + exam_profile_store + knowledge/tracks (Phase B personalization plan); never persisted'],
  compatibility: [],
  rollback_target: null,
  test_fixtures: ['returns "" when student_context is absent', 'returns "" for is_neutral context', 'renders a non-neutral context as a verbose prefix'],
  build(args: PromptResourceBuildArgs): string {
    if (!args.student_context) return '';
    try {
      const text = toPromptText(args.student_context as StudentContext);
      return text ? `${text}\n\n---\n\n` : '';
    } catch {
      return '';
    }
  },
};

export function registerPersonaResources(): void {
  registerPromptResource(studentContextPersona);
}
