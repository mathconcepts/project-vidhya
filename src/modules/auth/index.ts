// @ts-nocheck
/**
 * src/modules/auth/index.ts
 *
 * Public surface of the auth module.
 *
 * This barrel exists to give the auth subsystem an explicit module
 * boundary without physically moving files. New code should import
 * from `@/modules/auth` (or a relative path equivalent); old code
 * importing directly from `src/auth/...` keeps working unchanged.
 *
 * Why this matters:
 *   - The boundary lets `modules.yaml` carry the auth module as a
 *     first-class citizen with feature flags, health probes, and
 *     declared public API.
 *   - When/if auth is ever extracted to its own repo (PENDING — not
 *     planned right now), this file becomes the sub-repo's index.ts.
 *     The extraction is a `git subtree split` of a single dir, not
 *     a rewrite.
 *   - It signals intent: anything not exported here is internal to
 *     the module and shouldn't be reached for from outside.
 *
 * What this module owns:
 *   - User identity (User type, role + permission model)
 *   - JWT issue/verify
 *   - Google OIDC token verification
 *   - Auth middleware (requireAuth, requireRole, hasGuardianOf)
 *   - User store (flat-file persistence at .data/users.json)
 *   - Feature flags for the auth module itself
 *
 * What this module DOES NOT own (lives elsewhere intentionally):
 *   - HTTP route handlers (src/api/auth-routes.ts, user-admin-routes.ts) —
 *     route plumbing belongs to the API layer; this module exposes
 *     functions, not routes.
 *   - Data-rights deletion (src/data-rights/delete.ts) — touches users
 *     but is its own module concerned with GDPR-style flows.
 *   - Channel-link metadata (lives on the User record but the channel
 *     module owns the linking logic).
 */

// Identity types ──────────────────────────────────────────────────────
export type {
  Role,
  User,
  AuthContext,
  AuthErrorCode,
} from '../../auth/types';
export {
  roleGte,
  hasGuardianOf,
} from '../../auth/types';

// JWT primitives ──────────────────────────────────────────────────────
export {
  issueToken,
  verifyToken,
} from '../../auth/jwt';

// Google OIDC ─────────────────────────────────────────────────────────
export {
  verifyGoogleIdToken,
} from '../../auth/google-verify';

// Middleware ──────────────────────────────────────────────────────────
export {
  requireAuth,
  requireRole,
} from '../../auth/middleware';

// User store (the public mutators + readers) ─────────────────────────
export {
  // Readers
  getUserById,
  getUserByGoogleSub,
  getUserByEmail,
  getUserByChannel,
  listUsers,
  getOwner,
  ownerExists,
  // Mutators
  upsertFromGoogle,
  setRole,
  transferOwnership,
  assignTeacher,
  linkChannel,
  unlinkChannel,
  touchUser,
} from '../../auth/user-store';

// Feature flags (defined in this module) ─────────────────────────────
export {
  isAuthFeatureEnabled,
  authFeatureFlags,
  type AuthFeatureFlag,
} from './feature-flags';
