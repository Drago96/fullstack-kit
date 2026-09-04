#!/usr/bin/env bash
# decide.sh <blocking-findings> <fix-rounds-so-far> <changes-requested:true|false>
# Prints one of: pass | fix | handoff   (ADR 0008: at most 2 Fix Rounds)
set -euo pipefail
blocking=$1 rounds=$2 changes_requested=$3
if [ "$blocking" -eq 0 ] && [ "$changes_requested" != true ]; then echo pass
elif [ "$rounds" -lt 2 ]; then echo fix
else echo handoff
fi
