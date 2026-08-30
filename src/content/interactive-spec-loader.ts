/**
 * src/content/interactive-spec-loader.ts
 *
 * Shared guarded dynamic-import loader for the renderer's own
 * interactive-spec parser (`frontend/src/components/lesson/interactives/types.ts`).
 *
 * Extracted from `concept-orchestrator/orchestrator.ts`'s
 * `loadInteractiveSpecParser` (resonance plan §W4) so every backend consumer
 * that needs to validate or inspect a `` ```interactive-spec``` `` fence goes
 * through ONE loader instead of hand-rolling a second copy of the dynamic
 * import + degradation dance. Resonance plan §W5 (admin coverage figures) is
 * the second consumer; the plan is explicit that this must be "the same
 * guarded loading approach or a shared helper, never a duplicate validator."
 *
 * Why dynamic, not a static top-level `import`: this package's
 * `tsconfig.json` pins `rootDir: "./src"`; a static import reaching into
 * `frontend/src` fails `npm run build` ("File is not under 'rootDir'"), and
 * TypeScript would otherwise try to pull the whole frontend package into this
 * package's compilation.
 *
 * Why guarded (try/catch, cached `null` on failure): `demo/Dockerfile`
 * copies `frontend/dist` into its runtime stage but never `frontend/src`, so
 * the import throws "Cannot find module" in that one image. Every
 * dev/test/CI environment has `frontend/src` on disk and gets the real
 * validator. A static import here would throw at module-evaluation time —
 * before any route handler runs — and take the whole server down; the
 * dynamic + caught form degrades instead: the caller decides what "no
 * validator available" means for its own feature (skip validation, skip a
 * measurement, log once) rather than crashing.
 */

export type ParseInteractiveSpecResult =
  | { ok: true; spec: any; body_without_spec: string }
  | { ok: false; reason: string };
export type ParseInteractiveSpecFn = (body: string) => ParseInteractiveSpecResult;

// Deliberately a runtime-computed specifier, not a string literal directly in
// the `import()` call, so TypeScript resolves the dynamic import to `any`
// instead of pulling frontend/src into this package's `rootDir: "./src"`
// compilation. This file lives at `src/content/`, two levels below the repo
// root, hence `../../frontend/...` (one level shallower than the orchestrator's
// original `../../../frontend/...`, which lived at `src/content/concept-orchestrator/`).
const INTERACTIVE_SPEC_TYPES_MODULE = '../../frontend/src/components/lesson/interactives/types';

let _parseSpecFn: ParseInteractiveSpecFn | null | undefined;

/**
 * Lazily, dynamically imports the renderer's own interactive-spec parser.
 * Cached in module scope after the first call (success or failure) — the
 * import cost, and the "unavailable in this process" warning, are paid at
 * most once per process. Returns `null` when the validator cannot be
 * reached; callers must treat that as "cannot measure/validate", never as
 * "invalid" or "zero".
 */
export async function loadInteractiveSpecParser(): Promise<ParseInteractiveSpecFn | null> {
  if (_parseSpecFn !== undefined) return _parseSpecFn;
  let resolved: ParseInteractiveSpecFn | null;
  try {
    const mod: any = await import(INTERACTIVE_SPEC_TYPES_MODULE);
    resolved = typeof mod.parseInteractiveSpec === 'function' ? mod.parseInteractiveSpec : null;
  } catch (err) {
    console.warn(
      `[interactive-spec-loader] interactive-spec validator unavailable in this process (${(err as Error).message})`,
    );
    resolved = null;
  }
  _parseSpecFn = resolved;
  return resolved;
}

/** Test-only: clears the module-scope cache so a fresh load is exercised. */
export function _resetInteractiveSpecParserCacheForTests(): void {
  _parseSpecFn = undefined;
}
