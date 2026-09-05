#!/usr/bin/env bash
# Sentry issue selection for the Error Loop. Run: bash scripts/error-loop/pick.test.sh
set -euo pipefail
cd "$(dirname "$0")"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# A fake gh answering from $GH_PRS and $GH_ISSUES, applying whatever --jq it is handed, like the real one.
cat > "$tmp/gh" <<'FAKE'
#!/usr/bin/env bash
set -euo pipefail
case "$1 ${2:-}" in
  "pr list") data=$GH_PRS ;;
  "issue list") data=$GH_ISSUES ;;
  *) echo "fake gh: unexpected call: $*" >&2; exit 64 ;;
esac
jqexpr=.
while [ $# -gt 0 ]; do
  case $1 in --jq) jqexpr=${2:-.}; shift 2 ;; *) shift ;; esac
done
printf '%s' "$data" | jq -r "$jqexpr"
FAKE
chmod +x "$tmp/gh"
export GH="$tmp/gh"

sentry='[{"id":"5001","shortId":"REFERENCE-API-3F","title":"TypeError: undefined is not a function","permalink":"https://sentry.io/organizations/acme/issues/5001/","count":"12"},
         {"id":"5002","shortId":"REFERENCE-API-4G","title":"Cannot read note","permalink":"https://sentry.io/organizations/acme/issues/5002/","count":"90"},
         {"id":"5003","shortId":"REFERENCE-WEB-9Z","title":"Hydration failed","permalink":"https://sentry.io/organizations/acme/issues/5003/","count":"4"}]'
none='[]'

fail=0
check() { # <name> <expected short ids> <sentry json> <prs json> <gh issues json> [max]
  printf '%s' "$3" > "$tmp/sentry.json"
  got=$(SENTRY_ISSUES_FILE="$tmp/sentry.json" GH_PRS="$4" GH_ISSUES="$5" \
    bash pick.sh "${6:-3}" | jq -r .shortId | tr '\n' ' ' | sed 's/ *$//')
  if [ "$got" != "$2" ]; then echo "FAIL $1: expected '$2', got '$got'"; fail=1; else echo "ok   $1 -> '${got:-}'"; fi
}

check "orders by event count, most events first" \
  "REFERENCE-API-4G REFERENCE-API-3F REFERENCE-WEB-9Z" "$sentry" "$none" "$none"

check "skips a Sentry issue whose branch already has an open PR" \
  "REFERENCE-API-4G REFERENCE-WEB-9Z" "$sentry" \
  '[{"headRefName":"error-reference-api-3f","title":"Fix the API","body":""}]' "$none"

check "skips one linked from an open PR body" \
  "REFERENCE-API-3F REFERENCE-WEB-9Z" "$sentry" \
  '[{"headRefName":"some-branch","title":"Fix","body":"Sentry: https://sentry.io/organizations/acme/issues/5002/"}]' "$none"

check "skips one an open needs-info issue names" \
  "REFERENCE-API-4G REFERENCE-API-3F" "$sentry" "$none" \
  '[{"title":"Cannot reproduce REFERENCE-WEB-9Z: Hydration failed","body":""}]'

check "does not confuse a short id with a longer one" \
  "REFERENCE-API-4G REFERENCE-API-3F REFERENCE-WEB-9Z" "$sentry" "$none" \
  '[{"title":"REFERENCE-API-3FX is something else","body":"and issue 50011 too"}]'

check "honours the max" "REFERENCE-API-4G" "$sentry" "$none" "$none" 1

check "prints nothing when every Sentry issue has work" "" "$sentry" \
  '[{"headRefName":"error-reference-api-3f","title":"x","body":""},
    {"headRefName":"b","title":"x","body":"REFERENCE-API-4G"}]' \
  '[{"title":"REFERENCE-WEB-9Z","body":""}]'

check "prints nothing when Sentry is quiet" "" "$none" "$none" "$none"

exit $fail
