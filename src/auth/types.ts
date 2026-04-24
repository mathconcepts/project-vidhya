// @ts-nocheck
/**
 * Auth Types & Role Hierarchy
 *
 * Main hierarchy (linear — higher roles inherit lower-role permissions):
 *   anonymous < student < teacher < admin < owner
 *
 * Orthogonal roles (not in the main hierarchy — scoped read access):
 *   - parent: read-only view of linked students' progress
 *             (PENDING.md §11.7)
 *
 * Future: B2B (PENDING.md §9) adds `institution` above owner.
 */

export type Role = 'owner' | 'admin' | 'teacher' | 'student' | 'parent';

/**
 * Numeric ranking for comparison. Higher = more permissions.
 * Anonymous (not in Role type) is implicitly 0.
 *
 * Parent is ranked at 0 for general permissions — it grants NO
 * site-wide access. Parent permissions are scoped per-student via
 * User.guardian_of[]. Code checking "can read student X's progress"
 * must use hasGuardianOf(), not roleGte(...'student').
 */
const ROLE_RANK: Record<Role, number> = {
  parent: 0,    // orthogonal — scope is per-student, not site-wide
  student: 1,
  teacher: 2,
  admin: 3,
  owner: 4,
};

export function roleGte(actual: Role | null, min: Role): boolean {
  if (!actual) return false;
  return ROLE_RANK[actual] >= ROLE_RANK[min];
}

/**
 * Check if a user has guardian access to a specific student.
 * Use this instead of roleGte for parent-scoped reads.
 *
 * Parents' read access is per-student. A parent linked to student A
 * can read A's progress but NOT any other student's.
 */
export function hasGuardianOf(user: User | null, student_id: string): boolean {
  if (!user || user.role !== 'parent') return false;
  return (user.guardian_of || []).includes(student_id);
}

/**
 * The "who" record we persist per user. Minimal — no PII beyond what
 * Google returns and what's needed to function.
 */
export interface User {
  id: string;                 // "user_" + random 16 bytes
  google_sub: string;         // Google's 'sub' claim
  email: string;              // from Google (verified)
  name: string;               // Google display name
  picture?: string;           // Google avatar URL
  role: Role;
  /** For teachers — student ids they manage */
  teacher_of: string[];
  /** For students — teacher id who manages them (null = no teacher) */
  taught_by: string | null;
  /**
   * For parents — student ids they have read-only access to.
   * A parent's access is scoped: they can only read progress for
   * students in this array. Not site-wide.
   * PENDING.md §11.7.
   */
  guardian_of?: string[];
  /**
   * For students — parent ids who have read access to their progress.
   * Student controls who gets access; adding/removing is student-opt-in.
   * Mirrors guardian_of on the parent's User record.
   */
  guardians?: string[];
  created_at: string;
  last_seen_at: string;
  /**
   * Linked identity channels — allows the same user to reach Vidhya
   * from web + Telegram + WhatsApp.
   * Format: "<channel>:<channel-specific-id>"
   *   "web"                    — web session (all signed-in users)
   *   "telegram:<chat_id>"     — Telegram DM
   *   "whatsapp:<phone_e164>"  — WhatsApp sender number
   */
  channels: string[];
  /**
   * Concepts a human teacher has pushed to this student's review queue.
   * Populated when taught_by teacher uses the push-to-review action.
   * Pruned on dismiss or completion.
   */
  pushed_reviews?: Array<{
    concept_id: string;
    pushed_by_teacher_id: string;
    pushed_at: string;
  }>;
  /**
   * The exam this student is preparing for — references Exam.id in the
   * dynamic exam registry (src/exams/exam-store.ts). Admin or teacher
   * assigns it. Drives syllabus, priority-engine weights, countdown
   * prompts, and mock-exam configuration.
   *
   * Multiple students can share the same exam_id — one exam definition
   * serves an entire cohort.
   */
  exam_id?: string;
}

/**
 * What the server attaches to a request after verifying auth.
 */
export interface AuthenticatedRequest {
  user: User;
  /** JWT payload extras for audit */
  issued_at: number;
  expires_at: number;
}

/**
 * Pending link tokens for binding non-web channels. Stored in-memory
 * on the server; short TTL (15 min).
 */
export interface ChannelLinkToken {
  token: string;
  channel: 'telegram' | 'whatsapp';
  channel_id: string;         // chat_id or phone
  issued_at: number;
  /** The user who initiated the link (via /start in bot). Empty until web-auth completes. */
  user_id?: string;
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner:   'Full access. Can install, configure, and manage everything.',
  admin:   'Manages users and teachers. Reviews content. Cannot transfer ownership.',
  teacher: 'Manages assigned students. Reviews their work. Read-only on content.',
  student: 'Normal app usage. Default role on signup.',
};
