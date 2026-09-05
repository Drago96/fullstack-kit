#!/usr/bin/env bash
#
# scaffold.sh <name> [--mobile] [--visibility private|public] [--kit <path-or-url>] [--no-github]
#
# Generates a new Project into ./<name> from the Kit's `reference` branch, so the Project
# and the Reference Project share git history and the Sync Loop has a base to merge from
# (ADR 0006). Renames the Reference Project's identifiers, drops the mobile workspace
# unless --mobile, creates the GitHub repo, pushes, and hands off to the provisioning
# wizard.
#
# --kit points at the Kit: the GitHub URL by default, any clonable path or URL otherwise
# (Kit CI passes a `reference` branch built from the checkout, since origin has none yet).
# --no-github stops after the first commit, leaving the repo local. Kit CI uses it so the
# smoke test needs no token.
set -euo pipefail

OWNER=Drago96
KIT_URL=https://github.com/Drago96/fullstack-kit.git
# The Kit checkout this script lives in. docs/agents comes from there, not from reference/.
KIT_ROOT=$(cd "$(dirname "$0")/../.." && pwd)

name=
kit=$KIT_URL
mobile=false
visibility=private
github=true

die() { echo "scaffold: $1" >&2; exit 64; }

while [ $# -gt 0 ]; do
  case $1 in
    --mobile)     mobile=true; shift ;;
    --no-github)  github=false; shift ;;
    --visibility) visibility=${2:-}; shift 2 ;;
    --kit)        kit=${2:-}; shift 2 ;;
    -*)           die "unknown option: $1" ;;
    *)            [ -z "$name" ] || die "unexpected argument: $1"; name=$1; shift ;;
  esac
done

[ -n "$name" ] || die "usage: scaffold.sh <name> [--mobile] [--visibility private|public] [--kit <path-or-url>] [--no-github]"
# The name becomes an npm scope, an Expo slug and a deep-link scheme, which all agree on this.
echo "$name" | grep -Eq '^[a-z][a-z0-9-]*$' \
  || die "name must be lowercase letters, digits and hyphens, starting with a letter: '$name'"
case $visibility in private | public) ;; *) die "visibility must be private or public: '$visibility'" ;; esac
[ ! -e "$name" ] || die "$name already exists"

# ── Seed from the reference branch ────────────────────────────────────────────
git clone --quiet --single-branch --branch reference "$kit" "$name"
cd "$name"
git remote rename origin kit
git branch --move main

# ── Rename the Reference Project's identifiers ────────────────────────────────
# Identifiers, plus a starter display name derived from <name>. The exact wording — the
# app title in packages/messages, EMAIL_FROM — is yours to refine; nothing but a human
# knows what the Project should say out loud.
unbak() { find . -name '*.scaffold-bak' -not -path './.git/*' -delete; }
rewrite() { # rewrite <from> <to>: in every tracked text file that mentions <from>
  { grep -rlI --exclude-dir=.git -e "$1" . || true; } \
    | xargs -r sed -i.scaffold-bak -e "s|$1|$2|g"
  unbak
}
# The package scope: every import, package.json, turbo task id and lockfile importer.
rewrite '@reference/' "@$name/"
# The mobile deep-link scheme, which Nest trusts as an auth origin.
rewrite 'reference://' "$name://"
sed -i.scaffold-bak "s|\"reference\"|\"$name\"|g" package.json
if [ "$mobile" = true ]; then
  sed -i.scaffold-bak "s|\"reference\"|\"$name\"|g" apps/mobile/app.json
  sed -i.scaffold-bak "s|'reference'|'$name'|g" apps/mobile/src/auth-client.ts
fi
unbak

# ── The Project's own display name ────────────────────────────────────────────
# <name> with its first letter upper-cased and -/_ turned to spaces: acme-notes becomes
# "Acme notes". Only the app title and EMAIL_FROM's display name; everything else about
# how the Project introduces itself stays yours to refine.
display=$(echo "$name" | awk '{gsub(/[-_]/, " "); print toupper(substr($0, 1, 1)) substr($0, 2)}')
for f in packages/messages/src/*.json; do
  sed -i.scaffold-bak '/"app": {/,/}/ s/"title": ".*"/"title": "'"$display"'"/' "$f"
done
rewrite 'Reference <onboarding@resend.dev>' "$display <onboarding@resend.dev>"

# ── Mobile is opt-in ──────────────────────────────────────────────────────────
if [ "$mobile" = false ]; then
  rm -rf apps/mobile
  # knip's mobile workspace and the release-age excludes belong to Expo alone. Editing
  # the two files by line keeps Biome's formatting, which a JSON round-trip would lose.
  awk '/^    "apps\/mobile": \{/ { skip = 1 } skip { if (/^    \},?$/) skip = 0; next } { print }' \
    knip.json > knip.json.tmp && mv knip.json.tmp knip.json
  awk '/^minimumReleaseAgeExclude:/ { skip = 1; next } skip && /^[^ \t]/ { skip = 0 } !skip' \
    pnpm-workspace.yaml > pnpm-workspace.yaml.tmp && mv pnpm-workspace.yaml.tmp pnpm-workspace.yaml
  # The lockfile still carries the mobile importer, so --frozen-lockfile would refuse it.
  pnpm install --lockfile-only --no-frozen-lockfile
fi

# The new scope sorts where the old one did not, so every import list that names it is now
# out of order and `biome ci` would fail on the first commit. Biome resorts them itself, at
# the version the Project pins, without waiting for a full install.
biome=$(sed -n 's/.*"@biomejs\/biome": "\(.*\)".*/\1/p' package.json)
pnpm --silent dlx "@biomejs/biome@$biome" check --write . > /dev/null

# ── The Project's own agent docs ──────────────────────────────────────────────
mkdir -p docs/agents
cp "$KIT_ROOT/docs/agents/issue-tracker.md" "$KIT_ROOT/docs/agents/triage-labels.md" docs/agents/
cat > CLAUDE.md <<EOF
Every convention and how-to for this Project lives in the Kit's \`stack-rules\` skill (\`fullstack-kit\` plugin) — read it before writing code; this file never copies it.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues via the \`gh\` CLI. See \`docs/agents/issue-tracker.md\`.

### Triage labels

The default five (\`needs-triage\`, \`needs-info\`, \`ready-for-agent\`, \`ready-for-human\`, \`wontfix\`). See \`docs/agents/triage-labels.md\`.

## GitHub account

This repo belongs to the personal account \`$OWNER\`. Run \`gh auth switch -u $OWNER\` before any \`gh\` command; the active account reverts between shells.

## Every change lands via a pull request

Never commit to \`main\`. Work on a branch named \`<issue>-<slug>\`, push it, and open a PR whose body says \`Closes #<issue>\`.
EOF

git add .
git commit --quiet --message "Scaffold $name from the Reference Project"

# ── GitHub ────────────────────────────────────────────────────────────────────
if [ "$github" = true ]; then
  gh auth switch -u "$OWNER" > /dev/null # the active account reverts between shells
  gh repo create "$OWNER/$name" "--$visibility" --source=. --remote=origin --push
  # The five triage roles every Kit skill speaks in (docs/agents/triage-labels.md).
  gh label create needs-triage --force --color d876e3 --description "Maintainer needs to evaluate this issue"
  gh label create needs-info --force --color d4c5f9 --description "Waiting on reporter for more information"
  gh label create ready-for-agent --force --color 0e8a16 --description "Fully specified, ready for an AFK agent"
  gh label create ready-for-human --force --color fbca04 --description "Requires human implementation"
  gh label create wontfix --force --color ffffff --description "Will not be actioned"
  where="Repo: https://github.com/$OWNER/$name ($visibility)"
else
  where="No GitHub repo, and nothing pushed: --no-github."
fi

# ── Hand-off ──────────────────────────────────────────────────────────────────
cat <<EOF

$name is scaffolded at $PWD, on branch main, with the Kit at remote \`kit\`.
$where

Nothing is provisioned yet. Still to create:
  - Neon: the Postgres project and its DATABASE_URL
  - Google Cloud: the project, Artifact Registry, the Cloud Run service, and the
    Workload Identity deploy identity (so no service-account key ever exists)
  - Vercel: the web project, with Root Directory apps/web
  - Sentry: the project and its DSN, which is the Error Loop's only signal
  - Google AI Studio: the Gemini API key
  - Resend: the API key for verification and password-reset email

The wizard creates every one of them and writes the values into this repo's GitHub
secrets and variables and Google Secret Manager. Re-running it is safe.

  cd $name
  bash scripts/provision.sh
EOF
