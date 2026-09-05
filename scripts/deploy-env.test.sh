#!/usr/bin/env bash
# Every variable the API validates at boot reaches the Cloud Run revision and the
# README's deploy table. Run: bash scripts/deploy-env.test.sh
set -euo pipefail
cd "$(dirname "$0")/.."

env_ts=reference/apps/api/src/env.ts
workflow=reference/.github/workflows/deploy-api.yml
# Cloud Run sets PORT itself and rejects it as an env var; LOG_LEVEL keeps env.ts's
# `info` on the revision. Neither is deploy configuration; everything else is.
exempt=" PORT LOG_LEVEL "

keys=$(sed -n 's/^ *\([A-Z][A-Z0-9_]*\): z\..*/\1/p' "$env_ts")
[ -n "$keys" ] || { echo "FAIL: no keys parsed out of $env_ts"; exit 1; }
table=$(grep '^|' README.md)
fail=0
for key in $keys; do
  case "$exempt" in *" $key "*) continue ;; esac
  grep -q "\b$key=" "$workflow" || { echo "FAIL: $key is in env.ts, not in $workflow"; fail=1; }
  case "$table" in *"\`$key\`"*) ;; *) echo "FAIL: $key is in env.ts, not in the README deploy table"; fail=1 ;; esac
done
[ "$fail" = 0 ] && echo "ok   every env.ts key is deployed and documented"
exit "$fail"
