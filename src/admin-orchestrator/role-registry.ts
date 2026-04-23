// @ts-nocheck
/**
 * Role Registry — defines the roles that interact with the agent.
 *
 * Each role has:
 *   - A set of responsibilities (what they're accountable for)
 *   - Tool authorization (computed from the tool registry's required_roles)
 *   - Typical strategy kinds they handle
 *
 * The agent uses this to:
 *   - Route proposed tasks to the right role
 *   - Authorize tool invocations
 *   - Surface role-specific dashboards
 */

import type { Role, RoleId, StrategyKind } from './types';
import { TOOLS } from './tool-registry';

// ============================================================================

function toolsFor(roleId: RoleId): string[] {
  return TOOLS.filter(t => t.required_roles.includes(roleId)).map(t => t.id);
}

export const ROLES: Record<RoleId, Role> = {
  owner: {
    id: 'owner',
    label: 'Owner',
    description: 'Ultimate decision-maker. Sees everything, approves strategic direction.',
    responsibilities: [
      'Approve major strategy shifts',
      'Final sign-off on launches and public commitments',
      'Resource allocation across teams',
    ],
    authorized_tool_ids: toolsFor('owner'),
    typical_strategy_kinds: [
      'expand-content-corpus',
      'launch-marketing-campaign',
      'review-cross-exam-signal',
    ],
  },

  admin: {
    id: 'admin',
    label: 'Admin',
    description: 'Day-to-day operational lead. Executes strategies across modules.',
    responsibilities: [
      'Triage and approve feedback items',
      'Close sample-checks as resolved',
      'Publish articles',
      'Trigger drift detection after feature ships',
      'Coordinate campaigns across channels',
    ],
    authorized_tool_ids: toolsFor('admin'),
    typical_strategy_kinds: [
      'triage-feedback-backlog',
      'iterate-and-promote-course',
      'rereview-stale-articles',
      'nudge-aging-sample-checks',
      'launch-marketing-campaign',
    ],
  },

  'content-ops': {
    id: 'content-ops',
    label: 'Content Operations',
    description: 'Owns lesson and mock-question quality across exams.',
    responsibilities: [
      'Apply approved feedback to content',
      'Expand content corpus when gaps are detected',
      'Iterate and promote courses when applied feedback accumulates',
    ],
    authorized_tool_ids: toolsFor('content-ops'),
    typical_strategy_kinds: [
      'expand-content-corpus',
      'iterate-and-promote-course',
      'calibrate-topic-weights',
      'address-attention-deferrals',
    ],
  },

  'exam-ops': {
    id: 'exam-ops',
    label: 'Exam Operations',
    description: 'Owns exam-specific build pipelines and sample-check lifecycle.',
    responsibilities: [
      'Manage sample-check workflow per exam',
      'Trigger iterate builds when feedback is ready',
      'Register new exam adapters',
    ],
    authorized_tool_ids: toolsFor('exam-ops'),
    typical_strategy_kinds: [
      'nudge-aging-sample-checks',
      'iterate-and-promote-course',
      'expand-content-corpus',
    ],
  },

  'marketing-lead': {
    id: 'marketing-lead',
    label: 'Marketing Lead',
    description: 'Owns acquisition, social media, campaigns, and landing variants.',
    responsibilities: [
      'Re-review stale articles after drift',
      'Launch campaigns for new content',
      'Generate social push for product announcements',
    ],
    authorized_tool_ids: toolsFor('marketing-lead'),
    typical_strategy_kinds: [
      'rereview-stale-articles',
      'launch-marketing-campaign',
      'generate-social-push',
    ],
  },

  'qa-reviewer': {
    id: 'qa-reviewer',
    label: 'QA Reviewer',
    description: 'Reviews feedback items, triages quality issues, flags regressions.',
    responsibilities: [
      'Triage open feedback items',
      'Flag high-volume topic issues',
      'Review sample-check content before admin closes',
    ],
    authorized_tool_ids: toolsFor('qa-reviewer'),
    typical_strategy_kinds: [
      'triage-feedback-backlog',
      'calibrate-topic-weights',
    ],
  },

  analyst: {
    id: 'analyst',
    label: 'Analyst',
    description: 'Read-only observer. Produces cross-module insights.',
    responsibilities: [
      'Monitor dashboard metrics',
      'Detect cross-module correlations',
      'Propose strategies backed by evidence',
    ],
    authorized_tool_ids: toolsFor('analyst'),
    typical_strategy_kinds: [
      'review-cross-exam-signal',
    ],
  },

  author: {
    id: 'author',
    label: 'Author',
    description: 'Writes blog articles; submits for admin review.',
    responsibilities: [
      'Draft articles aligned with exam strategies',
      'Update articles when stale drift is surfaced',
      'Maintain marketing_meta (hook_copy, body_copy)',
    ],
    authorized_tool_ids: toolsFor('author'),
    typical_strategy_kinds: [
      'rereview-stale-articles',
      'generate-social-push',
    ],
  },
};

// ============================================================================
// Queries
// ============================================================================

export function getRole(id: RoleId): Role | null {
  return ROLES[id] ?? null;
}

export function listRoles(): Role[] {
  return Object.values(ROLES);
}

export function rolesForStrategyKind(kind: StrategyKind): RoleId[] {
  return Object.values(ROLES)
    .filter(r => r.typical_strategy_kinds.includes(kind))
    .map(r => r.id);
}

/**
 * Pick the most appropriate role for a strategy kind. Returns the FIRST
 * matching role in responsibility order (owner/admin first, then more
 * specialized). Falls back to 'admin' if no specific match.
 */
export function defaultRoleForStrategyKind(kind: StrategyKind): RoleId {
  const order: RoleId[] = [
    'content-ops', 'exam-ops', 'marketing-lead', 'qa-reviewer',
    'author', 'analyst', 'admin', 'owner',
  ];
  for (const rid of order) {
    if (ROLES[rid].typical_strategy_kinds.includes(kind)) return rid;
  }
  return 'admin';
}
