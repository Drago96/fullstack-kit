#!/usr/bin/env bash
# Issue selection for the Kit Loop. Run: bash scripts/kit-loop/pick.test.sh
set -euo pipefail
cd "$(dirname "$0")"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# A fake gh answering from $ISSUES and $PRS, applying whatever --jq it is handed, like the real one.
cat > "$tmp/gh" <<'FAKE'
#!/usr/bin/env bash
set -euo pipefail
sub="$1 ${2:-}" num=${3:-} jqexpr=
case "$sub" in
  "issue list" | "issue view") data=$ISSUES ;;
  "pr list") data=$PRS ;;
  *) echo "fake gh: unexpected call: $*" >&2; exit 64 ;;
esac
while [ $# -gt 0 ]; do
  case $1 in --jq) jqexpr=${2:-.}; shift 2 ;; *) shift ;; esac
done
if [ "$sub" = "issue view" ]; then
  # Real gh fails when the issue does not exist; -e makes an empty result non-zero.
  printf '%s' "$data" | jq -e --arg n "$num" '.[] | select(.number == ($n | tonumber))' | jq -r "${jqexpr:-.}"
else
  printf '%s' "$data" | jq -r "${jqexpr:-.}"
fi
FAKE
chmod +x "$tmp/gh"
export GH="$tmp/gh"

fail=0
check() { # <name> <expected> <issues> <prs> [forced]
  got=$(ISSUES="$3" PRS="$4" bash pick.sh "${5:-}")
  if [ "$got" != "$2" ]; then echo "FAIL $1: expected '$2', got '$got'"; fail=1; else echo "ok   $1 -> '${got:-}'"; fi
}

open5_9='[{"number":9,"title":"Later thing","state":"OPEN","blockedBy":{"nodes":[]}},
          {"number":5,"title":"Earlier thing","state":"OPEN","blockedBy":{"nodes":[]}}]'
no_prs='[]'

check "picks the lowest eligible" 5 "$open5_9" "$no_prs"

check "skips Spec: issues" 9 \
  '[{"number":3,"title":"Spec: the Kit","state":"OPEN","blockedBy":{"nodes":[]}},
    {"number":9,"title":"Later thing","state":"OPEN","blockedBy":{"nodes":[]}}]' "$no_prs"

check "skips issues with an open blocker, not a closed one" 9 \
  '[{"number":4,"title":"Blocked","state":"OPEN","blockedBy":{"nodes":[{"state":"OPEN"}]}},
    {"number":9,"title":"Unblocked","state":"OPEN","blockedBy":{"nodes":[{"state":"CLOSED"}]}}]' "$no_prs"

check "skips an issue whose branch already has an open PR" 9 "$open5_9" \
  '[{"number":30,"title":"Earlier thing","body":"","headRefName":"5-earlier-thing"}]'

check "skips an issue an open PR closes in its body" 9 "$open5_9" \
  '[{"number":31,"title":"Earlier thing","body":"Closes #5\n\n## What","headRefName":"some-branch"}]'

check "does not confuse issue 5 with issue 50" 5 "$open5_9" \
  '[{"number":32,"title":"Other thing","body":"Fixes #50","headRefName":"50-other-thing"}]'

check "prints nothing when nothing is eligible" "" '[]' "$no_prs"

check "a forced issue ignores the label and its blockers" 12 \
  '[{"number":12,"title":"Spec: forced anyway","state":"OPEN","blockedBy":{"nodes":[{"state":"OPEN"}]}}]' "$no_prs" 12

check "a forced issue with an open PR prints nothing" "" "$open5_9" \
  '[{"number":30,"title":"Earlier thing","body":"","headRefName":"5-earlier-thing"}]' 5

check "a forced closed issue prints nothing" "" \
  '[{"number":5,"title":"Done","state":"CLOSED","blockedBy":{"nodes":[]}}]' "$no_prs" 5

check "a forced unknown issue prints nothing" "" '[]' "$no_prs" 404

exit $fail
