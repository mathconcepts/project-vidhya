// @ts-nocheck
/**
 * Session plan store — persists generated plans for audit + history.
 *
 * Append-only convention matching the admin-orchestrator stores.
 * Stores plans keyed by id with a secondary index on student_id so
 * "show me my recent plans" is O(entries) but fast enough for
 * realistic scale (a student generates maybe 5-10 plans per day).
 *
 * Separation of concerns: the pure planner in planner.ts doesn't
 * touch this. The HTTP route calls the planner, then asks this
 * module to persist the result.
 */

import { createFlatFileStore } from '../lib/flat-file-store';
import type { SessionPlan } from './types';

interface StoreShape {
  plans: SessionPlan[];
}

const STORE_PATH = '.data/session-plans.json';
const _store = createFlatFileStore<StoreShape>({
  path: STORE_PATH,
  defaultShape: () => ({ plans: [] }),
});

// Soft cap: keep last N plans per student. Older plans are pruned
// lazily on writes so the store doesn't grow unbounded across months.
const MAX_PLANS_PER_STUDENT = 50;

export function savePlan(plan: SessionPlan): void {
  const store = _store.read();
  store.plans.push(plan);

  // Prune — keep most-recent MAX_PLANS_PER_STUDENT per student_id.
  const byStudent = new Map<string, SessionPlan[]>();
  for (const p of store.plans) {
    const key = p.request.student_id;
    if (!byStudent.has(key)) byStudent.set(key, []);
    byStudent.get(key)!.push(p);
  }
  const pruned: SessionPlan[] = [];
  for (const [, plans] of byStudent) {
    plans.sort((a, b) => b.generated_at.localeCompare(a.generated_at));
    pruned.push(...plans.slice(0, MAX_PLANS_PER_STUDENT));
  }
  _store.write({ plans: pruned });
}

export function getPlan(id: string): SessionPlan | null {
  const store = _store.read();
  return store.plans.find(p => p.id === id) ?? null;
}

export function listPlansForStudent(student_id: string, limit = 20): SessionPlan[] {
  const store = _store.read();
  return store.plans
    .filter(p => p.request.student_id === student_id)
    .sort((a, b) => b.generated_at.localeCompare(a.generated_at))
    .slice(0, limit);
}

export function listAllPlans(limit = 100): SessionPlan[] {
  const store = _store.read();
  return store.plans
    .slice()
    .sort((a, b) => b.generated_at.localeCompare(a.generated_at))
    .slice(0, limit);
}

/** Test-only reset. */
export function _resetPlanStore(): void {
  _store.write({ plans: [] });
}
