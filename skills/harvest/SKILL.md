---
name: harvest
description: Use when working in a Project and something turns out to belong in the Kit instead - "harvest this", "/harvest", "file that as a Lesson", "the Kit should do this" - or at a phase boundary after implementing, after reviewing a Loop PR, or after debugging.
---

# Harvest

File a Lesson (a candidate improvement to the Kit found while working on a Project) as a `needs-triage` issue on the Kit. Triage stays human; the Kit Loop turns triaged Lessons into PRs when the owner runs it (ADR 0005, ADR 0009).

The Kit repo is always `Drago96/fullstack-kit` - pass `--repo` so this works from any directory.

## Steps

1. `gh auth switch -u Drago96` (the active account reverts between shells).
2. Get the Source link from the current repo:

   ```bash
   gh pr view --json url --jq .url 2>/dev/null \
     || { git branch --remotes --contains HEAD | grep -q . \
          && echo "$(gh repo view --json url --jq .url)/commit/$(git rev-parse HEAD)"; }
   ```

   Prefer the PR; otherwise the commit, but only once it is pushed. If neither prints anything, push first - a link nobody can open is not a Source.
3. Write the body to a file with these four sections, in this order, nothing else:

   ```markdown
   ## What happened

   What you were doing and what went wrong or was missing. One short paragraph.

   ## Kit part

   Exactly one of: Stack Rules / Reference Project / a Loop / a Workflow. Name the specific one.

   ## Proposed change

   The concrete change to make to the Kit. Numbered steps if more than one.

   ## Source

   <the link from step 2>, plus the Project name and the date.
   ```

4. File it. The title starts with `Lesson: ` and names the improvement, not the symptom.

   ```bash
   gh issue create --repo Drago96/fullstack-kit --label needs-triage \
     --title "Lesson: <the improvement>" --body-file <path>
   ```

5. Report the issue URL back. Do not triage it, do not add other labels, do not implement it here.

## Phase-boundary prompt

At every phase boundary — after implementing, after reviewing a Loop PR, after debugging — ask:

> Anything here belongs in the Kit?

If the answer is a specific change to Stack Rules, the Reference Project, a Loop or a Workflow, run this skill. If it is only about this Project's own code, it is not a Lesson - say so in one line and move on.

## Rules

- One Lesson per issue. Two unrelated changes are two issues.
- No Lesson without a Source link.
- Never file against the Project's own repo, and never open a PR on the Kit from a Project session.
- A Lesson that conflicts with an existing ADR says so under Proposed change; the conflict is what the human triages.
