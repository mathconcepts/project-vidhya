#!/usr/bin/env bash
# =============================================================================
# scripts/snapshot.sh
# =============================================================================
# Create a deployable snapshot of the current repo + Docker image.
#
# A snapshot bundles three immutable things:
#   1. Git tag pointing at HEAD (the source code)
#   2. Docker image tagged with the same name (the runtime)
#   3. Manifest file at docs/snapshots/<tag>.md (the metadata)
#
# Why this exists:
#   - "Deployable to cloud as-is on any given date" needs a freezable artifact
#   - Each tier/exam experiment can be tied to a snapshot for reproducibility
#   - The manifest doubles as a changelog entry and audit trail
#
# Usage:
#   bash scripts/snapshot.sh                       # auto-named: snapshot-20260502-1245
#   bash scripts/snapshot.sh "exam-pack-bitsat"    # named:      snapshot-20260502-1245-exam-pack-bitsat
#   bash scripts/snapshot.sh --force "..."          # skip clean-tree check (not recommended)
#   bash scripts/snapshot.sh --no-docker "..."      # skip docker build (git tag + manifest only)
#   bash scripts/snapshot.sh --push "..."           # also push git tag to origin
#
# After the snapshot exists, deploy it with:
#   bash scripts/deploy-snapshot.sh <tag>          # (added in next iteration)
# =============================================================================

set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

# -------- args --------------------------------------------------------------
FORCE=0
NO_DOCKER=0
PUSH=0
NAME_SUFFIX=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force) FORCE=1 ;;
    --no-docker) NO_DOCKER=1 ;;
    --push) PUSH=1 ;;
    --help|-h)
      sed -n '3,30p' "$0"
      exit 0
      ;;
    -*) echo "Unknown flag: $1" >&2; exit 2 ;;
    *) NAME_SUFFIX="$1" ;;
  esac
  shift
done

# Sanitize name: lowercase, alphanumeric + hyphens only
if [[ -n "$NAME_SUFFIX" ]]; then
  NAME_SUFFIX="$(echo "$NAME_SUFFIX" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9-' '-' | sed 's/--*/-/g; s/^-//; s/-$//')"
fi

# -------- preflight ---------------------------------------------------------
TIMESTAMP="$(date -u +%Y%m%d-%H%M)"
TAG="snapshot-${TIMESTAMP}${NAME_SUFFIX:+-$NAME_SUFFIX}"

echo "→ Snapshot tag: ${TAG}"

# Working tree must be clean (unless --force)
if [[ "$FORCE" -eq 0 ]]; then
  if ! git diff-index --quiet HEAD --; then
    echo "✗ Working tree has uncommitted changes:" >&2
    git status --short >&2
    echo "" >&2
    echo "  Commit or stash, then retry. Use --force to override (not recommended)." >&2
    exit 1
  fi
fi

# Need to be on a branch (so we know provenance)
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" == "HEAD" ]]; then
  echo "✗ Detached HEAD — checkout a branch first." >&2
  exit 1
fi

GIT_SHA="$(git rev-parse HEAD)"
GIT_SHA_SHORT="$(git rev-parse --short HEAD)"

# Tag must not already exist
if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
  echo "✗ Tag ${TAG} already exists. Wait a minute or pass a different suffix." >&2
  exit 1
fi

# -------- step 1: git tag ---------------------------------------------------
echo ""
echo "[1/4] Creating git tag ${TAG} → ${GIT_SHA_SHORT}"
git tag -a "${TAG}" -m "Snapshot ${TAG}

Branch: ${BRANCH}
Commit: ${GIT_SHA}
Created: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
"

# -------- step 2: docker build ----------------------------------------------
DOCKER_IMAGE_NAME="project-vidhya"
DOCKER_REF="${DOCKER_IMAGE_NAME}:${TAG}"

if [[ "$NO_DOCKER" -eq 1 ]]; then
  echo "[2/4] Docker build skipped (--no-docker)"
elif ! command -v docker >/dev/null 2>&1; then
  echo "[2/4] Docker not installed; skipping image build"
elif ! docker info >/dev/null 2>&1; then
  echo "[2/4] Docker daemon not running; skipping image build"
else
  echo "[2/4] Building Docker image ${DOCKER_REF}"
  docker build -t "${DOCKER_REF}" -t "${DOCKER_IMAGE_NAME}:latest" . >/tmp/snapshot-build.log 2>&1 || {
    echo "✗ Docker build failed. See /tmp/snapshot-build.log" >&2
    echo "  Removing git tag ${TAG} (rollback)..." >&2
    git tag -d "${TAG}" >/dev/null 2>&1 || true
    exit 1
  }
  echo "  ✓ Image: ${DOCKER_REF}"
  echo "  ✓ Image: ${DOCKER_IMAGE_NAME}:latest"
fi

# -------- step 3: write manifest --------------------------------------------
echo "[3/4] Writing manifest"
mkdir -p docs/snapshots
MANIFEST="docs/snapshots/${TAG}.md"

# Capture key facts at snapshot time
NODE_VER="$(node -v 2>/dev/null || echo unknown)"
NPM_VER="$(npm -v 2>/dev/null || echo unknown)"
PKG_VERSION="$(node -e "console.log(require('./package.json').version)" 2>/dev/null || echo unknown)"
MIGRATION_COUNT="$(ls supabase/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')"
EXAM_PACKS="$(ls data/curriculum/*.yml 2>/dev/null | wc -l | tr -d ' ')"
LAST_COMMITS="$(git log -5 --oneline)"

cat > "${MANIFEST}" <<EOF
# Snapshot ${TAG}

| Field | Value |
|---|---|
| Tag | \`${TAG}\` |
| Git branch | \`${BRANCH}\` |
| Git SHA | \`${GIT_SHA}\` |
| Created (UTC) | $(date -u +"%Y-%m-%dT%H:%M:%SZ") |
| Created by | \`$(git config user.name) <$(git config user.email)>\` |
| Package version | \`${PKG_VERSION}\` |
| Node | \`${NODE_VER}\` |
| npm | \`${NPM_VER}\` |
| Migrations | ${MIGRATION_COUNT} files |
| Exam packs | ${EXAM_PACKS} (data/curriculum/) |
| Docker image | \`${DOCKER_REF}\`$([ "$NO_DOCKER" -eq 1 ] && echo " (skipped)") |

## Recent commits

\`\`\`
${LAST_COMMITS}
\`\`\`

## Required env vars (minimum to boot)

- \`JWT_SECRET\` — 16+ char secret
- \`DATABASE_URL\` — Postgres connection string (or compose's bundled db)

## Optional env vars (degrade gracefully)

- \`GEMINI_API_KEY\` — chat + content generation (otherwise 503 on /api/chat)
- \`OPENAI_API_KEY\` — TTS narration + multi-LLM consensus (otherwise narration off)
- \`ANTHROPIC_API_KEY\` — alternate LLM provider
- \`WOLFRAM_APP_ID\` — Tier 3 verification (otherwise verifier degrades to LLM-only)

## How to deploy this snapshot

\`\`\`bash
# Local re-run:
docker run -p 8080:8080 --env-file .env ${DOCKER_REF}

# Or roll back to this exact code:
git checkout ${TAG}
\`\`\`

## Notes

<!-- Edit this section with hypothesis, experiment goal, or feedback after deploy -->
EOF

echo "  ✓ Wrote ${MANIFEST}"

# Append to index
INDEX="docs/snapshots/INDEX.md"
if [[ ! -f "${INDEX}" ]]; then
  cat > "${INDEX}" <<'EOF'
# Snapshot Index

Each row is a frozen, deployable artifact. Newest first.

| Tag | Branch | SHA | Created (UTC) | Notes |
|---|---|---|---|---|
EOF
fi

# Insert new row right after the header table line (after the | --- | row)
TMP_INDEX="$(mktemp)"
awk -v tag="${TAG}" -v branch="${BRANCH}" -v sha="${GIT_SHA_SHORT}" -v ts="$(date -u +"%Y-%m-%d %H:%M")" '
  BEGIN { inserted = 0 }
  /^\|---/ && !inserted {
    print
    print "| [`" tag "`](" tag ".md) | `" branch "` | `" sha "` | " ts " | _add notes_ |"
    inserted = 1
    next
  }
  { print }
' "${INDEX}" > "${TMP_INDEX}"
mv "${TMP_INDEX}" "${INDEX}"
echo "  ✓ Updated ${INDEX}"

# -------- step 4: optional push ---------------------------------------------
if [[ "$PUSH" -eq 1 ]]; then
  echo "[4/4] Pushing tag to origin"
  git push origin "${TAG}"
  echo "  ✓ Pushed ${TAG}"
else
  echo "[4/4] Tag is local only. Push later with: git push origin ${TAG}"
fi

# -------- done --------------------------------------------------------------
echo ""
echo "✓ Snapshot ${TAG} created."
echo ""
echo "  Manifest: ${MANIFEST}"
echo "  List all: bash scripts/snapshot-list.sh"
[[ "$NO_DOCKER" -eq 0 ]] && echo "  Run image: docker run -p 8080:8080 --env-file .env ${DOCKER_REF}"
echo ""
echo "  Don't forget to commit the manifest:"
echo "    git add docs/snapshots/ && git commit -m 'snapshot: ${TAG}'"
