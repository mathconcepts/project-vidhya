/**
 * Build Content Bundle (CLI)
 *
 * Thin wrapper over src/content/build-content-bundle.ts — same pattern as
 * scripts/verify-wolfram-batch.ts wrapping src/services/wolfram-service.ts.
 * The logic lives in src/ so src/jobs/nightly-content-chain.ts can call it
 * in-process; this script is only the `npm run content:bundle` entrypoint.
 *
 * Run after scrape + generate + explainers. See src/content/
 * build-content-bundle.ts's docblock for inputs/output shape.
 */

import { buildContentBundle } from '../src/content/build-content-bundle';

buildContentBundle();
