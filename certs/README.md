# certs/

## `supabase-prod-ca-2021.crt`

Supabase's public root CA (`CN = Supabase Root 2021 CA`, self-signed, valid
2021-04-28 → 2031-04-26). Public certificate material, not a secret — it is
the thing a client uses to *verify* the server, and it carries no private key.

### Why it is here

No module in this repo sets `ssl:` on its `pg.Pool`, so TLS is decided
entirely by the `sslmode` in `DATABASE_URL`. With `pg` 8.20, `sslmode=require`
means full verification against the container's CA store — and Supabase's
pooler presents a certificate signed by the CA above, which is not in a stock
Node trust store. The result is:

```
database_status: "error: self-signed certificate in certificate chain"
```

The two ways out are `sslmode=no-verify` (encrypted, but the server's identity
is never checked, so a man-in-the-middle between the app and the database is
undetectable) and trusting this CA explicitly. This file is the second one.

`demo/Dockerfile` copies it to `/app/certs/` and `render.yaml` points
`NODE_EXTRA_CA_CERTS` at it, which Node reads at process start and adds to the
default trust store. No application code changes, and every `pg.Pool` in the
process benefits, not just the ones someone remembered to configure.

### Verifying it

Fetched from Supabase's own download bucket. Compare against the certificate
your project's dashboard serves (Settings → Database → SSL Configuration)
before trusting it:

```
openssl x509 -in certs/supabase-prod-ca-2021.crt -noout -fingerprint -sha256
SHA256 Fingerprint=80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA
```

### When it expires

2031-04-26, or sooner if Supabase rotates. The symptom is the error above
returning at `/health`. Replace this file and redeploy; nothing else changes.
