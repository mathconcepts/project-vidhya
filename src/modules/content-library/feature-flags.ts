// @ts-nocheck
/**
 * src/modules/content-library/feature-flags.ts
 *
 * Content-library feature flags. Same pattern as
 * src/modules/auth/feature-flags.ts:
 *
 *   - env-var driven
 *   - read once at boot, cached
 *   - reported via /api/orchestrator/features
 *   - flipping requires server restart (operator oversight)
 *
 * The library only has one flag today (user_authoring). Documented
 * fully in LIBRARY.md.
 */

interface FlagDecl {
  flag: string;
  env_var: string;
  default: boolean;
  description: string;
}

const FLAGS: FlagDecl[] = [
  {
    flag: 'content_library.user_authoring',
    env_var: 'VIDHYA_CONTENT_LIBRARY_USER_AUTHORING',
    default: false,
    description:
      'When on, allows teacher+ roles (not just admin) to POST entries via ' +
      '/api/content-library/concept. Default off because opening up the ' +
      'submission surface requires a moderation flow that is not yet built. ' +
      'Flip on only for trusted-contributor deployments.',
  },
];

function readEnvOnce(): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const f of FLAGS) {
    const raw = process.env[f.env_var];
    if (raw === undefined || raw === '') {
      out[f.flag] = f.default;
    } else {
      // Same parsing as auth feature-flags: 1/true/yes/on (case-insensitive)
      // map to true; anything else maps to false. Caller can read the
      // override via overridden status in the inventory.
      const lo = String(raw).toLowerCase();
      out[f.flag] = ['1', 'true', 'yes', 'on'].includes(lo);
    }
  }
  return out;
}

const STATE = readEnvOnce();

export function isContentLibraryFeatureEnabled(flag: string): boolean {
  return STATE[flag] ?? false;
}

export function contentLibraryFeatureFlags(): Array<{
  flag: string;
  env_var: string;
  default: boolean;
  description: string;
  enabled: boolean;
  overridden: boolean;
}> {
  return FLAGS.map(f => {
    const enabled = STATE[f.flag] ?? f.default;
    const overridden = enabled !== f.default;
    return { ...f, enabled, overridden };
  });
}
