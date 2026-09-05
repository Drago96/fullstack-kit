---
name: review-loop
description: Review a pull request against Stack Rules and its linked issue, fix what it finds, and merge it when the review and CI are green - "/review-loop 42", "review that PR", "run the Review Loop on this PR". Run on demand from a checkout of the repo the PR is on; a session may also launch it as a subagent.
---

# Review Loop

You are reviewing one pull request, from a checkout of the repo it is on, with `gh` authenticated as the owner (`gh auth switch -u Drago96` first — the active account reverts between shells). The PR number comes from whoever invoked you; if it is missing, ask for it and stop.

The Kit is the directory this skill lives in: `STACK-RULES.md` and `scripts/review-loop/` are two levels up from this file. Inside the Kit itself that is the repo you are reviewing; in a Project it is the installed plugin.

Do not chat. Review, act on the verdict, and print the outcome (`pass`, `fix`, `handoff`) as your last line.

## 1. Context

```
gh pr checkout <pr>
gh pr view <pr> --json baseRefName,body,reviewDecision,isDraft
```

A draft PR is not reviewed: say so and stop. Then:

- **Base ref**: `baseRefName`. `git fetch origin <base>` before diffing.
- **Linked issue**: the first `closes|fixes|resolves #<n>` in the PR body or in `git log origin/<base>..HEAD --format=%B`. None means a Standards-only review.
- **Fix rounds already spent**: `git log origin/<base>..HEAD --format=%s | grep -c '^review-loop: fix round'`.
- **Human veto**: `reviewDecision` is `CHANGES_REQUESTED`.

Work in a scratch directory of your own (`mktemp -d`) for `review.md`.

## 2. Diff

`git diff origin/<base>...HEAD` and `git log origin/<base>..HEAD --oneline`. Read the changed files fully, not just hunks. Under 15 tool calls per axis.

## 3. Standards axis

Standards source: the Kit's `STACK-RULES.md`. A breach of a numbered hard rule is a **blocking** Finding; cite the rule number. Skip anything tooling already enforces (Biome, tsc, CI drift check).

Also apply the smell baseline (Fowler, *Refactoring* ch. 3), always **non-blocking**, labelled "possible <smell>": Mysterious Name, Duplicated Code, Feature Envy, Data Clumps, Primitive Obsession, Repeated Switches, Shotgun Surgery, Divergent Change, Speculative Generality, Message Chains, Middle Man, Refused Bequest. A documented Stack Rule overrides the baseline.

## 4. Spec axis (only when an issue is linked)

Read the issue with `gh issue view <issue> --comments`. The Agent Brief comment, if present, is the spec. Report, each **blocking**: (a) requirements missing or partial; (b) behaviour not asked for (scope creep); (c) requirements implemented wrongly. Quote the spec line for each.

## 5. Over-engineering axis (never blocking)

Flag: abstractions with one implementation, config for values that never change, new dependencies where stdlib or an installed one suffices, scaffolding "for later", tests that mock internals. One line each.

## 6. Human review

When `reviewDecision` is `CHANGES_REQUESTED`, fetch the latest review per reviewer with `gh api repos/<owner/repo>/pulls/<pr>/reviews` and treat every `CHANGES_REQUESTED` review body and its comments as blocking Findings. A human veto can never be overridden: while one is outstanding the PR does not merge, however clean the axes are.

## 7. The verdict

Write `review.md` in your scratch directory: headings `## Standards`, `## Spec`, `## Over-engineering`, `## Human review` (omit empty ones), blocking Findings first and marked **[blocking]**, then a one-line summary per axis. Under 400 words total.

Then post it and decide:

```
gh pr review <pr> --event COMMENT --body-file <review.md>   # --event APPROVE when the decision is pass
bash <kit>/scripts/review-loop/decide.sh <blocking count> <fix rounds> <changes requested:true|false>
```

## 8. Act on it

**`pass`** — wait for CI and merge:

```
gh pr checks <pr> --watch
gh pr merge <pr> --squash --delete-branch
```

A red `Reference Project` is not a merge: report it and stop, changing nothing (ADR 0008 — CI is the gate, the review is the second reader).

**`fix`** — resolve every blocking Finding with the smallest change that satisfies the rule or the spec, run the repo's typecheck and the tests for what you touched, then:

```
git add <explicit paths>      # never `git add -A` and never `.`
git commit -m "review-loop: fix round <N>"
git push
```

Append a `## Fix round` section to `review.md` listing what you changed, then go back to section 2 and review the branch again — the next verdict judges the fix. At most two Fix Rounds; `decide.sh` counts them for you. A Fix Round that would change nothing cannot converge: hand off instead.

**`handoff`** — `bash <kit>/scripts/review-loop/handoff.sh <pr> <review.md>`. It labels the PR `ready-for-human` and pins the unresolved blocking Findings at the top of the body. Change nothing else.

## Never

- Merge a PR whose `Reference Project` check is not green, or one with an outstanding human "Request changes".
- Push to `master`, or to any branch other than the PR's own.
- Rewrite an earlier round's verdict: each review judges the code in front of it.
