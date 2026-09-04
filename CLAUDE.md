## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues via the `gh` CLI. Lessons harvested from Projects arrive here labelled `needs-triage`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## GitHub account

This repo and every Project belong to the personal account `Drago96`. Always run `gh auth switch -u Drago96` before any `gh` command; the active account reverts to the work account between shells. Never push to `dproychev-payhawk`.

## Working the tickets

At the start of every session, report the frontier and offer to `/implement` the lowest-numbered ticket in it. The frontier is every open `ready-for-agent` issue with no open blockers and no open PR:

```
gh auth switch -u Drago96 && gh issue list --label ready-for-agent --state open \
  --json number,title,blockedBy \
  --jq '.[] | select(.title | startswith("Spec:") | not)
        | select([.blockedBy.nodes[]? | select(.state=="OPEN")] | length == 0)
        | "#\(.number) \(.title)"'
```

Order of work: #2 first, then #7 (Kit Loop) so the remaining tickets get implemented unattended in CI. After each `/implement`, `/clear` before the next.
