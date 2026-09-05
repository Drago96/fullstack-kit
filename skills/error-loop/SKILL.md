---
name: error-loop
description: Turn unresolved Sentry issues into pull requests - reproduce with a failing test at the seam, fix, open one PR per Sentry issue, or file a needs-info issue when it cannot be reproduced - "/error-loop", "run the Error Loop", "fix the production errors". Run on demand from a clean checkout of a Project's master; a session may also launch it as a subagent.
---

# Error Loop

You are fixing production errors in this Project, from a clean checkout of `master`, with `gh` authenticated as the owner (`gh auth switch -u Drago96` first — the active account reverts between shells) and `SENTRY_ORG`, `SENTRY_PROJECT` and `SENTRY_AUTH_TOKEN` in the shell. Any of the three missing: say which and stop, the run needs them. `$MAX_ISSUES` is the number of Sentry issues to handle this run — 3 unless whoever invoked you said otherwise.

The Kit is the directory this skill lives in: `scripts/error-loop/` is two levels up from this file.

Do not chat. Produce pull requests and `needs-info` issues, and print one line per Sentry issue handled as your last output.

## 1. Pick the errors

`bash <kit>/scripts/error-loop/pick.sh $MAX_ISSUES` prints the unresolved Sentry issues that have no open PR or issue on them yet, one JSON object per line (`id`, `shortId`, `title`, `permalink`, `count`), most events first. No output means nothing to do: stop.

Then do sections 2-6 for each line, in order, one at a time. A Sentry issue you cannot finish is its own section 6; it never stops the next one.

## 2. The evidence

```
curl -sSf -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" https://sentry.io/api/0/issues/<id>/events/latest/
```

Read the stack trace's in-app frames, the request (method, path, body), the tags and the breadcrumbs. Map the top in-app frame to a file in this repo and read it fully, plus its callers. The Sentry issue's title is a symptom; the frame and the request are the fact.

## 3. Reproduce first

Write the regression test before touching the code, at the seams only (Stack Rule 7):

- an **API Test** (`apps/api/test/*.api-spec.ts`) for anything raised in the API — the same route, method and payload the event carries. This is the default; `apps/api/src/sentry/sentry.controller.ts` is the shape of what reports to Sentry.
- an **E2E Test** (Playwright) only when the event comes from the browser. Install the browser first: `pnpm --filter web exec playwright install --with-deps chromium`.

Never a unit test through mocks, and never a test that only asserts the fix you have in mind: it must fail with the error Sentry reported.

Run it (`pnpm turbo run api-test` or `e2e`, filtered to the one file). If it does not fail, adjust the input once with what the event tells you. If it still does not fail after that second attempt, `git checkout -f master && git clean -fd` and go to section 6 — do not fix what you could not reproduce.

## 4. Fix

Run the `implement` skill for the procedure; the failing test from section 3 is the pre-agreed seam, and section 5 below overrides its commit and pull request steps. The fix is the smallest change that makes that test pass, where the data lives (Stack Rule 6), never a guard bolted onto the caller.

Then prove the test earns its place:

```
git stash push -- <the files you changed for the fix>   # the test stays
```

Re-run the test: it must fail. `git stash pop`, re-run: it must pass. If it passes without the fix, the test is wrong; rewrite it.

Then run what CI runs for what you touched: `pnpm biome ci .`, `pnpm turbo run typecheck build test api-test`, and `pnpm turbo run generate` plus the regenerated client committed if you changed the Contract.

## 5. One pull request

Branch `error-<short-id lowercased>` off `master` (e.g. `error-reference-api-3f`). `git add <explicit paths>` only, never `git add -A` and never `.`; `git show --stat HEAD` to confirm. Push, write the body to a file, and:

```
gh pr create --base master --label ready-for-human \
  --title "Fix <the error, in a few words> (<SHORT-ID>)" --body-file <that file>
```

```
## What

<the error and its cause, in a few lines>

Sentry: <permalink> — <shortId>, <count> events

## Fix

<the change, and why it belongs there>

## Verification

- `<test file>` fails on `master` with `<the error>`, passes with the fix (checked with `git stash`)
- <the other commands you ran>
```

There is no GitHub issue to close, so no `Closes #`. Then `git checkout -f master && git clean -fd` before the next Sentry issue.

## 6. Cannot reproduce

File one issue instead, and nothing else:

```
gh issue create --label needs-info \
  --title "Cannot reproduce <SHORT-ID>: <the Sentry title>" --body-file <a file>
```

```
Sentry: <permalink> — <shortId>, <count> events

## The error

<top in-app frames, the request, the tags that matter>

## What I tried

<the test I wrote, the input I used, what happened instead>

## What would unblock this

<the one thing missing: a payload, a user id, a repro path, an env difference>
```

## Never

- Merge or approve. `/review-loop <pr>` reviews this PR (ADR 0008); `ready-for-human` says a human should look before it deploys.
- Push to `master`, or to a branch other than the one for the Sentry issue in hand.
- Resolve, assign, ignore or comment on anything in Sentry. The Loop only reads it.
- Handle more than `$MAX_ISSUES` Sentry issues, or open more than one PR for one of them.
- Touch `.github/workflows/`, `STACK-RULES.md` or any file under `skills/`. Those need a human-triaged Lesson (`harvest`); say so in the PR or issue body and change nothing.
