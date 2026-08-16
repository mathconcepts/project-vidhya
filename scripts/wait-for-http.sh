#!/usr/bin/env bash
#
# wait-for-http.sh <url> [wait_seconds]
#
# Block until a URL returns a real HTTP status, or the deadline passes.
# Exit 0 when the service answered, 1 when it never did.
#
# ── Why this is a script and not four lines inline in a workflow ────────────
#
# It used to be four lines inline in .github/workflows/prod-smoke.yml, and it
# was wrong in a way nobody could see:
#
#   CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 "$URL/" || echo 000)
#   case "$CODE" in
#     5*|000) echo "waiting..."; sleep 20 ;;
#     *)      echo "service answering: $CODE"; exit 0 ;;
#   esac
#
# When curl never gets a response it prints its OWN `000` for %{http_code} and
# THEN exits non-zero — so `|| echo 000` appended a second one and the variable
# held `000000`. That matches neither `5*` nor `000`, so it fell through to the
# catch-all and reported "service answering: 000000". The wait became a no-op
# in precisely the situation it exists for: the service being down.
#
# The check passed for weeks because the service happened to be up every time
# it ran. It failed the first time it was pointed at a deploy still in flight.
#
# Two changes stop that class of bug rather than just this instance:
#
#   1. **The allowlist is inverted.** Only an explicit 2xx/3xx/4xx counts as an
#      answer. Anything else — 5xx, 000, 000000, empty, a future curl writing
#      something unforeseen — waits. An unrecognised value now fails safe
#      instead of reporting success.
#   2. **It is a file, so it can be tested.** `CURL_BIN` lets a test stub curl
#      and drive every branch, which is what scripts/__tests__ does. Logic that
#      only exists inside a workflow step can only be tested in production.
#
# Env overrides (all for tests):
#   CURL_BIN       — curl replacement (default: curl)
#   POLL_SECONDS   — sleep between probes (default: 20)
#   PROBE_TIMEOUT  — per-probe --max-time (default: 25)

set -uo pipefail

URL=${1:-}
if [ -z "$URL" ]; then
  echo "usage: wait-for-http.sh <url> [wait_seconds]" >&2
  exit 2
fi
WAIT_SECONDS=${2:-600}
POLL_SECONDS=${POLL_SECONDS:-20}
PROBE_TIMEOUT=${PROBE_TIMEOUT:-25}
CURL=${CURL_BIN:-curl}

# Note the absence of `|| echo`: curl's own output is the only source of the
# code, so a failure can never concatenate two values together.
probe() {
  "$CURL" -s -o /dev/null -w '%{http_code}' --max-time "$PROBE_TIMEOUT" "$URL" 2>/dev/null
}

# A real answer, including auth-gated ones. This checker only establishes that
# something is serving HTTP; whether the response is CORRECT is the caller's
# job, and conflating the two is how a liveness check starts lying.
answered() {
  case "$1" in
    2??|3??|4??) return 0 ;;
    *) return 1 ;;
  esac
}

DEADLINE=$(( $(date +%s) + WAIT_SECONDS ))
while :; do
  CODE=$(probe)
  if answered "$CODE"; then
    echo "service answering: $CODE"
    exit 0
  fi
  # Print the raw value rather than a tidied one. `000000` on this line is what
  # would have exposed the original bug on day one.
  echo "waiting... (${CODE:-no-response})"
  [ "$(date +%s)" -ge "$DEADLINE" ] && break
  sleep "$POLL_SECONDS"
done

echo "::error::Service never returned a real HTTP status within ${WAIT_SECONDS}s (last: ${CODE:-no-response})"
exit 1
