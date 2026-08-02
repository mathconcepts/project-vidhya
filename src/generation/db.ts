/**
 * src/generation/db.ts
 *
 * Pool helper for the generation module. Delegates to the single shared
 * pool in src/storage/pool.ts (CEO plan Phase 0 §5 storage boundary) —
 * this used to build its own independent `pg.Pool({ max: 5 })`, one of
 * ~65 near-identical copies across the codebase. Kept as a thin
 * re-export so existing `getGenerationPool()` callers need zero changes.
 * Returns null in DB-less mode so callers no-op gracefully.
 */

import type pg from 'pg';
import { getSharedPool } from '../storage/pool';

export function getGenerationPool(): pg.Pool | null {
  return getSharedPool();
}
