# Security Policy

We take security seriously because Vidhya is deployed in education
settings where students' materials and progress data must stay private.

---

## Reporting a vulnerability

**Please do not open public GitHub Issues for security problems.**

The preferred path is to open a [private security advisory](https://github.com/mathconcepts/project-vidhya/security/advisories/new) on GitHub. This routes the report to the maintainers without making it public, and provides a thread for coordinated disclosure.

If you cannot use GitHub for the report, contact the maintainer through the channel listed on the GitHub profile page of the [repository owner](https://github.com/mathconcepts).

### What to include

- A description of the issue and why it's a security concern
- Steps to reproduce — ideally a minimal PoC
- The affected version or commit SHA
- Your assessment of severity and potential impact
- Any suggested fixes or mitigations

---

## Response timeline

We aim to acknowledge reports within **72 hours** and provide a substantive
response within **14 days**.

- **Initial triage:** within 72 hours
- **Severity assessment:** within 7 days
- **Fix + disclosure plan:** within 14 days for high-severity issues
- **Public disclosure:** coordinated with the reporter, typically after a fix ships

We will credit you in the changelog and release notes unless you request
otherwise.

---

## Scope

### In scope

- Authentication and authorization bypass in `/api/*` endpoints
- Injection vulnerabilities (SQL, command, prompt injection into LLM contexts)
- Cross-site scripting (XSS) in the React frontend
- Cross-site request forgery (CSRF) on mutating endpoints
- Insecure direct object references (IDOR)
- Server-side request forgery (SSRF) via fetched URLs in the resolver or proxy
- Leakage of environment variables, API keys, or tokens
- Sandbox escapes from the client-side Python/WASM execution
- Privacy violations: unauthorized reads from `.data/` telemetry or aggregate stores
- Weak cryptography (`JWT_SECRET` usage, password hashing paths)
- Supply-chain issues in dependencies we directly maintain

### Out of scope

- Denial-of-service via resource exhaustion on open endpoints (rate limit issues go via regular Issues)
- Issues in third-party services we integrate with (report to Gemini, Wolfram, Supabase directly)
- Issues requiring privileged access that the attacker already has
- Social engineering of maintainers
- Issues in forks or downstream deployments — report to those maintainers
- Theoretical vulnerabilities without a practical exploit path
- Missing security headers that don't enable a concrete attack
- Self-XSS requiring the victim to paste attacker-controlled content into DevTools

---

## Supported versions

We support the latest minor release on `main` with security patches.
Older tagged versions receive security fixes on a best-effort basis; we
recommend upgrading.

| Version | Supported |
|---------|-----------|
| 2.2.x (current) | ✅ |
| 2.1.x | ✅ (security fixes only) |
| 2.0.x | ❌ (upgrade recommended) |
| < 2.0 | ❌ |

---

## Our security posture

Vidhya's architecture inherently reduces attack surface:

- **Stateless edge server** — no session store to compromise
- **DB-less runtime by default** — no database credentials to leak
- **Client-side document parsing** — user files never touch our servers
- **Per-device student state** — no cross-tenant data to exfiltrate
- **Aggregate telemetry is opt-in** — reduces PII exposure
- **Flat-file storage** — reduces ORM injection surface to zero
- **JWT-only auth by default** — reduces session hijack surface

This doesn't mean we're vulnerability-free — it means many classes of
issues don't apply. Focus your research where user input meets our
runtime.

---

## Coordinated disclosure

We follow coordinated disclosure. If you publish details before we've
had a chance to fix the issue and users have had a chance to upgrade,
we'll ask you to wait. We'll credit you regardless of whether you
follow our preferred timeline.

---

## Thanks

Security researchers make the ecosystem safer. We appreciate your help.
