#!/usr/bin/env bash
# Scaffold, end to end. Run: bash scripts/scaffold/scaffold.test.sh
#
# Origin has no `reference` branch yet, so the test builds one from this checkout the same
# way publish-reference.yml does (`git subtree split --prefix=reference`), pushes it into a
# throwaway bare repo, and points Scaffold at that with --kit. --no-github keeps the run
# tokenless, so this is the same test locally and in Kit CI.
#
# SCAFFOLD_TEST_TASK_GRAPH=1 additionally installs the scaffolded Project from its lockfile
# and runs its task graph. Kit CI sets it; it takes minutes and wants API_URL set.
set -euo pipefail
root=$(cd "$(dirname "$0")/../.." && pwd)

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

fail=0
ok() { echo "ok   $1"; }
no() {
  echo "FAIL $1: $2"
  fail=1
}
check() { # check <name> <expected> <actual>
  if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "expected '$2', got '$3'"; fi
}
present() { if [ -e "$2" ]; then ok "$1"; else no "$1" "$2 is missing"; fi; }
absent() { if [ ! -e "$2" ]; then ok "$1"; else no "$1" "$2 is still there"; fi; }
holds() { # holds <name> <file> <pattern>
  if grep -qF -e "$3" "$2"; then ok "$1"; else no "$1" "$2 does not mention '$3'"; fi
}
lacks() { # lacks <name> <file> <pattern>
  if grep -qF -e "$3" "$2"; then no "$1" "$2 still mentions '$3'"; else ok "$1"; fi
}
rejects() { # rejects <name> <scaffold args...>
  local out
  if out=$(cd "$tmp" && bash "$root/scripts/scaffold/scaffold.sh" "${@:2}" 2>&1); then
    no "$1" "it succeeded, printing '$out'"
  else
    ok "$1"
  fi
}

# The `reference` branch, exactly as publish-reference.yml publishes it.
sha=$(git -C "$root" subtree split --prefix=reference | tail -1)
git init --bare --quiet "$tmp/kit.git"
git -C "$root" push --quiet "$tmp/kit.git" "$sha:refs/heads/reference"

cd "$tmp"
bash "$root/scripts/scaffold/scaffold.sh" acme --kit "$tmp/kit.git" --no-github > "$tmp/handoff.txt"
acme=$tmp/acme

# ── Shared history with the Reference Project (ADR 0006) ──────────────────────
check "git merge kit/reference is a no-op" "Already up to date." \
  "$(git -C "$acme" merge kit/reference)"
check "the Kit is remote kit" "$tmp/kit.git" "$(git -C "$acme" remote get-url kit)"
check "history starts at the Reference Project's" "$sha" "$(git -C "$acme" rev-parse HEAD~1)"
check "everything is committed" "" "$(git -C "$acme" status --porcelain)"
check "on branch main" "main" "$(git -C "$acme" branch --show-current)"

# ── Renamed identifiers ───────────────────────────────────────────────────────
check "no @reference/ import survives" "" \
  "$(grep -rlI --exclude-dir=.git -e '@reference/' "$acme" || true)"
holds "the package scope is renamed" "$acme/packages/contract/package.json" '"name": "@acme/contract"'
holds "the root package is renamed" "$acme/package.json" '"name": "acme"'
holds "the turbo task id is renamed" "$acme/turbo.json" '"@acme/api-client#build"'
holds "the lockfile names the renamed workspaces" "$acme/pnpm-lock.yaml" "'@acme/contract':"
holds "the deep-link scheme is renamed" "$acme/apps/api/.env.example" "MOBILE_URL=acme://"

# ── Mobile is off by default, and comes out whole ─────────────────────────────
absent "the mobile workspace is stripped" "$acme/apps/mobile"
lacks "knip forgets the mobile workspace" "$acme/knip.json" "apps/mobile"
check "knip.json stays valid JSON" "ok" \
  "$(node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log("ok")' "$acme/knip.json")"
lacks "the Expo release-age excludes go with it" "$acme/pnpm-workspace.yaml" "minimumReleaseAgeExclude"
lacks "pnpm-workspace keeps no Expo package" "$acme/pnpm-workspace.yaml" "expo"
holds "pnpm-workspace keeps the rest" "$acme/pnpm-workspace.yaml" "allowBuilds:"
lacks "the lockfile drops the mobile importer" "$acme/pnpm-lock.yaml" "  apps/mobile:"

# ── The Project's own docs and workflows ──────────────────────────────────────
present "docs/agents/issue-tracker.md" "$acme/docs/agents/issue-tracker.md"
present "docs/agents/triage-labels.md" "$acme/docs/agents/triage-labels.md"
holds "CLAUDE.md points at Stack Rules" "$acme/CLAUDE.md" "stack-rules"
holds "CLAUDE.md points at the tracker" "$acme/CLAUDE.md" "docs/agents/issue-tracker.md"
present "the deploy workflows come along" "$acme/.github/workflows/deploy-api.yml"
absent "no Review Loop workflow is copied" "$acme/.github/workflows/review-loop.yml"
absent "no Error Loop workflow is copied" "$acme/.github/workflows/error-loop.yml"

# ── The hand-off ──────────────────────────────────────────────────────────────
holds "the hand-off names the wizard" "$tmp/handoff.txt" "bash scripts/provision.sh"
for resource in Neon "Google Cloud" Vercel Sentry "Google AI Studio" Resend Tokens; do
  holds "the hand-off lists $resource" "$tmp/handoff.txt" "  - $resource"
done

# ── --mobile keeps it, renamed ────────────────────────────────────────────────
bash "$root/scripts/scaffold/scaffold.sh" gizmo --mobile --kit "$tmp/kit.git" --no-github > /dev/null
present "--mobile keeps the workspace" "$tmp/gizmo/apps/mobile"
holds "--mobile keeps knip's workspace" "$tmp/gizmo/knip.json" '"apps/mobile"'
holds "--mobile renames the Expo slug" "$tmp/gizmo/apps/mobile/app.json" '"slug": "gizmo"'
holds "--mobile renames the auth-client scheme" "$tmp/gizmo/apps/mobile/src/auth-client.ts" "scheme: 'gizmo'"
holds "--mobile keeps the release-age excludes" "$tmp/gizmo/pnpm-workspace.yaml" "minimumReleaseAgeExclude"

# ── Bad input ─────────────────────────────────────────────────────────────────
rejects "rejects a name that is not an npm scope" "Acme Corp" --kit "$tmp/kit.git" --no-github
rejects "rejects an unknown visibility" widget --visibility secret --kit "$tmp/kit.git" --no-github
rejects "rejects an existing directory" acme --kit "$tmp/kit.git" --no-github
rejects "rejects no name at all" --no-github

# ── The scaffolded Project's own task graph ───────────────────────────────────
# Same commands ci.yml proves the monorepo green with under, one directory over.
if [ "${SCAFFOLD_TEST_TASK_GRAPH:-}" = 1 ]; then
  cd "$acme"
  pnpm install --frozen-lockfile
  pnpm biome ci .
  pnpm knip
  pnpm turbo run typecheck build test
  cd "$tmp"
  ok "the scaffolded Project's task graph is green"
fi

exit $fail
