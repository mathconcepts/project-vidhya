/**
 * src/content/wizard-route-loader.ts
 *
 * Shared guarded dynamic-import loader for the frontend's own
 * `wizardRouteForConcept` (`frontend/src/data/method-selection-trainers.ts`)
 * — the resolver that turns a bare concept id into a ready-to-navigate
 * method-selection-wizard route. Same pattern as `interactive-spec-loader.ts`
 * in this directory (read that file's doc comment for the full rationale);
 * this file exists because `student-audit.ts` (weak-prerequisite follow-up,
 * 2026-09-04) needs the SAME concept→route mapping the frontend already
 * owns, and duplicating `CONCEPT_TO_WIZARD_NODE` here would be exactly the
 * "parallel truths that drift" bug class this repo has hit before (see
 * CLAUDE.md's v4.25.0 section on the model-id drift).
 *
 * Why dynamic, not a static top-level `import`: this package's
 * `tsconfig.json` pins `rootDir: "./src"`; a static import reaching into
 * `frontend/src` fails `npm run build` ("File is not under 'rootDir'").
 *
 * Why guarded (try/catch, cached `null` on failure): `demo/Dockerfile`
 * copies `frontend/dist` into its runtime stage but never `frontend/src`,
 * so the import throws "Cannot find module" in that one image. Every
 * dev/test/CI environment has `frontend/src` on disk and gets the real
 * resolver. A caller that gets `null` back must treat that as "cannot
 * resolve a wizard route right now" — never as "no wizard exists".
 */

export type WizardRouteForConceptFn = (conceptId: string | null | undefined) => string | null;

const METHOD_SELECTION_TRAINERS_MODULE = '../../frontend/src/data/method-selection-trainers';

let _wizardRouteFn: WizardRouteForConceptFn | null | undefined;
let _warnedUnavailable = false;

/**
 * Lazily, dynamically imports the frontend's real `wizardRouteForConcept`.
 * A SUCCESSFUL load is cached in module scope; a FAILED load is not — the
 * expected failure (the demo image ships without `frontend/src`) is
 * permanent and cheap to re-hit, while a transient one must not condemn the
 * whole process lifetime to "cannot resolve". Returns `null` when the
 * resolver cannot be reached.
 */
export async function loadWizardRouteResolver(): Promise<WizardRouteForConceptFn | null> {
  if (_wizardRouteFn !== undefined && _wizardRouteFn !== null) return _wizardRouteFn;
  try {
    const mod: any = await import(METHOD_SELECTION_TRAINERS_MODULE);
    const resolved: WizardRouteForConceptFn | null =
      typeof mod.wizardRouteForConcept === 'function' ? mod.wizardRouteForConcept : null;
    _wizardRouteFn = resolved;
    return resolved;
  } catch (err) {
    if (!_warnedUnavailable) {
      _warnedUnavailable = true;
      console.warn(
        `[wizard-route-loader] wizard route resolver unavailable in this process (${(err as Error).message})`,
      );
    }
    return null;
  }
}

/** Test-only: clears the module-scope cache so a fresh load is exercised. */
export function _resetWizardRouteResolverCacheForTests(): void {
  _wizardRouteFn = undefined;
  _warnedUnavailable = false;
}
