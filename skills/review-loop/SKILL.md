---
name: review-loop
description: Headless two-axis review of a pull request against Stack Rules and its linked issue, with an optional fix round. Used by the review-loop GitHub workflow in the Kit and in every Project; not for interactive use.
---

# Review Loop

You are reviewing pull request **#$PR_NUMBER** in `$GITHUB_REPOSITORY`. Base ref: `$BASE_REF`. Linked issue: `$ISSUE_NUMBER` (empty means none). Fix rounds already spent: `$FIX_ROUNDS`. Human "changes requested" review outstanding: `$CHANGES_REQUESTED`. Output directory: `$OUT_DIR`.

Do not chat. Produce files. Under 15 tool calls per axis.

## 1. Diff

`git diff origin/$BASE_REF...HEAD` and `git log origin/$BASE_REF..HEAD --oneline`. Read the changed files fully, not just hunks.

## 2. Standards axis

Standards source: `STACK-RULES.md` from the Kit (at `$KIT_DIR/STACK-RULES.md`). A breach of a numbered hard rule is a **blocking** Finding; cite the rule number. Skip anything tooling already enforces (Biome, tsc, CI drift check).

Also apply the smell baseline (Fowler, *Refactoring* ch. 3), always **non-blocking**, labelled "possible <smell>": Mysterious Name, Duplicated Code, Feature Envy, Data Clumps, Primitive Obsession, Repeated Switches, Shotgun Surgery, Divergent Change, Speculative Generality, Message Chains, Middle Man, Refused Bequest. A documented Stack Rule overrides the baseline.

## 3. Spec axis (only when an issue is linked)

Read the issue with `gh issue view $ISSUE_NUMBER --comments`. The Agent Brief comment, if present, is the spec. Report, each **blocking**: (a) requirements missing or partial; (b) behaviour not asked for (scope creep); (c) requirements implemented wrongly. Quote the spec line for each.

## 4. Over-engineering axis (never blocking)

Flag: abstractions with one implementation, config for values that never change, new dependencies where stdlib or an installed one suffices, scaffolding "for later", tests that mock internals. One line each.

## 5. Human review

If `$CHANGES_REQUESTED` is `true`, fetch the latest review per reviewer with `gh api repos/$GITHUB_REPOSITORY/pulls/$PR_NUMBER/reviews` and treat every `CHANGES_REQUESTED` review body and its comments as blocking Findings.

## 6. Write the verdict

Write `$OUT_DIR/review.md`: headings `## Standards`, `## Spec`, `## Over-engineering`, `## Human review` (omit empty ones), blocking Findings first and marked **[blocking]**, then a one-line summary per axis. Under 400 words total.

Write `$OUT_DIR/verdict.json`: `{"blocking": <count of blocking Findings>, "summary": "<one line>"}`.

## 7. Fix round (only when told)

Run `bash $KIT_DIR/scripts/review-loop/decide.sh <blocking> $FIX_ROUNDS $CHANGES_REQUESTED`. If it prints `fix`: resolve every blocking Finding with the smallest change that satisfies the rule or the spec, run the repo's typecheck and the relevant tests, and stage nothing. Do not commit or push; the workflow commits your working tree as `review-loop: fix round N`. Then append a `## Fix round` section to `review.md` listing what you changed. Never rewrite `verdict.json` after a fix: the verdict describes the code you reviewed, the next run judges the fix. Never touch `.github/workflows/`, `STACK-RULES.md` or any skill file.

If it prints `pass` or `handoff`, change nothing.
