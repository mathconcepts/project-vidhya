#!/usr/bin/env bash
# scripts/snapshot-list.sh
# List all snapshots (git tags matching snapshot-*) with manifest summary.

set -euo pipefail
cd "$(dirname "$0")/.."

echo "Snapshots (newest first):"
echo ""

# Get all snapshot tags, newest first by tag name (timestamps sort naturally)
TAGS=$(git tag --list 'snapshot-*' | sort -r)

if [[ -z "$TAGS" ]]; then
  echo "  (none yet — create one with: bash scripts/snapshot.sh)"
  exit 0
fi

printf "%-40s %-12s %-12s %s\n" "TAG" "SHA" "BRANCH" "DOCKER"
printf "%-40s %-12s %-12s %s\n" "----------------------------------------" "------------" "------------" "------"

while IFS= read -r tag; do
  sha=$(git rev-parse --short "$tag" 2>/dev/null || echo "?")
  # Extract branch from tag annotation
  branch=$(git tag -l --format='%(contents)' "$tag" 2>/dev/null | grep -m1 '^Branch:' | awk '{print $2}' || echo "?")
  # Check if Docker image exists locally
  if command -v docker >/dev/null 2>&1 && docker image inspect "project-vidhya:${tag}" >/dev/null 2>&1; then
    docker_status="✓ local"
  else
    docker_status="—"
  fi
  printf "%-40s %-12s %-12s %s\n" "$tag" "$sha" "$branch" "$docker_status"
done <<< "$TAGS"

echo ""
echo "Show one:    cat docs/snapshots/<tag>.md"
echo "Run image:   docker run -p 8080:8080 --env-file .env project-vidhya:<tag>"
echo "Push tag:    git push origin <tag>"
