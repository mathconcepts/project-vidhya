// @ts-nocheck
/**
 * Task Store — tasks derived from strategies; the work-queue layer.
 *
 * When a strategy is accepted (or auto-enqueued), its proposed_tasks are
 * materialized as Tasks. Each Task carries:
 *   - a back-reference to its strategy
 *   - an assigned_role (which the task is routed to)
 *   - an activity_log (every state change is recorded)
 *   - dependencies on other tasks (if any)
 *
 * Tasks flow: open -> in_progress -> done (or blocked / cancelled).
 *
 * The activity log is append-only. Every transition appends one entry.
 */

import { createFlatFileStore } from '../lib/flat-file-store';
import type { Task, TaskStatus, TaskActivityEntry, Strategy, ProposedTask, RoleId } from './types';

// ============================================================================

interface StoreShape {
  tasks: Task[];
}

const STORE_PATH = '.data/admin-orchestrator-tasks.json';
const _store = createFlatFileStore<StoreShape>({
  path: STORE_PATH,
  defaultShape: () => ({ tasks: [] }),
});

function shortId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${out}`;
}

// ============================================================================
// Create tasks from a strategy
// ============================================================================

export function createTasksFromStrategy(strategy: Strategy, actor = 'agent'): Task[] {
  const now = new Date().toISOString();
  const store = _store.read();
  const created: Task[] = [];

  // First pass: create tasks with placeholder depends_on_task_ids empty
  const indexToId: Record<number, string> = {};
  for (let i = 0; i < strategy.proposed_tasks.length; i++) {
    const pt: ProposedTask = strategy.proposed_tasks[i];
    const id = shortId('TSK');
    indexToId[i] = id;
    const task: Task = {
      id,
      strategy_id: strategy.id,
      title: pt.title,
      description: pt.description,
      assigned_role: pt.assigned_role,
      status: 'open',
      suggested_tool_ids: [...pt.suggested_tool_ids],
      inputs_hint: pt.inputs_hint,
      estimated_effort_minutes: pt.estimated_effort_minutes,
      depends_on_task_ids: [],
      activity_log: [{
        at: now, actor,
        kind: 'created',
        payload: { strategy_kind: strategy.kind, strategy_priority: strategy.priority },
      }],
      created_at: now,
    };
    store.tasks.push(task);
    created.push(task);
  }

  // Second pass: resolve depends_on_indices -> depends_on_task_ids
  for (let i = 0; i < strategy.proposed_tasks.length; i++) {
    const pt = strategy.proposed_tasks[i];
    if (pt.depends_on_indices && pt.depends_on_indices.length > 0) {
      const task = created[i];
      task.depends_on_task_ids = pt.depends_on_indices.map(idx => indexToId[idx]);
      // If dependencies exist, start as 'blocked' to reflect that upstream isn't done
      task.status = 'blocked';
      task.activity_log.push({
        at: now, actor,
        kind: 'blocked',
        payload: { reason: `Depends on: ${task.depends_on_task_ids.join(', ')}` },
      });
    }
  }

  _store.write(store);
  return created;
}

// ============================================================================
// Queries
// ============================================================================

export function getTask(id: string): Task | null {
  return _store.read().tasks.find(t => t.id === id) ?? null;
}

export function listTasks(filter?: {
  statuses?: TaskStatus[];
  role?: RoleId;
  strategy_id?: string;
  assigned_to?: string;
}): Task[] {
  let tasks = _store.read().tasks;
  if (filter?.statuses && filter.statuses.length > 0) {
    tasks = tasks.filter(t => filter.statuses!.includes(t.status));
  }
  if (filter?.role) tasks = tasks.filter(t => t.assigned_role === filter.role);
  if (filter?.strategy_id) tasks = tasks.filter(t => t.strategy_id === filter.strategy_id);
  if (filter?.assigned_to) tasks = tasks.filter(t => t.assigned_to === filter.assigned_to);
  return tasks;
}

// ============================================================================
// Lifecycle transitions
// ============================================================================

export function claimTask(task_id: string, actor: string): Task | null {
  const store = _store.read();
  const task = store.tasks.find(t => t.id === task_id);
  if (!task) return null;
  if (task.status !== 'open') {
    throw new Error(`Cannot claim task ${task_id}: status is '${task.status}' (must be 'open')`);
  }
  const now = new Date().toISOString();
  task.assigned_to = actor;
  task.status = 'in_progress';
  task.claimed_at = now;
  task.activity_log.push({ at: now, actor, kind: 'claimed' });
  _store.write(store);
  return task;
}

export function completeTask(task_id: string, actor: string, note?: string): Task | null {
  const store = _store.read();
  const task = store.tasks.find(t => t.id === task_id);
  if (!task) return null;
  if (task.status === 'done' || task.status === 'cancelled') {
    // Idempotent
    return task;
  }
  const now = new Date().toISOString();
  task.status = 'done';
  task.completed_at = now;
  task.completed_by = actor;
  task.completion_note = note;
  task.activity_log.push({ at: now, actor, kind: 'completed', payload: { note } });

  // Unblock dependents
  for (const dependent of store.tasks) {
    if (dependent.status === 'blocked' &&
        dependent.depends_on_task_ids.includes(task_id)) {
      // Check if ALL its dependencies are done
      const allDone = dependent.depends_on_task_ids.every(depId => {
        const dep = store.tasks.find(t => t.id === depId);
        return dep?.status === 'done';
      });
      if (allDone) {
        dependent.status = 'open';
        dependent.activity_log.push({
          at: now, actor: 'agent',
          kind: 'unblocked',
          payload: { reason: `All dependencies completed: ${dependent.depends_on_task_ids.join(', ')}` },
        });
      }
    }
  }

  _store.write(store);
  return task;
}

export function blockTask(task_id: string, actor: string, reason: string): Task | null {
  const store = _store.read();
  const task = store.tasks.find(t => t.id === task_id);
  if (!task) return null;
  const now = new Date().toISOString();
  task.status = 'blocked';
  task.activity_log.push({ at: now, actor, kind: 'blocked', payload: { reason } });
  _store.write(store);
  return task;
}

export function cancelTask(task_id: string, actor: string, reason?: string): Task | null {
  const store = _store.read();
  const task = store.tasks.find(t => t.id === task_id);
  if (!task) return null;
  const now = new Date().toISOString();
  task.status = 'cancelled';
  task.activity_log.push({ at: now, actor, kind: 'status_change', payload: { to: 'cancelled', reason } });
  _store.write(store);
  return task;
}

export function addTaskNote(task_id: string, actor: string, note: string): Task | null {
  const store = _store.read();
  const task = store.tasks.find(t => t.id === task_id);
  if (!task) return null;
  const now = new Date().toISOString();
  task.activity_log.push({ at: now, actor, kind: 'note', payload: { note } });
  _store.write(store);
  return task;
}

// ============================================================================
// Summary
// ============================================================================

export function taskCountsByRole(): Record<string, { open: number; in_progress: number; blocked: number; done: number }> {
  const out: Record<string, { open: number; in_progress: number; blocked: number; done: number }> = {};
  for (const t of _store.read().tasks) {
    if (!out[t.assigned_role]) out[t.assigned_role] = { open: 0, in_progress: 0, blocked: 0, done: 0 };
    if (t.status === 'open') out[t.assigned_role].open++;
    else if (t.status === 'in_progress') out[t.assigned_role].in_progress++;
    else if (t.status === 'blocked') out[t.assigned_role].blocked++;
    else if (t.status === 'done') out[t.assigned_role].done++;
  }
  return out;
}

export function clearAllTasks(): void {
  _store.write({ tasks: [] });
}
