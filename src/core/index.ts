/**
 * src/core — the 100x Blueprint barrel.
 *
 * Re-exports every layer interface from a single import path so callers
 * write `import type { Scorer, ItemSelector } from '../core'` instead of
 * reaching into the layered-interfaces file directly.
 *
 * Implementations live next to the domain code; see interfaces.ts for
 * the full layer map.
 */

export * from './interfaces';
