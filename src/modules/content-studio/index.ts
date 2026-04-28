// @ts-nocheck
/**
 * src/modules/content-studio/index.ts
 *
 * Public surface of the content-studio module.
 *
 * What this module owns:
 *   - The ContentDraft schema and StudioEvent log
 *   - Four source adapters: uploads, wolfram, url-extract, llm
 *   - The generation orchestrator (generateDraft) that walks
 *     sources_to_try in priority order
 *   - The promotion path (approveDraft) that ships an approved
 *     draft into the content library
 *   - Edit / reject lifecycle for drafts pre-approval
 *
 * What this module does NOT own:
 *   - The content library itself (still in src/content-library)
 *   - Routing / serving (still in src/content/router.ts)
 *   - The student model or task reasoner (still in src/gbrain)
 *   - The teaching turn store (still in src/teaching)
 *
 * The studio is a creation workflow that feeds the library. Studio
 * drafts are pre-approval; library entries are post-approval.
 *
 * See STUDIO.md for the contract, the four sources with their
 * scopes, and the approval workflow.
 */

export type {
  ContentDraft,
  GenerationRequest,
  StudioEvent,
  StudioEventKind,
  StudioDraftStatus,
  StudioSourceKind,
  SourceAttempt,
} from '../../content-studio/types';

export {
  generateDraft,
  getDraft,
  listDrafts,
  editDraft,
  approveDraft,
  rejectDraft,
  getStats,
} from '../../content-studio/store';
