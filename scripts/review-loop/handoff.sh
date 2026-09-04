#!/usr/bin/env bash
# handoff.sh <pr-number> <review.md>  Label the PR ready-for-human and hoist unresolved blocking Findings into the PR body.
set -euo pipefail
pr=$1 review=$2
gh label create ready-for-human --color D93F0B --description "Needs human implementation or judgement" --force >/dev/null
gh pr edit "$pr" --add-label ready-for-human
findings=$(grep -F '[blocking]' "$review" || echo '(see the Review Loop review)')
# "Pinned": GitHub has no pinned PR comments, so the block lives at the top of the PR body and is replaced on each handoff.
body=$(gh pr view "$pr" --json body --jq .body | sed '/^<!-- review-loop:handoff -->$/,/^<!-- \/review-loop:handoff -->$/d')
printf '<!-- review-loop:handoff -->\n## Needs a human\n\nReview Loop gave up. Unresolved blocking Findings:\n\n%s\n<!-- /review-loop:handoff -->\n\n%s' "$findings" "$body" \
  | gh pr edit "$pr" --body-file -
