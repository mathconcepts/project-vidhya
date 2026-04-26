#!/usr/bin/env bash
#
# scripts/netlify-prebuild.sh
#
# Substitute the __BACKEND_URL__ placeholder in netlify.toml with the
# value of the BACKEND_URL env var. Runs as the first step of the
# Netlify build command.
#
# Why we need this:
#
#   Netlify does NOT support env-var substitution inside
#   [[redirects]] 'to' fields natively. (The docs explicitly state:
#   "Using environment variables directly as values in your
#   netlify.toml isn't supported.") The recommended pattern from
#   Netlify is exactly what this script does — sed-replace a
#   placeholder string in the build command.
#
# Run by:
#
#   - Netlify build (from the [build] command in netlify.toml)
#   - Locally for testing:
#       BACKEND_URL=https://my-backend.example.com bash scripts/netlify-prebuild.sh
#
# Behaviour:
#
#   - Verifies BACKEND_URL is set and starts with https:// (or http://
#     if explicitly opted in via ALLOW_HTTP_BACKEND=1)
#   - Strips trailing slash on BACKEND_URL (so '__BACKEND_URL__/api/:splat'
#     doesn't become 'https://example.com//api/:splat')
#   - Replaces every occurrence of __BACKEND_URL__ in the repo-root
#     netlify.toml with the cleaned URL
#   - Prints a summary so the build log shows what got substituted
#   - FAILS LOUDLY if BACKEND_URL is missing (set -e + explicit exit 1)
#
# Idempotence:
#
#   After substitution, the placeholder is gone — running the script
#   twice in the same checkout is a no-op on the second run, with a
#   warning logged. The script also handles the case where the toml
#   was already substituted (e.g., by a local test) without error.

set -euo pipefail

# ─── Locate netlify.toml ──────────────────────────────────────────────

# This script may be invoked from either:
#   - Netlify build context: cwd = frontend/, script invoked as ../scripts/netlify-prebuild.sh
#   - Local test:           cwd = repo root, script invoked as scripts/netlify-prebuild.sh
#
# Either way, netlify.toml lives at the repo root. Resolve it relative
# to the script's own location.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TOML_PATH="$REPO_ROOT/netlify.toml"

if [ ! -f "$TOML_PATH" ]; then
  echo "✗ netlify.toml not found at $TOML_PATH" >&2
  exit 1
fi

# ─── Validate BACKEND_URL ─────────────────────────────────────────────

if [ -z "${BACKEND_URL:-}" ]; then
  echo "" >&2
  echo "✗ BACKEND_URL environment variable is not set." >&2
  echo "" >&2
  echo "  This deploy proxies /api/* requests to your backend URL." >&2
  echo "  Without BACKEND_URL, every API call from the frontend would" >&2
  echo "  return 404 — failing the build is the safer option." >&2
  echo "" >&2
  echo "  Fix:  set BACKEND_URL in Netlify dashboard" >&2
  echo "        (Site settings > Environment variables)" >&2
  echo "  Example value:  https://vidhya-demo.onrender.com" >&2
  echo "" >&2
  echo "  See DEPLOY-NETLIFY.md for the full walkthrough." >&2
  echo "" >&2
  exit 1
fi

# Strip trailing slash if present
BACKEND_URL="${BACKEND_URL%/}"

# Validate scheme
if [[ "$BACKEND_URL" =~ ^https:// ]]; then
  : # ok
elif [[ "$BACKEND_URL" =~ ^http:// ]] && [ "${ALLOW_HTTP_BACKEND:-0}" = "1" ]; then
  echo "  ⚠ BACKEND_URL uses http:// (not https://). Allowed because ALLOW_HTTP_BACKEND=1."
else
  echo "" >&2
  echo "✗ BACKEND_URL must start with https:// — got: $BACKEND_URL" >&2
  echo "" >&2
  echo "  Browsers will block mixed-content requests from a Netlify" >&2
  echo "  HTTPS frontend to an HTTP backend. Use the HTTPS URL of" >&2
  echo "  your backend (Render and most cloud hosts provide one)." >&2
  echo "" >&2
  echo "  To override (testing only): set ALLOW_HTTP_BACKEND=1." >&2
  echo "" >&2
  exit 1
fi

# ─── Substitute placeholder ───────────────────────────────────────────

PLACEHOLDER='__BACKEND_URL__'

# Count placeholders BEFORE substitution. If zero, the file was already
# processed in this checkout — log a warning but don't fail.
COUNT_BEFORE="$(grep -c -F "$PLACEHOLDER" "$TOML_PATH" || true)"

if [ "$COUNT_BEFORE" -eq 0 ]; then
  echo "  ⚠ No '$PLACEHOLDER' found in netlify.toml — already substituted?"
  echo "  Current redirect targets:"
  grep -E '^\s*to\s*=' "$TOML_PATH" | sed 's/^/    /'
  exit 0
fi

# Use a delimiter unlikely to appear in URLs ('|' is fine for normal
# URLs; even safer is using a control char, but '|' is readable in
# build logs and matches Netlify's own example in their docs).
sed -i.bak "s|$PLACEHOLDER|$BACKEND_URL|g" "$TOML_PATH"
rm -f "$TOML_PATH.bak"

# Verify substitution succeeded
COUNT_AFTER="$(grep -c -F "$PLACEHOLDER" "$TOML_PATH" || true)"
if [ "$COUNT_AFTER" -ne 0 ]; then
  echo "✗ Substitution failed — '$PLACEHOLDER' still present after sed" >&2
  exit 1
fi

# ─── Report ───────────────────────────────────────────────────────────

echo ""
echo "  ✓ netlify.toml: substituted $COUNT_BEFORE × __BACKEND_URL__ → $BACKEND_URL"
echo "  Redirect targets after substitution:"
grep -E '^\s*to\s*=' "$TOML_PATH" | sed 's/^/    /'
echo ""
