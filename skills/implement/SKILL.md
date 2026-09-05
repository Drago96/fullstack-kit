---
name: implement
description: Implement a piece of work from a spec, ticket or brief - test-first, reviewed, landed as a pull request. Use whenever the work is to build, change or fix something in a Project or the Kit, including from a subagent or a Loop.
---

# Implement

Implement the work the spec or tickets describe, and nothing more: its acceptance criteria are the whole scope.

Use the `tdd` skill where possible, at pre-agreed seams (Stack Rule 7).

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use the `code-review` skill with the base branch as the fixed point, and fix what it finds.

Commit to the current branch, never `master`. Then push and open a pull request whose body is `Closes #<issue>` followed by `## What`, `## Verification`, `## Deviations` and `## Follow-ups`.
