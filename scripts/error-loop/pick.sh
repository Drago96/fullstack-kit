#!/usr/bin/env bash
# pick.sh [max]
# Prints the unresolved Sentry issues that have no work on them yet, one compact JSON object
# per line ({id, shortId, title, permalink, count}), most events first, at most <max> (default 3).
# "No work" means neither the short id nor the numeric id appears in an open PR (branch, title
# or body) or an open GitHub issue (title or body).
# Needs SENTRY_ORG, SENTRY_PROJECT and SENTRY_AUTH_TOKEN. GH, CURL, SENTRY_URL and
# SENTRY_ISSUES_FILE (a file replacing the API call) are overridable for tests.
set -euo pipefail
GH=${GH:-gh}
CURL=${CURL:-curl}
max=${1:-3}

if [ -n "${SENTRY_ISSUES_FILE:-}" ]; then
  issues=$(cat "$SENTRY_ISSUES_FILE")
else
  : "${SENTRY_ORG:?}" "${SENTRY_PROJECT:?}" "${SENTRY_AUTH_TOKEN:?}"
  issues=$("$CURL" -sSf -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
    "${SENTRY_URL:-https://sentry.io}/api/0/projects/$SENTRY_ORG/$SENTRY_PROJECT/issues/?query=is%3Aunresolved&statsPeriod=14d&limit=25")
fi

work=$( { "$GH" pr list --state open --limit 100 --json headRefName,title,body \
            --jq '.[] | .headRefName + "\n" + .title + "\n" + (.body // "")'
          "$GH" issue list --state open --limit 200 --json title,body \
            --jq '.[] | .title + "\n" + (.body // "")'; } )

# Whole-word matches only, so REFERENCE-API-3F does not swallow REFERENCE-API-3FX, nor 5001 swallow 50011.
printf '%s' "$issues" | jq -c --arg work "$work" --argjson max "$max" '
  map(select((("\\b(" + .shortId + "|" + .id + ")\\b") as $re | $work | test($re; "i")) | not))
  | sort_by((.count // 0) | tonumber) | reverse | .[:$max]
  | .[] | {id, shortId, title, permalink, count}'
