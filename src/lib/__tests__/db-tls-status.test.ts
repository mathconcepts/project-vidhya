import { describe, it, expect } from 'vitest';
import { describeDatabaseTls } from '../db-tls-status';

const CERT = '-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----\n';
const throws = () => { throw new Error('ENOENT'); };

describe('describeDatabaseTls', () => {
  it('reads the sslmode the process actually has', () => {
    expect(
      describeDatabaseTls('postgresql://u:p@h:5432/postgres?sslmode=require', undefined, throws).sslmode,
    ).toBe('require');
    expect(
      describeDatabaseTls('postgresql://u:p@h:5432/postgres?sslmode=no-verify', undefined, throws).sslmode,
    ).toBe('no-verify');
  });

  it('finds sslmode when it is not the first parameter', () => {
    expect(
      describeDatabaseTls('postgresql://u:p@h:5432/postgres?application_name=x&sslmode=no-verify', undefined, throws)
        .sslmode,
    ).toBe('no-verify');
  });

  it('reports null rather than guessing when the string declares no sslmode', () => {
    // The case that fails first in practice: pg opens a plaintext connection
    // and a TLS-requiring server refuses it. "null" has to be visibly
    // different from "require", not defaulted into it.
    expect(describeDatabaseTls('postgresql://u:p@h:5432/postgres', undefined, throws).sslmode).toBeNull();
  });

  it('distinguishes an unset CA path from one pointing at nothing', () => {
    expect(describeDatabaseTls('postgres://x?sslmode=require', undefined, throws).extra_ca).toBe('unset');
    expect(describeDatabaseTls('postgres://x?sslmode=require', '/app/certs/absent.crt', throws).extra_ca).toBe(
      'missing',
    );
  });

  it('reports a readable certificate as loaded', () => {
    expect(describeDatabaseTls('postgres://x?sslmode=require', '/app/certs/ca.crt', () => CERT).extra_ca).toBe(
      'loaded',
    );
  });

  it('flags a readable file that is not a certificate', () => {
    // Node ignores it just as silently as a missing file.
    expect(describeDatabaseTls('postgres://x?sslmode=require', '/app/certs/ca.crt', () => 'oops').extra_ca).toBe(
      'not-a-certificate',
    );
  });

  it('never echoes the credential, host, or connection string', () => {
    const secret = 'postgresql://postgres.abc:hunter2@db.example.com:5432/postgres?sslmode=require';
    const out = JSON.stringify(describeDatabaseTls(secret, '/app/certs/ca.crt', () => CERT));
    for (const leak of ['hunter2', 'db.example.com', 'postgres.abc', 'postgresql://']) {
      expect(out, `/health is unauthenticated — it must never carry ${leak}`).not.toContain(leak);
    }
  });
});
