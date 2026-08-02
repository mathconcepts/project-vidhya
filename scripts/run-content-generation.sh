#!/usr/bin/env bash
# run-content-generation.sh — unattended content-generation runner.
#
#   npm run content:generate:auto
#   VIDHYA_SYLLABUS=jee-main npm run content:generate:auto   # any registered syllabus
#
# Runs `content:setup` once (upfront credential + DB check), then loops
# `content:generate` — each run processes as many concepts as its
# per-run LLM-call budget allows and then either completes or pauses with
# a resumable checkpoint (quota budget, or the new circuit breaker on a
# run of provider failures). This script keeps re-running it until the
# job actually finishes or hits a real (non-resumable) failure, then
# fires a native OS notification so you don't have to watch the terminal.
#
# This runs entirely on THIS machine — Claude/Cowork cannot itself keep a
# network-connected process alive here, so this script is the actual
# "walk away and get pinged" unit. Start it, background it if you like
# (`npm run content:generate:auto &`, or `nohup ... &` to survive closing
# the terminal), and it notifies you when there's something to look at.
#
# Syllabus-agnostic: VIDHYA_SYLLABUS selects which one (default gate-ma;
# see src/constants/syllabus-registry.ts for what's registered and what
# "syllabus-agnostic" does and doesn't cover). This script itself has no
# syllabus-specific logic — content:setup and content:generate resolve it.
set -uo pipefail

SYLLABUS="${VIDHYA_SYLLABUS:-gate-ma}"
STATUS_FILE=".data/jobs/content-generation.status.json"
MAX_ITERATIONS=100
BREATHER_SECONDS=5

notify() {
  local title="$1" message="$2"
  if command -v osascript >/dev/null 2>&1; then
    osascript -e "display notification \"${message//\"/\\\"}\" with title \"${title//\"/\\\"}\" sound name \"Glass\"" >/dev/null 2>&1 || true
  elif command -v notify-send >/dev/null 2>&1; then
    notify-send "$title" "$message" || true
  fi
  echo ""
  echo "=== $title ==="
  echo "$message"
}

read_status_field() {
  # $1 = jq-less field path via a tiny node one-liner; keeps this script
  # dependency-free (no jq requirement).
  node -e "
    try {
      const s = JSON.parse(require('fs').readFileSync('$STATUS_FILE', 'utf-8'));
      console.log($1);
    } catch (e) {
      console.log('');
    }
  " 2>/dev/null
}

echo "== content-generation [$SYLLABUS]: credential + DB preflight =="
if ! npm run content:setup; then
  notify "Content generation — blocked" "Setup preflight failed for syllabus \"$SYLLABUS\" (see terminal output above) — fix the reported credential and re-run npm run content:setup."
  exit 1
fi

echo ""
echo "== content-generation [$SYLLABUS]: starting unattended run (up to $MAX_ITERATIONS resumes) =="
for ((i = 1; i <= MAX_ITERATIONS; i++)); do
  echo ""
  echo "--- iteration $i/$MAX_ITERATIONS ---"
  npm run content:generate
  EXIT_CODE=$?

  STATE=$(read_status_field "s.state")

  if [ "$STATE" = "completed" ]; then
    SUMMARY=$(read_status_field "\`done=\${s.progress.done} skipped=\${s.progress.skipped} failed=\${s.progress.failed} of \${s.progress.total}\`")
    notify "Content generation — done" "[$SYLLABUS] All concepts processed ($SUMMARY). Next: npm run content:explainers, then content:bundle."
    exit 0
  fi

  if [ "$STATE" = "paused" ] && [ "$EXIT_CODE" -eq 0 ]; then
    MSG=$(read_status_field "s.message || ''")
    echo "paused with a resumable checkpoint (${MSG:-no message}) — resuming in ${BREATHER_SECONDS}s"
    sleep "$BREATHER_SECONDS"
    continue
  fi

  # Anything else (failed / refused / unknown state) — stop. Don't spin on
  # a hard failure like a bad key or a corrupt checkpoint.
  MSG=$(read_status_field "s.message || s.last_error || s.state")
  notify "Content generation — stopped" "${MSG:-exited with code $EXIT_CODE — check the terminal output above}"
  exit 1
done

notify "Content generation — stopped" "Hit the $MAX_ITERATIONS-resume safety cap without completing — check .data/jobs/content-generation.status.json and the terminal log."
exit 1
