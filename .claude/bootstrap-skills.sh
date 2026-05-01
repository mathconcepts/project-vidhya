#!/usr/bin/env bash
# Bootstrap gstack skills for this project.
# Run once after cloning the repo.
#
# Strategy:
#   1. If gstack is already installed globally (~/.claude/skills/gstack), symlink it — fastest.
#   2. If already vendored locally, pull latest.
#   3. Otherwise clone fresh and run setup.

set -e
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GSTACK_DIR="$PROJECT_ROOT/.claude/skills/gstack"
GLOBAL_GSTACK="$HOME/.claude/skills/gstack"

if [ -L "$GSTACK_DIR" ]; then
  echo "✅ gstack symlink already in place at $GSTACK_DIR"
elif [ -d "$GLOBAL_GSTACK" ]; then
  echo "Found global gstack at $GLOBAL_GSTACK — symlinking..."
  ln -s "$GLOBAL_GSTACK" "$GSTACK_DIR"
  echo "✅ Symlinked. No clone needed."
elif [ -d "$GSTACK_DIR" ]; then
  echo "gstack already vendored at $GSTACK_DIR — pulling latest..."
  cd "$GSTACK_DIR" && git pull origin main && ./setup
else
  echo "Cloning gstack into $GSTACK_DIR..."
  git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git "$GSTACK_DIR"
  cd "$GSTACK_DIR"
  if ! command -v bun &>/dev/null; then
    echo "Installing bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
  fi
  ./setup
fi

echo ""
echo "✅ gstack ready. Available skills:"
ls "$PROJECT_ROOT/.claude/skills/" | grep -v gstack
echo ""
echo "Read CLAUDE.md for full skill documentation and routing rules."
