#!/usr/bin/env bash
# upgrade-lines.sh <from> <to>
# Prints the `Upgrade:` lines carried by the commits in <from>..<to>, one per line, oldest
# first, duplicates dropped. A Reference Project commit needing a manual step in every
# Project carries one (ADR 0006); the Sync Loop copies them into its pull request, where a
# human does them. A line counts only when `Upgrade:` opens it — a mention mid-sentence is
# prose, not an instruction.
set -euo pipefail
[ $# -eq 2 ] || { echo "usage: upgrade-lines.sh <from> <to>" >&2; exit 64; }

git log --reverse --format=%B "$1..$2" | awk '
  match($0, /^[[:space:]]*Upgrade:[[:space:]]*/) {
    step = substr($0, RSTART + RLENGTH)
    sub(/[[:space:]]+$/, "", step)
    if (step != "" && !seen[step]++) print "Upgrade: " step
  }'
