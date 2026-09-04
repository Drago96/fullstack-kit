#!/usr/bin/env bash
# pick.sh [forced-issue]
# Prints the issue number the Kit Loop should implement next, or nothing at all.
# Eligible: open, `ready-for-agent`, not a `Spec:` issue, no open blocker, no open PR referencing it.
# A forced issue skips the label and blocker checks, but never the open-PR check.
set -euo pipefail
GH=${GH:-gh}
forced=${1:-}

prs=$("$GH" pr list --state open --limit 100 --json number,title,body,headRefName)

# An open PR references issue N when its head branch is `N-...`, or its title or body says closes/fixes/resolves #N.
has_open_pr() {
  printf '%s' "$prs" | jq -e --arg n "$1" 'any(.[];
      (.headRefName | startswith($n + "-"))
      or ((.title + "\n" + (.body // "")) | test("(closes|fixes|resolves) *#" + $n + "\\b"; "i")))' >/dev/null
}

if [ -n "$forced" ]; then
  state=$("$GH" issue view "$forced" --json state --jq .state 2>/dev/null || true)
  [ "$state" = OPEN ] || exit 0
  has_open_pr "$forced" || echo "$forced"
  exit 0
fi

eligible=$("$GH" issue list --label ready-for-agent --state open --limit 200 \
  --json number,title,blockedBy \
  --jq '[.[] | select(.title | startswith("Spec:") | not)
        | select([.blockedBy.nodes[]? | select(.state == "OPEN")] | length == 0)
        | .number] | sort | .[]')

while read -r n; do
  [ -n "$n" ] || continue
  if ! has_open_pr "$n"; then echo "$n"; break; fi
done <<< "$eligible"
