#!/usr/bin/env bash
set -euo pipefail

# Script to create common labels and example issues on GitHub using gh CLI.
# Run locally: `bash scripts/github-setup.sh --repo owner/repo`

REPO="${1:-}"
if [ -z "$REPO" ]; then
  echo "Usage: $0 owner/repo" >&2
  exit 2
fi

echo "Creating labels for $REPO"
gh label create bug --color FF0000 --description "Bug reports" --repo "$REPO" || true
gh label create enhancement --color 0E8A16 --description "Feature requests and enhancements" --repo "$REPO" || true
gh label create docs --color 0075ca --description "Documentation" --repo "$REPO" || true
gh label create test --color 5319e7 --description "Tests" --repo "$REPO" || true
gh label create chore --color 8E8E93 --description "Chores and maintenance" --repo "$REPO" || true

echo "Creating sample issues (if not exist)"
gh issue create --title "Add CI checks" --body "Add GitHub Actions CI to run tests and lint on PRs." --label "chore" --repo "$REPO" || true
gh issue create --title "Add ISSUE/PR templates" --body "Add standard issue and PR templates to improve contributions." --label "docs" --repo "$REPO" || true

echo "Done. You can now open the project board and add these issues to it."
