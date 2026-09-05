---
name: kit-loop
description: Turn one triaged Kit issue into a pull request - pick it, read its brief, implement it test-first on its own branch, open the PR - "/kit-loop", "/kit-loop 42", "run the Kit Loop". Run on demand from a clean checkout of the Kit's master; a session may also launch it as a subagent.
---

# Kit Loop

You are implementing one triaged issue in the Kit, from a clean checkout of `master`, with `gh` authenticated as the owner (`gh auth switch -u Drago96` first — the active account reverts between shells).

Do not chat. Produce one pull request and print its URL as your last line.

## 1. The issue and its brief

Whoever invoked you may name an issue. Pass it (or nothing) to the picker:

```
bash scripts/kit-loop/pick.sh [issue]
```

It prints `$ISSUE_NUMBER`, the issue to implement, or nothing at all — no eligible issue, or the named one is closed or already has an open PR. Nothing printed means nothing to do: say so and stop. A named issue skips the label and blocker checks; an unnamed run takes the lowest-numbered open `ready-for-agent` issue with no open blocker and no open PR.

`$BRANCH` below is `<issue>-<slug>`, the slug being the issue title lowercased, non-alphanumerics collapsed to `-`, cut to 40 characters (e.g. `42-loops-run-on-demand-not-in-github-acti`).

`gh issue view $ISSUE_NUMBER --comments`. The spec is the latest comment starting with `## Agent Brief`, or the issue body when there is none. Its acceptance criteria are the definition of done, and the whole of it: anything else is scope creep and the Review Loop will block on it.

## 2. The rules

Read `CLAUDE.md`, `CONTEXT.md`, `STACK-RULES.md` and every ADR in `docs/adr/` that the brief names or that governs what you are about to touch. This PR gets reviewed against the numbered hard rules, so follow them the first time.

## 3. Branch

`git checkout -b $BRANCH`. Everything below happens there; never commit on `master`.

## 4. Implement

Run the `implement` skill for the procedure, scoped to the acceptance criteria. Sections 5 and 6 below override its commit and pull request steps.

Inside `reference/`, its checks are run the way CI does: `pnpm -C reference install --frozen-lockfile` once, then `pnpm -C reference turbo run typecheck` and the single test you are driving as you go, and `pnpm -C reference biome ci . && pnpm -C reference turbo run typecheck build test api-test` at the end. If you changed the Contract, `pnpm -C reference turbo run generate` and commit the regenerated client. Outside `reference/` there is no suite: run whatever check the changed thing ships (e.g. `bash scripts/<area>/*.test.sh`).

## 5. Commit

`git add <explicit paths>` only, never `git add -A` and never `.`. Then `git show --stat HEAD` and confirm nothing unintended is in the commit. One commit is enough; imperative subject naming the change.

## 6. Pull request

`git push -u origin $BRANCH`, write the body to a file, and `gh pr create --base master --title "<the issue title>" --body-file <that file>`:

```
Closes #$ISSUE_NUMBER

## What
<what changed, per acceptance criterion, in a few lines>

## Verification
<the commands you ran and their results>

## Deviations
<from the brief, only when there are any, with the reason; omit this section otherwise>

## Follow-ups
<what the brief left for later, only when there is any; omit this section otherwise>
```

## Never

- Merge or approve. `/review-loop <pr>` reviews this PR and merges it when `Reference Project` and the review are green (ADR 0008).
- Add or remove labels. `ready-for-human` is the Review Loop's to apply when it gives up.
- Push to `master`, or to any branch other than `$BRANCH`.
- Touch another issue's branch, PR or issue.
