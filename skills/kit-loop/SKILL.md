---
name: kit-loop
description: Headless implement procedure for one triaged Kit issue - read its brief, implement it test-first on its own branch, open a pull request. Used by the kit-loop GitHub workflow in the Kit; not for interactive use.
---

# Kit Loop

You are implementing issue **#$ISSUE_NUMBER** in `$GITHUB_REPOSITORY`, on branch `$BRANCH`, from a fresh checkout of `master`.

Do not chat. Produce one pull request and print its URL as your last line.

## 1. The brief

`gh issue view $ISSUE_NUMBER --comments`. The spec is the latest comment starting with `## Agent Brief`, or the issue body when there is none. Its acceptance criteria are the definition of done, and the whole of it: anything else is scope creep and the Review Loop will block on it.

## 2. The rules

Read `CLAUDE.md`, `CONTEXT.md`, `STACK-RULES.md` and every ADR in `docs/adr/` that the brief names or that governs what you are about to touch. This PR gets reviewed against the numbered hard rules, so follow them the first time.

## 3. Branch

`git checkout -b $BRANCH`. Everything below happens there; never commit on `master`.

## 4. Implement

The smallest change that satisfies the acceptance criteria. No abstraction with one implementation, no config for a value that never changes, no scaffolding for later.

Test first, at the seams only (Stack Rule 7): API Tests (`*.api-spec.ts` against a running Nest) and E2E Tests (Playwright), never unit tests of controllers, services or components through mocks. Write the failing test, then the code.

Inside `reference/`, run the tools the way CI does: `pnpm -C reference install --frozen-lockfile` once, then `pnpm -C reference turbo run typecheck` and the single test you are driving as you go, and `pnpm -C reference biome ci . && pnpm -C reference turbo run typecheck build test api-test` at the end. If you changed the Contract, `pnpm -C reference turbo run generate` and commit the regenerated client. Outside `reference/` there is no suite: run whatever check the changed thing ships (e.g. `bash scripts/<area>/*.test.sh`).

Out of bounds: `.github/workflows/`, `STACK-RULES.md`, and every file under `skills/`. Those are the Loops' own instructions and need a human-triaged Lesson (`harvest`). If the brief cannot be implemented without one of them, open no PR: `gh issue comment $ISSUE_NUMBER` naming the out-of-bounds file and stop there.

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

## Deviations from the brief
<only when there are any, with the reason; omit this section otherwise>
```

## Never

- Merge, approve, or arm auto-merge. The Review Loop reviews this PR and merges it when CI and the review are green (ADR 0008).
- Add or remove labels. `ready-for-human` is the Review Loop's to apply when it gives up.
- Push to `master`, or to any branch other than `$BRANCH`.
- Touch another issue's branch, PR or issue.
