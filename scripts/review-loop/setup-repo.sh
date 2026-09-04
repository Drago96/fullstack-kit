#!/usr/bin/env bash
# One-time repo setup for the Review Loop (ADR 0008).
# Usage: bash scripts/review-loop/setup-repo.sh <owner/repo> [default-branch] [required-check ...]  (default checks: "Reference Project" "Review Loop")
# Requires: gh authenticated as an admin of the repo; secrets CLAUDE_CODE_OAUTH_TOKEN (and optionally REVIEW_LOOP_GH_TOKEN) set separately.
set -euo pipefail
repo=$1 branch=${2:-master}; shift $(( $# < 2 ? $# : 2 ))
checks=$(printf '"%s",' "${@:-Reference Project}" "${@:+}" | sed 's/,"",//; s/,$//')
[ $# -eq 0 ] && checks='"Reference Project","Review Loop"'
gh api --method PATCH "repos/$repo" -F allow_auto_merge=true -F delete_branch_on_merge=true -F allow_squash_merge=true >/dev/null
gh api --method PUT "repos/$repo/branches/$branch/protection" --input - >/dev/null <<JSON
{"required_status_checks":{"strict":false,"contexts":[$checks]},
 "enforce_admins":true,"required_pull_request_reviews":null,"restrictions":null,
 "allow_force_pushes":false,"allow_deletions":false}
JSON
echo "auto-merge on, $branch protected: required checks [$checks], no direct pushes"
