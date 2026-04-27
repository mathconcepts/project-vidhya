# AUTH — Auth module surface

> The auth module's public API, role model, feature flags, and operational specifics. Read [ARCHITECTURE.md](./ARCHITECTURE.md) first for where auth sits in the system; this doc goes deeper into the module itself.

---

## At a glance

- **Auth path:** Google OIDC. Only currently supported.
- **Persistence:** flat-file at `.data/users.json`
- **Token type:** JWT (HS256)
- **Roles:** 6 — `owner`, `admin`, `teacher`, `student`, `parent`, `institution` (last two are flag-gated)
- **Public surface:** `src/modules/auth/index.ts` (barrel)
- **Feature flags:** 4, declared in `src/modules/auth/feature-flags.ts`
- **HTTP routes:** 5 auth + 5 admin = 10 (declared in `src/api/auth-routes.ts` and `src/api/user-admin-routes.ts`)

## The 6 roles

| Role | Rank | Hierarchical? | Default flag? | Purpose |
|---|---|---|---|---|
| `parent` | 0 | No (orthogonal) | `auth.parent_role` (default on) | Read-only access to *specific* students' progress, scoped via `User.guardian_of[]`. Not site-wide. |
| `student` | 1 | Yes | always | Self-service learner. Can read their own data, submit practice sessions. |
| `teacher` | 2 | Yes | always | Manages a roster of students (`teacher_of[]` on the teacher's User; `taught_by` on students). |
| `admin` | 3 | Yes | always | Manages users, content, channels. |
| `owner` | 4 | Yes | always | The deployment owner — exactly one per deployment. Can transfer ownership. |
| `institution` | 5 | Yes (above owner) | `auth.institution_role` (default off) | **Scaffolding only.** Multi-tenant B2B (PENDING.md §9). The type stays in the union so code referencing it compiles, but `setRole` rejects assignment unless the flag is flipped on. |

The `roleGte(actual, min)` helper in `src/auth/types.ts` does the rank comparison. **`parent` is intentionally rank 0** — its access is per-student, not site-wide. Code checking "can read student X's progress" must use `hasGuardianOf()`, not `roleGte(...'student')`.

### Owner is special

There is exactly one owner per deployment. Mechanics:

- The first user who signs in becomes the owner (auto-promoted in `upsertFromGoogle`).
- `transferOwnership` is the only way to change it. Demoting yourself is impossible without a transfer.
- The owner role is required for: configuring LLM providers, setting feature flags' `VIDHYA_*` env vars (well, redeploying with new env vars — owners run the host), and viewing demo telemetry.

## Feature flags

The auth module ships with 4 flags. State surfaced at `GET /api/orchestrator/features` and visualised at `/admin/features`.

> **Two unrelated "feature flag" systems live in this codebase.** The flags described here are *module flags* — env-var driven, read once at boot, intended for operators to toggle subsystem behaviour (Google OIDC on/off, demo seed on/off, etc.). A separate concept lives in [`src/deployment/manager.ts`](./src/deployment/manager.ts) under the same name: per-exam-deployment runtime toggles for staged pilot/promote/rollback. Those are not currently HTTP-exposed but are described in [`docs/13-deployment-modes.md`](./docs/13-deployment-modes.md). The two systems share a name but not a domain — module flags are operator territory; exam-deployment flags are content-rollout territory.

### `auth.google_oidc`

| | |
|---|---|
| Env var | `VIDHYA_AUTH_GOOGLE_OIDC` |
| Default | `true` |
| Effect when off | `POST /api/auth/google-callback` returns 503 with a clear message; nobody can sign in via Google. |

Disabling without an alternative auth path means **nobody can log in.** The intent is to flip this off only when a non-Google auth path is added (none currently implemented). Until that happens, leave at default.

### `auth.demo_seed`

| | |
|---|---|
| Env var | `VIDHYA_AUTH_DEMO_SEED` |
| Default | `true` |
| Effect when off | `npm run demo:seed` exits cleanly with a "demo seed disabled" message; no users created. |

Set to off for production deployments where the 6 demo personas (Nisha, Arjun, Kavita, Priya, Rahul, Aditya) would confuse real users.

### `auth.parent_role`

| | |
|---|---|
| Env var | `VIDHYA_AUTH_PARENT_ROLE` |
| Default | `true` |
| Effect when off | `setRole(... 'parent')` rejects with `parent role is disabled on this deployment`. Existing parent users keep their record but can't access until re-enabled. |

The parent role exists in production-ready form. Default is on. The flag exists for deployments that explicitly don't want parent-of-student linkage (e.g. coaching centres for adult students where parent involvement isn't a feature).

### `auth.institution_role`

| | |
|---|---|
| Env var | `VIDHYA_AUTH_INSTITUTION_ROLE` |
| Default | `false` |
| Effect when on | `setRole(... 'institution')` is accepted by user-store. **Other infrastructure (tenancy isolation, institution-admin UI) does not yet exist.** |

Scaffolding for PENDING.md §9. Flipping on unlocks the scaffold; full B2B isn't shipped yet.

## HTTP routes

### Auth routes (`src/api/auth-routes.ts`)

| Method | Path | Auth required? | Purpose |
|---|---|---|---|
| GET | `/api/auth/config` | No | Returns the Google OIDC client ID for the frontend to bootstrap the sign-in button. |
| POST | `/api/auth/google-callback` | No | Verifies a Google ID token, upserts the user, returns a Vidhya JWT. Honours `auth.google_oidc` flag. |
| GET | `/api/auth/me` | Yes | Returns the authenticated user's record. |
| POST | `/api/auth/sign-out` | Yes | Currently a no-op (JWTs are stateless); reserved for future session invalidation. |
| GET | `/api/auth/link-status` | Yes | Returns the user's linked channels (web, telegram, whatsapp). |

### Admin routes (`src/api/user-admin-routes.ts`)

| Method | Path | Min role | Purpose |
|---|---|---|---|
| GET | `/api/admin/users` | `admin` | List all users, with role counts. |
| GET | `/api/admin/users/:id` | `admin` | Get one user's full record. |
| POST | `/api/admin/users/:id/role` | `admin` | Change a user's role. Body: `{"new_role": "..."}`. Honours flag-gated roles (parent, institution). |
| POST | `/api/admin/users/:id/teacher` | `admin` | Assign a teacher to a student. Body: `{"teacher_id": "..."}` or `{"teacher_id": null}` to unassign. |
| POST | `/api/admin/users/:id/unlink` | `admin` | Unlink a channel from a user. Body: `{"channel_key": "telegram:12345"}`. |

## JWT mechanics

- **Algorithm:** HS256
- **Secret:** `process.env.JWT_SECRET`. Must be ≥ 16 chars. Demo default: `demo-secret-for-local-testing-only-min-16ch`.
- **Lifetime:** 30 days from issue.
- **Claims:** `sub` (user_id), `role`, `iat`, `exp`. No refresh tokens — clients re-login when they expire.
- **Verification:** `verifyToken(token)` returns the decoded payload or null.

The JWT secret is auto-generated by Render's blueprint config (`render.yaml` → `generateValue: true`). Local development uses the demo default — do *not* let the demo default ship to production.

## User-store API (the public mutators + readers)

From `src/modules/auth/index.ts`:

```ts
// Readers
getUserById(id: string): User | null
getUserByGoogleSub(sub: string): User | null
getUserByEmail(email: string): User | null
getUserByChannel(channelId: string): User | null
listUsers(): User[]
getOwner(): User | null
ownerExists(): boolean

// Mutators (each returns { ok, reason?, user? })
upsertFromGoogle({ google_sub, email, name, picture }): User
setRole({ actor_id, target_id, new_role })
transferOwnership({ actor_id, target_id })
assignTeacher({ actor_id, student_id, teacher_id })
linkChannel({ user_id, channel_key })
unlinkChannel({ user_id, channel_key })
touchUser(user_id: string): void
```

All mutators write atomically via `createFlatFileStore`'s tmp+rename. They serialise through Node's event loop — single-writer-safe.

## Channel linking

Vidhya users can reach the system through web, Telegram, or WhatsApp under the same identity. The `User.channels[]` array stores entries like `"telegram:123456"` or `"whatsapp:+919812345678"`. Mechanics:

1. User signs in via web (creates the `User` record + the `web` channel entry).
2. From the channel adapter (e.g. Telegram bot), the user requests linking — the adapter generates a one-time link token.
3. The user pastes the link token into a web sign-in flow → `linkChannel({user_id, channel_key})` runs.
4. Future messages from that channel resolve to the linked user via `getUserByChannel(channelId)`.

The `ChannelLinkToken` is a separate flow not covered here — see `src/auth/google-verify.ts` and `src/api/auth-routes.ts:handleGoogleCallback` for the link-token consumption pattern.

## Module boundary

The auth module's public surface is `src/modules/auth/index.ts`. Importers should use that barrel:

```ts
// Good — uses the module boundary
import { requireAuth, requireRole, type User } from '@/modules/auth';
// or relative:
import { requireAuth } from '../modules/auth';

// Avoid — reaches into internals
import { requireAuth } from '../auth/middleware';
```

The internal files (`src/auth/*.ts`) are not under deep-import freeze yet, but new code should follow the convention. When/if the auth module is ever extracted to a sub-repo (PENDING — not currently planned, see brainstorm in commit `ebdf23c`), only the barrel survives the move.

## Health probe

`GET /api/orchestrator/health` runs an `auth` probe that reports:

- `healthy` — middleware exists, barrel exists, `auth.google_oidc=on` and `GOOGLE_OAUTH_CLIENT_ID` is set
- `degraded` — `auth.google_oidc=on` but `GOOGLE_OAUTH_CLIENT_ID` is missing (login will fail when attempted), or `auth.google_oidc=off` (no auth path active)
- `unavailable` — `src/auth/middleware.ts` is missing entirely (the module is broken)

The flag/config consistency check is the most useful one — it surfaces the kind of misconfiguration an operator would otherwise discover only when a real user tries to sign in.

## Honest gaps

What this module does *not* currently provide:

- **No password login.** Google OIDC only.
- **No other OIDC providers** (Microsoft, Auth0, GitHub, etc.). The `verifyGoogleIdToken` is provider-specific. Generalising is a clean PR; not done yet.
- **No API tokens.** A bot or external integration can't authenticate without going through a Google sign-in flow first.
- **No granular permission strings.** Listmonk-style `users:read`, `campaigns:send` etc. The role-rank check (`roleGte`) covers all current routes. Adding granular permissions would require touching every protected route for no concrete consumer right now.
- **No audit log of role changes.** `setRole` doesn't currently emit a signal-bus event for audit. PENDING.
- **No 2FA layer.** Google handles MFA upstream; we trust whatever level Google's identity service vouches for.
- **No password-reset email.** N/A — there are no passwords. Account recovery goes through Google.

Each of these is a clean PR away if a need materialises. The module structure (barrel + flags + isolated user-store) is set up to accept extensions without churning the rest of the codebase.

## See also

- [ARCHITECTURE.md](./ARCHITECTURE.md) — where auth sits in the system
- [DESIGN.md](./DESIGN.md) §"5. Google OIDC as the only auth path (today)" — why the surface is shaped this way
- [`src/modules/auth/index.ts`](./src/modules/auth/index.ts) — the barrel itself
- [`src/modules/auth/feature-flags.ts`](./src/modules/auth/feature-flags.ts) — the flag implementation
- [`modules.yaml`](./modules.yaml) — the auth module's declaration in the registry
- Commit `ebdf23c` — when the module was carved out of `core` and the flags landed
