# fullstack-kit

A Claude Code plugin holding the Skills, Workflows and Loops for building and running personal full-stack projects on one fixed, free stack. See `CONTEXT.md` for vocabulary and `docs/adr/` for decisions.

## Install

```
/plugin marketplace add Drago96/fullstack-kit
/plugin install fullstack-kit
```

## Skills

- `harvest` — from any Project session, "harvest this" files a Lesson as a `needs-triage` issue on this repo (What happened / Kit part / Proposed change / Source). The Kit's implement, review and debugging skills, once they exist, will fire its phase-boundary prompt ("anything here belongs in the Kit?").

## Composed plugins

The Kit does not vendor these. Install them alongside it:

- `superpowers`
- `mattpocock-skills`
- `ponytail`
- `frontend-design`

## Reference Project

`reference/` is the pnpm + Turborepo monorepo every Project starts from. It is kept CI-green by `.github/workflows/ci.yml`.

```
cd reference
pnpm install
pnpm turbo run build
pnpm --filter api start      # http://localhost:3001/hello, OpenAPI at /docs
pnpm --filter web start      # http://localhost:3000
```

Workspaces: `apps/api` (NestJS), `apps/web` (Next.js App Router), `packages/contract` (Zod schemas, the source of truth), `packages/api-client` (typed client generated from the OpenAPI spec Nest derives from the Contract).

Adding an endpoint: schema in `packages/contract` → controller in `apps/api` → `pnpm turbo run generate` → commit the regenerated `packages/api-client`. CI fails on drift.

## Review Loop

Every non-draft PR is reviewed headless by the `review-loop` skill (`.github/workflows/review-loop.yml`) against `STACK-RULES.md` and its linked issue, fixed up to twice, and auto-merged when CI and the review are green (ADR 0008). One-time setup per repo: set the `CLAUDE_CODE_OAUTH_TOKEN` secret (`claude setup-token`), `REVIEW_LOOP_GH_TOKEN` (fine-grained PAT with contents and pull-requests write; without it fix commits do not re-trigger CI, so fix rounds need a manual re-run), then run `bash scripts/review-loop/setup-repo.sh <owner/repo> master "<your CI job name>" "Review Loop"` (the Kit itself uses the defaults). Projects call the Kit's workflow as a reusable workflow, so the skill and Stack Rules always come from the Kit's `master`.
