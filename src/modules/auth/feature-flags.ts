// @ts-nocheck
/**
 * src/modules/auth/feature-flags.ts
 *
 * Auth-module feature flags. Each flag is a boolean toggle that can
 * be flipped via env var without rebuilding. The default state is
 * chosen so the demo seed works out-of-the-box (current behaviour
 * preserved).
 *
 * Design choices:
 *
 *   - **Env vars, not a config file.** Operators on Render / Netlify /
 *     Oracle Cloud set env vars in dashboards; reading from a config
 *     file would mean a redeploy to flip a flag. Env vars are the
 *     ergonomic choice for cloud-deployed services.
 *
 *   - **Default to current behaviour.** Every flag's default matches
 *     what the codebase did before this module existed. Flipping a
 *     flag off is opt-in. This means a fresh clone behaves identically
 *     to before; flags only matter when you change one.
 *
 *   - **Read once, cache.** Env vars are read at module load. Flipping
 *     a flag at runtime requires a server restart. This is a deliberate
 *     simplification — runtime mutation of auth flags is exactly the
 *     kind of thing that needs operator oversight, not API access.
 *
 *   - **Reported via /api/orchestrator/features.** Operators can see
 *     the flag state of any deployment without reading boot logs.
 *
 * Adding a new flag:
 *   1. Add a key to AUTH_FLAGS below with default + description
 *   2. Read it from process.env in the module-load block
 *   3. Document it in AUTH.md
 */

export type AuthFeatureFlag =
  | 'auth.google_oidc'
  | 'auth.demo_seed'
  | 'auth.parent_role'
  | 'auth.institution_role';

interface AuthFlagSpec {
  flag:        AuthFeatureFlag;
  env_var:     string;
  default:     boolean;
  description: string;
}

const AUTH_FLAGS: AuthFlagSpec[] = [
  {
    flag:        'auth.google_oidc',
    env_var:     'VIDHYA_AUTH_GOOGLE_OIDC',
    default:     true,
    description:
      'Google sign-in via OIDC. The only auth path currently supported. ' +
      'Disabling without an alternative auth path means nobody can log in — ' +
      'use only if you have an explicit replacement (not yet implemented).',
  },
  {
    flag:        'auth.demo_seed',
    env_var:     'VIDHYA_AUTH_DEMO_SEED',
    default:     true,
    description:
      'Whether `npm run demo:seed` should create the 6 demo users (Nisha, ' +
      'Arjun, Kavita, Priya, Rahul, Aditya). Set to off for production ' +
      'deployments where the demo personas would confuse real users.',
  },
  {
    flag:        'auth.parent_role',
    env_var:     'VIDHYA_AUTH_PARENT_ROLE',
    default:     true,
    description:
      'Whether the `parent` role is recognised. When off, role assignment ' +
      'rejects parent and the role rank table excludes it. Existing parent ' +
      'users keep their record but lose access until re-enabled.',
  },
  {
    flag:        'auth.institution_role',
    env_var:     'VIDHYA_AUTH_INSTITUTION_ROLE',
    default:     false,
    description:
      'Scaffolding for the institutional-b2b role (PENDING.md §9). When on, ' +
      'the type system accepts `institution` as a Role; full middleware + ' +
      'tenancy isolation is not yet implemented. Default off until it is.',
  },
];

// ─── Env-var parsing ──────────────────────────────────────────────────

function readBool(env_var: string, default_: boolean): boolean {
  const raw = process.env[env_var];
  if (raw === undefined) return default_;
  // Accept '1', 'true', 'yes', 'on' (case-insensitive) as true; anything else false
  const normalised = String(raw).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalised)) return true;
  if (['0', 'false', 'no', 'off', ''].includes(normalised)) return false;
  // Unrecognised value — fall back to default to fail safe
  console.warn(
    `[auth/flags] ${env_var}='${raw}' is not a recognised boolean; using default ${default_}`,
  );
  return default_;
}

// Read all flags once at module load
const FLAG_STATE: Record<AuthFeatureFlag, boolean> = AUTH_FLAGS.reduce(
  (acc, spec) => {
    acc[spec.flag] = readBool(spec.env_var, spec.default);
    return acc;
  },
  {} as Record<AuthFeatureFlag, boolean>,
);

// ─── Public API ──────────────────────────────────────────────────────

export function isAuthFeatureEnabled(flag: AuthFeatureFlag): boolean {
  return FLAG_STATE[flag] ?? false;
}

/**
 * Return the full flag inventory for /api/orchestrator/features.
 * Includes the default so an operator can see what they overrode.
 */
export function authFeatureFlags(): Array<{
  flag:        AuthFeatureFlag;
  enabled:     boolean;
  default:     boolean;
  env_var:     string;
  description: string;
  overridden:  boolean;
}> {
  return AUTH_FLAGS.map(spec => ({
    flag:        spec.flag,
    enabled:     FLAG_STATE[spec.flag],
    default:     spec.default,
    env_var:     spec.env_var,
    description: spec.description,
    overridden:  FLAG_STATE[spec.flag] !== spec.default,
  }));
}
