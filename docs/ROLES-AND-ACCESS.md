# Roles & Access Framework

**Status:** v2.8.0
**Scope:** Transforms Vidhya from a standalone app into a role-based system with multi-channel access (web + Telegram + WhatsApp). Keeps the DB-less architecture intact via flat-file user directory + JWT sessions.

---

## 1. The four roles

```
Owner
  │  installs the deployment, controls everything,
  │  can transfer ownership, cannot be demoted
  ▼
Admin
  │  manages users + teachers, reviews content,
  │  can promote/demote teachers & students
  ▼
Teacher
  │  manages their own students, reviews student
  │  work, assigns syllabi; read-only on content
  ▼
Student
     default role on signup; normal app usage
```

**Role capabilities matrix:**

| Action | Owner | Admin | Teacher | Student |
|--------|:-----:|:-----:|:-------:|:-------:|
| Use chat / snap / lesson / practice | ✓ | ✓ | ✓ | ✓ |
| Upload materials | ✓ | ✓ | ✓ | ✓ |
| View own progress / digest | ✓ | ✓ | ✓ | ✓ |
| View roster of students they teach | ✓ | ✓ | ✓ | — |
| Review student work | ✓ | ✓ | ✓ | — |
| Promote student → teacher | ✓ | ✓ | — | — |
| Demote teacher → student | ✓ | ✓ | — | — |
| Assign teacher to student | ✓ | ✓ | — | — |
| Edit curriculum YAML | ✓ | ✓ | — | — |
| View quality dashboards | ✓ | ✓ | — | — |
| Close a quality iteration | ✓ | ✓ | — | — |
| Install / configure deployment | ✓ | — | — | — |
| Manage LLM config (system-wide default) | ✓ | — | — | — |
| Promote admin | ✓ | — | — | — |
| Demote admin | ✓ | — | — | — |
| Transfer ownership | ✓ | — | — | — |

**Design rule:** only the owner can create other owners (or transfer the role). Otherwise the system could lose its owner.

---

## 2. Identity — Google OAuth only

We deliberately avoid password management. Users sign in with Google; the Google ID token is verified server-side against Google's public keys; we extract the user's Google `sub` and email.

Why only Google:
- Covers 95%+ of student population worldwide
- No password reset flow, no password reuse risk
- Email is verified by Google, so we don't have to
- The `google-auth-library` dep is stable and small

Non-goals:
- Apple Sign-In (defer to when iOS app is built)
- Email magic links (password-free alternative — can add later if needed)
- Local username/password (explicitly rejected — too much surface to secure)

---

## 3. Storage — DB-less continues

**User directory:** `.data/users.json` — flat-file, single-writer (Node is single-threaded), atomic writes via tmp+rename.

```json
{
  "version": 1,
  "org_id": "default",
  "owner_id": "user_xyz",
  "users": {
    "user_xyz": {
      "id": "user_xyz",
      "google_sub": "110000...",
      "email": "owner@example.com",
      "name": "Jane Owner",
      "role": "owner",
      "teacher_of": [],
      "taught_by": null,
      "created_at": "2026-04-21T...",
      "last_seen_at": "2026-04-21T...",
      "channels": ["web", "telegram:123456789"]
    }
  }
}
```

**Sessions:** JWT tokens signed with `JWT_SECRET`, 30-day expiry, verified per-request.

**Scale note:** flat-file works comfortably up to ~10,000 users. Beyond that, swap the `user-store.ts` module for a Postgres-backed implementation — the rest of the system doesn't change (the store has a clean interface).

---

## 4. Owner bootstrap

First user to sign in after fresh install becomes the owner. Bootstrap rules:
- If `.data/users.json` doesn't exist, first signup creates it with `owner_id = new_user.id`
- Subsequent signups default to `role: "student"`
- Existing owners can promote others (see role matrix)

Edge case: what if the first user isn't actually the intended owner? Admin provides a `scripts/admin/assign-owner.ts` CLI that can reset ownership via direct file edit, requiring shell access to the deployment. No web path to this — shell access IS the proof of ownership at bootstrap time.

---

## 5. Multi-channel access

All three channels hit the same HTTP API. Channel-specific code is purely an adapter.

### 5.1 Web (primary)

- Google Sign-In button in the UI
- `GET /api/auth/google-signin` returns the Google OAuth URL
- `POST /api/auth/google-callback` receives the ID token, verifies it, upserts the user record, issues a JWT
- Client stores JWT in `localStorage` alongside the LLM config (same storage pattern)
- JWT sent as `Authorization: Bearer ...` on every request

### 5.2 Telegram

- User types `/start` to the bot
- Bot sends a one-time login URL that web-flow-authenticates and binds the Telegram `chat_id` to their Vidhya user account
- Subsequent messages use the bound chat_id as identity
- Bot capabilities: chat, snap (photo upload), lesson navigation via inline buttons
- Stored as `channels: ["web", "telegram:123456789"]` in the user record

### 5.3 WhatsApp

- Requires Meta Cloud API (business phone number, verified sender)
- Same linking flow as Telegram (one-time URL)
- Capabilities: chat, snap; no inline buttons so navigation is text-based
- Stored as `channels: [..., "whatsapp:+1234567890"]`

**Channel adapters live in `src/channels/`:**
- `telegram-adapter.ts` — wraps `grammY` library, translates bot events → HTTP API calls
- `whatsapp-adapter.ts` — Meta Cloud API webhook handler, translates inbound messages → HTTP API calls

Both adapters use a **server-side service token** for API calls (not per-user JWTs), injecting the user's identity via a trusted header. This avoids the need to mint JWTs per bot message.

---

## 6. Authorization middleware

Every protected endpoint runs through `requireRole(minRole)`:

```typescript
// Example
app.get('/api/admin/users', requireRole('admin'), handler);
```

The middleware:
1. Reads `Authorization: Bearer <jwt>` header
2. Verifies the JWT signature + expiry
3. Loads the user from `.data/users.json`
4. Checks the user's role meets or exceeds `minRole`
5. Attaches user info to the request for downstream handlers

Role hierarchy is mostly linear, with two exceptions:

`institution > owner > admin > teacher > student > anonymous`, plus the orthogonal `parent` role at rank 0.

`requireRole('teacher')` allows institution/owner/admin/teacher; rejects student/anonymous/parent.

Two roles need extra context:

- **`parent`** is rank 0 (deliberately — it grants no site-wide access). A parent can read the progress of *specific* students linked via `User.guardian_of[]`, scoped per-student. Code checking "can read student X's progress" must use `hasGuardianOf()`, not `roleGte(...'student')`. See [AUTH.md](../AUTH.md) for the full surface.
- **`institution`** is rank 5 (above owner) and is **scaffolding** for the multi-tenant B2B tier (PENDING.md §9). Default-disabled via the `auth.institution_role` feature flag. Until that flag is on and tenancy isolation lands (PENDING §9.2 onwards), assigning the role is rejected by the user-store.

---

## 7. Admin UI

New page: `/admin/users` (admin+ only). Features:
- Roster table (name, email, role, teacher, last seen)
- Search by name/email
- Change role dropdown (role matrix enforces who can change what)
- Assign teacher (admin only)
- View user's last activity

New page: `/owner/settings` (owner only). Features:
- Transfer ownership
- List admins; promote/demote
- Integration tokens (Telegram bot token, WhatsApp credentials) — stored in `.env`, reminded in UI
- System-wide LLM default (if users haven't set their own)

---

## 8. Files shipping in v2.8

Backend:
- `src/auth/types.ts` — Role, User, Session, roleGte
- `src/auth/user-store.ts` — flat-file user directory with atomic writes
- `src/auth/google-verify.ts` — verify Google ID token against Google's public keys
- `src/auth/jwt.ts` — issue + verify JWTs
- `src/auth/middleware.ts` — requireRole, requireAnon, getCurrentUser
- `src/api/auth-routes.ts` — google-signin, google-callback, me, sign-out
- `src/api/user-admin-routes.ts` — admin/owner user management endpoints
- `src/channels/telegram-adapter.ts` — grammY bot wrapper (stub for MVP)
- `src/channels/whatsapp-adapter.ts` — Meta Cloud API webhook (stub for MVP)
- `scripts/admin/assign-owner.ts` — CLI owner reset

Frontend:
- `frontend/src/contexts/AuthContext.tsx` — React context for current user
- `frontend/src/pages/gate/SignInPage.tsx` — Google Sign-In button
- `frontend/src/pages/gate/UserAdminPage.tsx` — roster + role management
- `frontend/src/pages/gate/OwnerSettingsPage.tsx` — owner-only config
- `frontend/src/lib/auth/client.ts` — auth API helpers + JWT storage

Docs:
- `docs/ROLES-AND-ACCESS.md` — this document
- `docs/MULTI-CHANNEL-SETUP.md` — Telegram + WhatsApp setup guides
- `INSTALL.md` — owner bootstrap section

---

## 9. What this framework explicitly does NOT do (yet)

- **Not multi-tenant.** One deployment = one org. Multi-org support is a v3 feature.
- **Not SSO.** No SAML, no Okta integration. Google OAuth only.
- **Not audit-logged.** Role changes aren't persisted to an audit log. If admin misbehaves, there's no forensic trail. (Acceptable for MVP given who installs these systems.)
- **Not 2FA.** Relies on Google's 2FA. We don't add another layer.
- **Not session revocation.** JWTs are 30-day; if a user's role changes, they keep their old token until it expires. Mitigation: short TTL (30 days is already short for this use case; can be reduced to 24 hours if needed).

---

## 10. Migration path

Existing anonymous sessions (v2.7 and earlier) keep working. The `/api/auth/migrate-session` endpoint still exists and now promotes an anonymous session to a signed-in one:

```
anonymous IndexedDB state → Google sign-in → migrate-session (binds IDB to user_id)
```

Users who don't sign in continue as anonymous students with client-side-only state. This preserves the "works without accounts" promise for casual visitors.
