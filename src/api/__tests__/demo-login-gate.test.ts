import { describe, it, expect } from 'vitest';
import { demoLoginAllowed, resolveTarget } from '../demo-login';

/**
 * `/demo-login` mints a real auth token for a seeded account with no credential
 * check. It was hidden by omission — the sign-in page stops advertising it once
 * OAuth is configured, but the route kept answering — which undercut the plan's
 * "no publicly reachable demo on production" decision.
 *
 * The gate must refuse exactly one configuration and no more: breaking local dev
 * or the venue instance to close a production hole would trade one problem for
 * two.
 */
describe('demoLoginAllowed', () => {
  it('allows a local dev box with no OAuth configured', () => {
    // Nothing to protect: the quick-start buttons are the intended way in.
    expect(demoLoginAllowed({} as NodeJS.ProcessEnv)).toBe(true);
  });

  it('allows the venue instance', () => {
    expect(
      demoLoginAllowed({ DEMO_MODE_ENABLED: 'true', GOOGLE_OAUTH_CLIENT_ID: 'x' } as never),
    ).toBe(true);
  });

  it('allows an existing demo deploy using the older flag', () => {
    // Silently locking these out to tidy up flag naming would be worse than
    // honouring both names.
    expect(demoLoginAllowed({ VIDHYA_DEMO_MODE: '1', GOOGLE_OAUTH_CLIENT_ID: 'x' } as never)).toBe(
      true,
    );
  });

  it('refuses a production-shaped instance: real OAuth and no demo flag', () => {
    expect(demoLoginAllowed({ GOOGLE_OAUTH_CLIENT_ID: 'x' } as never)).toBe(false);
  });

  it('treats an empty OAuth client id as unconfigured', () => {
    expect(demoLoginAllowed({ GOOGLE_OAUTH_CLIENT_ID: '' } as never)).toBe(true);
  });
});

describe('resolveTarget open-redirect guard', () => {
  const entry = { token: 't', name: 'n', email: 'e', role: 'student' };

  it('honours an in-app path', () => {
    expect(resolveTarget(entry, '/lesson/eigenvalues')).toBe('/lesson/eigenvalues');
  });

  it.each(['//evil.com', '/\\evil.com', 'https://evil.com', 'javascript:alert(1)'])(
    'refuses %o',
    (next) => {
      // This route hands out a real auth token; a redirect to another origin
      // would hand it to them.
      expect(resolveTarget(entry, next)).toBe('/');
    },
  );

  it('falls back to the role home when no next is given', () => {
    expect(resolveTarget(entry, null)).toBe('/');
    expect(resolveTarget({ ...entry, role: 'admin' }, null)).toBe('/admin/content-rd');
  });
});
