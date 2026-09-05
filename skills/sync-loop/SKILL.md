---
name: sync-loop
description: Merge the Kit's latest Reference Project into this Project and open a pull request - "/sync-loop", "sync with the Kit", "take the Reference Project changes", "run the Sync Loop". Run on demand from a clean checkout of a Project's main; a session may also launch it as a subagent.
---

# Sync Loop

You are bringing this Project up to date with the Kit's Reference Project, from a clean checkout of `main`, with `gh` authenticated as the owner (`gh auth switch -u Drago96` first — the active account reverts between shells). A dirty working tree stops the run: say so and stop, the merge needs a clean base.

The Kit is the directory this skill lives in: `scripts/sync-loop/` is two levels up from this file.

Do not chat. Produce one pull request and print its URL as your last line, or print `already current` and stop.

## 1. Is there anything to take?

```
git fetch kit reference
git rev-list --count HEAD..kit/reference
```

`0` means this Project already carries every Reference Project commit: print `already current` and stop. No branch, no PR, nothing.

A `sync/<sha>` branch that already exists for this same sha is the last run's PR, still waiting on a human: say which PR and stop. Two syncs of the same Reference Project commit is one sync too many.

No `kit` remote means this Project was not scaffolded from the `reference` branch (ADR 0006). Say so and stop; adding one by hand would merge unrelated histories.

## 2. Branch

`$BASE` is `git rev-parse HEAD` — record it now, before the merge moves `HEAD`, because sections 3 and 6 measure the incoming commits against it.

`$BRANCH` is `sync/<the short sha of kit/reference>`: `git checkout -b "sync/$(git rev-parse --short kit/reference)"`. Everything below happens there; never commit on `main`.

## 3. Merge

```
git merge kit/reference
```

A real merge, never `--squash` and never a rebase: the shared history is what makes the next sync a three-way merge instead of a patch (ADR 0006). Read `git log $BASE..kit/reference --oneline` before resolving anything — the incoming commits are the intent.

Clean merge: go to section 5.

## 4. Conflicts

Conflicts land exactly on the files this Project deliberately changed. Resolve them with the `resolving-merge-conflicts` skill (call it with the Skill tool), which resolves by intent and never aborts: preserve both intents where they fit, and where they do not, keep the Project's — it changed that file on purpose.

Record every hunk as you go, one line each: `<path>` — what the Kit wanted, what the Project wanted, what you kept. That list is section 6's `## Resolved conflicts`, and it is the whole reason a human reads this PR.

A hunk whose intent you cannot read from the two commit histories is a handoff, and the one case that overrides that skill's "never abort": `git merge --abort`, delete the branch, and say which file and which two commits you could not reconcile. Do not guess at behaviour, and do not invent a third version neither side asked for.

Then finish the merge: `git add <the conflicted paths>` only, never `git add -A` and never `.`, and `git commit` with the default merge message.

## 5. The Project's checks

Green before you push, the way its CI runs them:

```
pnpm install --frozen-lockfile
pnpm biome ci . && pnpm knip && pnpm turbo run typecheck build test api-test
```

Fix what the merge broke — a rename the Project's own code still calls by the old name is this section's work, not a follow-up. If you cannot fix it by intent, stop there: push the branch and open the PR anyway with the failing command and its output under `## Checks`, and say it is red in your last line. A `ready-for-human` PR nobody merges is a safe place to leave a resolution; throwing the resolution away is not.

## 6. Pull request

```
bash <kit>/scripts/sync-loop/upgrade-lines.sh $BASE kit/reference
```

prints the manual steps the incoming commits carry, deduplicated and oldest first. Then `git push -u origin $BRANCH`, write the body to a file, and:

```
gh pr create --base main --label ready-for-human \
  --title "Sync the Reference Project ($(git rev-parse --short kit/reference))" --body-file <that file>
```

```
## What

<n> Reference Project commits, `<$BASE short sha>..<kit/reference short sha>`:

<git log $BASE..kit/reference --oneline>

## Resolved conflicts

<one line per hunk from section 4 — path, both intents, what was kept; "None, the merge was clean" when there were none>

## Upgrade steps

<the upgrade-lines.sh output, one per line; "None" when it printed nothing>

## Checks

<the commands from section 5 and their results>
```

There is no GitHub issue to close, so no `Closes #`. Leave the PR there: `ready-for-human` means a human reads the resolutions and does the Upgrade steps before it merges.

## Never

- Merge or approve, however green it is. The Upgrade steps are a human's, and so is the call on every resolution.
- Squash or rebase the merge, or force-push anything. Both throw away the shared history the next sync needs (ADR 0006).
- Commit on `main`, or push to any branch but this run's `sync/<sha>`.
- More than one sync per run. One merge, one PR, then stop — the next run takes what lands after it.
- Change anything the merge did not touch. Cleanups, upgrades and "while I'm here" fixes belong in their own PR.
- Push to the Kit or edit `reference/` in it. This Loop only reads `kit/reference`; a change that belongs upstream is a `harvest`.
