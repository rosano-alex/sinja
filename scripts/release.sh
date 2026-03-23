#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/release.sh [patch|minor|major]
# Bumps version, commits, tags, and pushes — GitHub Actions handles the rest.

BUMP="${1:-patch}"

if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
  echo "Usage: $0 [patch|minor|major]"
  exit 1
fi

# Ensure working tree is clean
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: working tree is not clean. Commit or stash changes first."
  exit 1
fi

# Ensure we're on main
BRANCH="$(git branch --show-current)"
if [[ "$BRANCH" != "main" ]]; then
  echo "Warning: you're on '$BRANCH', not 'main'. Continue? (y/N)"
  read -r CONFIRM
  [[ "$CONFIRM" == "y" ]] || exit 0
fi

# Bump version in package.json (no git tag — we do it ourselves)
NEW_VERSION="$(npm version "$BUMP" --no-git-tag-version)"
echo "Bumped to $NEW_VERSION"

# Commit and tag
git add package.json
git commit -m "release: $NEW_VERSION"
git tag "$NEW_VERSION"

echo ""
echo "Ready. Run this to publish:"
echo ""
echo "  git push origin main --tags"
echo ""
