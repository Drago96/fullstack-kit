---
name: workflows
description: The ordered paths through the Kit's skills - a feature, a bug, a Lesson, a new Project. Use at the start of a piece of work, or whenever the next skill to run is not obvious.
---

# Workflows

Four paths. Each step names the skill that runs it; the skills hold the how. The stack conventions every path ends in are the [`stack-rules`](../stack-rules/SKILL.md) skill.

## Feature

`/grill-with-docs` → **design checkpoint** → `/to-spec` → `/to-tickets` → `/implement`, one ticket at a time, one PR each.

Project feature work is interactive from end to end. No Loop implements a feature — the Kit Loop implements triaged Kit issues, the Error Loop fixes production errors, the Sync Loop merges the Reference Project. A feature needs a human at the checkpoint and at every decision a ticket leaves open (`stack-rules`: "agent-ready" is not "no questions").

The **design checkpoint** sits between the grilling and the spec, so the spec describes something that already exists rather than something imagined:

- Anything a user will see → a `/design` canvas, or a `frontend-design` pass on the real page.
- State or logic that has to be run to be judged → a `/prototype`: the smallest throwaway thing that makes the behaviour visible. It gets thrown away; the tickets rebuild it properly.

The agent proposes which one and why. The human decides — including deciding to skip it.

## Bug

`/diagnosing-bugs` → a failing test at the seam → the fix → PR.

Reproduce before fixing: an API Test for anything the API raises, an E2E Test for anything the browser does. Prove the test earns its place by stashing the fix and watching it fail. The Error Loop runs this same path off Sentry, on the production errors, whenever you start it.

## Lesson

`/harvest` files it as a `needs-triage` issue on the Kit → `/triage` (human) → `/kit-loop` turns a `ready-for-agent` issue into a PR → `/review-loop <pr>` merges it. You start the last two; nothing runs on a schedule (ADR 0009).

Nothing crosses from harvest to triage on its own; human judgement is the point (ADR 0005). Harvest at the phase boundaries — after implementing, after reviewing a Loop PR, after debugging — by asking "anything here belongs in the Kit?".

## New Project

Scaffold → the provisioning wizard → the feature path above.

Scaffold copies the Reference Project into a new repo, seeded from the Kit's `reference` branch so the Sync Loop has a shared base (ADR 0006). Then `bash scripts/provision.sh` from the new Project's root: a `/wizard` that drives `neonctl`, `gcloud`, `vercel` and `gh` through Neon, Cloud Run, Vercel, Sentry, Gemini and Resend, and leaves every value where it belongs: the API's five secrets (`DATABASE_URL`, `AUTH_SECRET`, `SENTRY_DSN`, `RESEND_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`) in Google Secret Manager, read by the `api-runtime` service account the Cloud Run service runs as; everything else in the repo's GitHub secrets and variables. Re-running it is safe.
