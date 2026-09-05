#!/usr/bin/env bash
# The Upgrade: lines the Sync Loop copies into its PR. Run: bash scripts/sync-loop/upgrade-lines.test.sh
set -euo pipefail
script=$(cd "$(dirname "$0")" && pwd)/upgrade-lines.sh

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# A throwaway repo whose commits carry the message shapes a Reference Project produces.
export GIT_AUTHOR_NAME=test GIT_AUTHOR_EMAIL=test@example.com
export GIT_COMMITTER_NAME=test GIT_COMMITTER_EMAIL=test@example.com
git init --quiet -b main "$tmp/repo"
cd "$tmp/repo"
commit() { git commit --quiet --allow-empty --message "$1"; }

commit "Before the range
Upgrade: this one is behind <from> and must not appear"
git tag base
commit "Add a column"
commit "Rotate AUTH_SECRET

Upgrade: run pnpm --filter api db:migrate"
commit "Mentions an upgrade in prose

The Upgrade: prefix only counts when it opens the line."
commit "Rotate AUTH_SECRET again

    Upgrade:   run pnpm --filter api db:migrate   "
commit "Two steps at once

Upgrade: set MOBILE_URL in the repo's variables
Upgrade: redeploy the API"

fail=0
check() { # <name> <expected> <from> <to>
  got=$(bash "$script" "$3" "$4")
  if [ "$got" != "$2" ]; then
    printf 'FAIL %s: expected\n%s\ngot\n%s\n' "$1" "$2" "$got"; fail=1
  else
    echo "ok   $1"
  fi
}

check "oldest first, deduplicated, prose ignored, before the range excluded" \
  'Upgrade: run pnpm --filter api db:migrate
Upgrade: set MOBILE_URL in the repo'"'"'s variables
Upgrade: redeploy the API' base HEAD

check "prints nothing when there is nothing to merge" "" base base

check "prints nothing when the commits in range carry no Upgrade: line" "" "HEAD~5" "HEAD~4"

if bash "$script" base >/dev/null 2>&1; then echo 'FAIL one argument: expected non-zero exit'; fail=1
else echo 'ok   one argument -> usage error'; fi

if bash "$script" base no-such-ref >/dev/null 2>&1; then echo 'FAIL unknown ref: expected non-zero exit'; fail=1
else echo 'ok   unknown ref -> error'; fi

exit $fail
