/**
 * The pieces that let `sslmode=require` actually verify Supabase's pooler.
 *
 * Background. No module in this repo sets `ssl:` on its `pg.Pool`, so TLS is
 * decided entirely by the `sslmode` in DATABASE_URL. With `pg` 8.20,
 * `sslmode=require` means full verification against the container's CA store,
 * and Supabase's pooler presents a certificate signed by "Supabase Root 2021
 * CA" — absent from a stock Node trust store. Observed on the live deploy:
 *
 *   database_status: "error: self-signed certificate in certificate chain"
 *
 * The alternative to trusting that CA is `sslmode=no-verify`, which keeps the
 * traffic encrypted but stops checking who is on the other end. So the CA
 * ships in the image and NODE_EXTRA_CA_CERTS points at it.
 *
 * Three separate things have to stay true for that to work, and each fails
 * silently on its own: the file exists, the image copies it, and the env var
 * names the path it lands at. These assert all three, plus a fingerprint pin
 * so swapping the certificate is a deliberate act somebody reviews rather
 * than a quiet change to what the deployment trusts.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT = path.resolve(__dirname, '../../..');
const CERT_REL = 'certs/supabase-prod-ca-2021.crt';
const CERT = path.join(ROOT, CERT_REL);

/** Path the certificate lands at inside the image (WORKDIR /app). */
const IN_IMAGE_PATH = '/app/certs/supabase-prod-ca-2021.crt';

/**
 * SHA-256 of the DER body of "CN = Supabase Root 2021 CA", the fingerprint
 * `openssl x509 -fingerprint -sha256` prints. Compare against what the
 * Supabase dashboard serves (Settings → Database → SSL Configuration) before
 * changing it.
 */
const PINNED_SHA256 =
  '807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa';

describe('Supabase CA trust wiring', () => {
  it('ships the certificate', () => {
    expect(fs.existsSync(CERT), `${CERT_REL} is missing`).toBe(true);
  });

  it('is a PEM certificate, not a private key or a stray download', () => {
    const pem = fs.readFileSync(CERT, 'utf8');
    expect(pem).toMatch(/^-----BEGIN CERTIFICATE-----/);
    expect(pem).toMatch(/-----END CERTIFICATE-----\s*$/);
    // A private key here would be a real incident, not a typo.
    expect(pem).not.toMatch(/PRIVATE KEY/);
  });

  it('is the pinned certificate', () => {
    const pem = fs.readFileSync(CERT, 'utf8');
    const der = Buffer.from(
      pem.replace(/-----(BEGIN|END) CERTIFICATE-----/g, '').replace(/\s+/g, ''),
      'base64',
    );
    const got = crypto.createHash('sha256').update(der).digest('hex');
    expect(
      got,
      `${CERT_REL} is not the reviewed certificate. If this is an intentional ` +
        `rotation, verify the new fingerprint against the Supabase dashboard and ` +
        `update PINNED_SHA256 in the same commit.`,
    ).toBe(PINNED_SHA256);
  });

  it('has not expired, and is not about to', () => {
    const cert = new crypto.X509Certificate(fs.readFileSync(CERT));
    const notAfter = new Date(cert.validTo).getTime();
    // 90 days of warning: the failure mode is the deployed database going
    // unreachable, and that should never be a surprise.
    expect(
      notAfter - Date.now() > 90 * 24 * 3600 * 1000,
      `${CERT_REL} expires ${cert.validTo}. Replace it before it does — the ` +
        `symptom is the certificate-chain error returning at /health.`,
    ).toBe(true);
    expect(cert.ca).toBe(true);
  });

  it('is copied into the demo image', () => {
    const dockerfile = fs.readFileSync(path.join(ROOT, 'demo', 'Dockerfile'), 'utf8');
    expect(
      /^COPY\s+certs\/\s+certs\//m.test(dockerfile),
      'demo/Dockerfile must COPY certs/ — without it NODE_EXTRA_CA_CERTS points at nothing',
    ).toBe(true);
  });

  it('points NODE_EXTRA_CA_CERTS at where the copy lands', () => {
    const render = fs.readFileSync(path.join(ROOT, 'render.yaml'), 'utf8');
    expect(render).toMatch(/key:\s*NODE_EXTRA_CA_CERTS/);
    expect(
      render.includes(IN_IMAGE_PATH),
      `render.yaml must set NODE_EXTRA_CA_CERTS to ${IN_IMAGE_PATH} — the path ` +
        `has to match WORKDIR (/app) plus the COPY destination (certs/)`,
    ).toBe(true);
  });
});
