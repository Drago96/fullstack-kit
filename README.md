# fullstack-kit

A Claude Code plugin holding the Skills, Workflows and Loops for building and running personal full-stack projects on one fixed, free stack. See `CONTEXT.md` for vocabulary and `docs/adr/` for decisions.

## Install

```
/plugin marketplace add Drago96/fullstack-kit
/plugin install fullstack-kit
```

## Skills

- `harvest` — from any Project session, "harvest this" files a Lesson as a `needs-triage` issue on this repo (What happened / Kit part / Proposed change / Source). Other skills fire its phase-boundary prompt ("anything here belongs in the Kit?") after implementing, after reviewing a Loop PR, and after debugging.

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
