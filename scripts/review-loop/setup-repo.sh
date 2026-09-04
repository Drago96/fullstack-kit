#!/usr/bin/env bash
# One-time repo setup for the Review Loop (ADR 0008). Usage: bash scripts/review-loop/setup-repo.sh <owner/repo> [default-branch]
# Requires: gh authenticated as an admin of the repo; secrets CLAUDE_CODE_OAUTH_TOKEN (and optionally REVIEW_LOOP_GH_TOKEN) set separately.
set -euo pipefail
repo=$1 branch=${2:-master}
gh api --method PATCH "repos/$repo" -F allow_auto_merge=true -F delete_branch_on_merge=true -F allow_squash_merge=true >/dev/null
gh api --method PUT "repos/$repo/branches/$branch/protection" --input - >/dev/null <<JSON
{"required_status_checks":{"strict":true,"contexts":["Reference Project","Review Loop"]},
 "enforce_admins":true,"required_pull_request_reviews":null,"restrictions":null,
 "allow_force_pushes":false,"allow_deletions":false}
JSON
echo "auto-merge on, $branch protected: required checks 'Reference Project' + 'Review Loop', no direct pushes"
