#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-}"
if [[ -z "$VERSION" ]]; then
  echo "Usage: scripts/release-cut.sh <version>"
  echo "Example: scripts/release-cut.sh 1.6.0"
  exit 1
fi

TAG="v${VERSION}"
BRANCH="release/${TAG}"
NOTES_FILE="release-notes-${TAG}.md"

if [[ ! -f "CHANGELOG.md" ]]; then
  echo "CHANGELOG.md not found"
  exit 1
fi

if [[ ! -f "docs/MIGRATION_1_6_0.md" ]]; then
  echo "docs/MIGRATION_1_6_0.md not found"
  exit 1
fi

git checkout -b "${BRANCH}"

if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
  echo "Tag ${TAG} already exists locally; reusing."
else
  git tag "${TAG}"
fi

{
  echo "# Release ${TAG}"
  echo ""
  echo "## Changelog"
  echo ""
  awk -v version="${VERSION}" '
    $0 ~ "^## \\[" version "\\]" { capture=1; print; next }
    capture==1 && $0 ~ "^## \\[" { exit }
    capture==1 { print }
  ' CHANGELOG.md
  echo ""
  echo "## Migration"
  echo ""
  cat docs/MIGRATION_1_6_0.md
} > "${NOTES_FILE}"

echo "Created branch: ${BRANCH}"
echo "Created/verified tag: ${TAG}"
echo "Generated notes: ${NOTES_FILE}"
echo "Next:"
echo "  git push origin ${BRANCH}"
echo "  git push origin ${TAG}"
