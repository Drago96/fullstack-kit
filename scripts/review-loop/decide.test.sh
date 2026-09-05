#!/usr/bin/env bash
# Decision table for the Review Loop (ADR 0008). Run: bash scripts/review-loop/decide.test.sh
set -euo pipefail
cd "$(dirname "$0")"
fail=0
check() { # blocking fix_rounds changes_requested expected
  got=$(bash decide.sh "$1" "$2" "$3")
  if [ "$got" != "$4" ]; then echo "FAIL decide $1 $2 $3: expected $4, got $got"; fail=1; else echo "ok   decide $1 $2 $3 -> $4"; fi
}
check 0 0 false pass      # clean review, no human veto: the Loop merges the PR
check 0 2 false pass      # clean after two fix rounds: still passes
check 3 0 false fix       # blocking findings, rounds left: fix round
check 1 1 false fix       # second and last fix round
check 1 2 false handoff   # rounds exhausted: ready-for-human
check 0 0 true  fix       # human requested changes, no agent findings: fix round
check 0 2 true  handoff   # human requested changes, rounds exhausted
if bash decide.sh null 0 false >/dev/null 2>&1; then echo 'FAIL decide null: expected non-zero exit'; fail=1; else echo 'ok   decide null -> error'; fi
exit $fail
