#!/usr/bin/env bash
#
# scripts/update-readme-url.sh
#
# Update the live demo URL in README.md and DEPLOY.md after deploying
# to Render (or any host).
#
# Usage:
#
#   bash scripts/update-readme-url.sh https://your-service.onrender.com
#
# Why this exists:
#
#   The README's Render section has a "Live demo URL: none yet"
#   placeholder. After clicking the Deploy-to-Render button and
#   getting a real URL, the operator has to remember which files
#   reference the URL and update each by hand. This script does it
#   in one command so the placeholder + the real URL never drift
#   out of sync.
#
# What it changes:
#
#   - README.md           "Live demo URL:" line → real URL with a link
#   - DEPLOY.md           "Live demo URL:" line if present (added by this script if not)
#
# What it does NOT change:
#
#   - render.yaml          (the BACKEND_URL there is irrelevant — Render
#                           writes its own URL on first deploy)
#   - netlify.toml         (uses BACKEND_URL env var, set in Netlify
#                           dashboard, not in this file)
#   - DEPLOY-NETLIFY.md    (URL examples are illustrative; the real
#                           value is set per-deploy in Netlify dashboard)
#
# Safe to run repeatedly — replaces existing URL if one is already there.

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <live-url>" >&2
  echo "" >&2
  echo "  Example: $0 https://vidhya-demo.onrender.com" >&2
  exit 1
fi

URL="$1"
URL="${URL%/}"  # strip trailing slash

# Validate
if [[ ! "$URL" =~ ^https:// ]]; then
  echo "✗ URL must start with https:// — got: $URL" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

README="$REPO_ROOT/README.md"
DEPLOY_DOC="$REPO_ROOT/DEPLOY.md"

# ─── README.md ────────────────────────────────────────────────────────

if [ ! -f "$README" ]; then
  echo "✗ $README not found" >&2
  exit 1
fi

# Two cases:
#   (a) placeholder ("none yet — operator action required")
#   (b) already populated with a previous URL — replace it

if grep -q "Live demo URL:.* _none yet" "$README"; then
  # Replace the placeholder block (and the operator-instruction blockquote
  # that follows it). The blockquote spans 3 lines:
  #
  #   > **Live demo URL:** _none yet — operator action required._
  #   >
  #   > Once the maintainer ... operator action.
  #
  # Use a Python script for multi-line replacement (sed is fragile across
  # platforms for this).
  python3 - "$README" "$URL" <<'PY'
import sys, re
path, url = sys.argv[1], sys.argv[2]
with open(path) as f:
    content = f.read()
new_block = f"> **Live demo URL:** [{url}]({url})\n"
# Match the placeholder blockquote (3 lines starting with `> **Live demo URL:** _none yet`).
pattern = re.compile(
    r"> \*\*Live demo URL:\*\* _none yet[^\n]*\n>\s*\n> Once the maintainer[^\n]*\n",
    re.MULTILINE,
)
new_content = pattern.sub(new_block, content)
if new_content == content:
    print("  ⚠ README placeholder pattern not matched — no change to README.md", file=sys.stderr)
    sys.exit(2)
with open(path, 'w') as f:
    f.write(new_content)
print("  ✓ README.md: replaced placeholder with live URL")
PY
elif grep -q "^> \*\*Live demo URL:\*\*" "$README"; then
  # Already populated — replace the URL on that line
  python3 - "$README" "$URL" <<'PY'
import sys, re
path, url = sys.argv[1], sys.argv[2]
with open(path) as f:
    content = f.read()
new_line = f"> **Live demo URL:** [{url}]({url})"
new_content = re.sub(
    r"^> \*\*Live demo URL:\*\*.*$",
    new_line,
    content,
    count=1,
    flags=re.MULTILINE,
)
with open(path, 'w') as f:
    f.write(new_content)
print(f"  ✓ README.md: updated existing URL to {url}")
PY
else
  echo "  ⚠ README.md does not contain a 'Live demo URL:' line — skipping"
fi

# ─── DEPLOY.md ────────────────────────────────────────────────────────

if [ ! -f "$DEPLOY_DOC" ]; then
  echo "  ⚠ $DEPLOY_DOC not found — skipping"
else
  if grep -q "^> \*\*Live demo URL:\*\*" "$DEPLOY_DOC"; then
    python3 - "$DEPLOY_DOC" "$URL" <<'PY'
import sys, re
path, url = sys.argv[1], sys.argv[2]
with open(path) as f:
    content = f.read()
new_line = f"> **Live demo URL:** [{url}]({url})"
new_content = re.sub(
    r"^> \*\*Live demo URL:\*\*.*$",
    new_line,
    content,
    count=1,
    flags=re.MULTILINE,
)
with open(path, 'w') as f:
    f.write(new_content)
print(f"  ✓ DEPLOY.md: updated existing URL to {url}")
PY
  else
    echo "  ⚠ DEPLOY.md does not contain a 'Live demo URL:' line — add one manually if desired"
  fi
fi

# ─── Done ─────────────────────────────────────────────────────────────

echo ""
echo "Live URL updated: $URL"
echo ""
echo "Next steps:"
echo "  1. Verify the URL works:    curl $URL/health"
echo "  2. Review the diff:         git diff README.md DEPLOY.md"
echo "  3. Commit:                  git add README.md DEPLOY.md && git commit -m 'docs: add live demo URL'"
echo ""
