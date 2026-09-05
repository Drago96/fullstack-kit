# fullstack-kit

A Claude Code plugin holding the Skills, Workflows and Loops for building and running personal full-stack projects on one fixed, free stack. See `CONTEXT.md` for vocabulary and `docs/adr/` for decisions.

## Install

```
/plugin marketplace add Drago96/fullstack-kit
/plugin install fullstack-kit
```

## Skills

- `stack-rules` — how to build anything on this stack (endpoint, migration, form, translated string, LLM call, job, E2E Test), the conventions the Loops depend on, and what to propose when a task needs a capability the stack leaves out. The rules themselves are `STACK-RULES.md`; every Project's `CLAUDE.md` is a one-line pointer at this skill.
- `workflows` — the ordered paths through the skills: feature, bug, Lesson, new Project.
- `kit-loop` — the headless implement procedure the Kit Loop runs: read a triaged issue's brief, implement it test-first on its own branch, open a PR. Not for interactive use.
- `error-loop` — the headless procedure the Error Loop runs: reproduce an unresolved Sentry issue with a failing test at the seam, fix it, open one PR per Sentry issue. Not for interactive use.
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
pnpm --filter mobile start   # Expo dev server
```

Workspaces: `apps/api` (NestJS), `apps/web` (Next.js App Router), `apps/mobile` (Expo Router, opt-in), `packages/contract` (Zod schemas, the source of truth), `packages/api-client` (typed client generated from the OpenAPI spec Nest derives from the Contract), `packages/messages` (ICU messages, one file per locale).

Adding an endpoint, a migration, a form, a translated string, an LLM call, a job or an E2E Test: the `stack-rules` skill (`skills/stack-rules/SKILL.md`) is the one copy of every how-to.

Auth and email: Better Auth runs inside Nest, mounted at `/auth` and reached from the browser same-origin through the `/api` rewrite, with its tables in the same Drizzle migrations and the `admin` plugin giving every user a role. `SessionGuard` and `AdminGuard` in `apps/api/src/auth/session.ts` guard the routes that need one; Notes belong to the user who created them. Boot needs `AUTH_SECRET`, `API_URL` and `WEB_URL`. `EMAIL_TRANSPORT=capture` keeps verification and reset messages in memory and serves them from `GET /debug/emails`, which is what local runs, the API Tests and the E2E Tests use; `EMAIL_TRANSPORT=resend` sends them for real and fails boot without `RESEND_API_KEY`. Adding a Better Auth plugin means adding its columns to `apps/api/src/db/schema.ts` and running `pnpm --filter api db:generate`.

## Deploy

Run `bash scripts/provision.sh` once from a Project's root. It is a `/wizard`: eleven stages, each driving a vendor CLI where one exists (`neonctl`, `gcloud`, `vercel`, `gh`) and opening the dashboard only where none does (Vercel's Root Directory setting, Sentry, Gemini, Resend, the tokens). It creates the Neon project, the GCP project with Artifact Registry and a Cloud Run service, the deploy service account and the Workload Identity pool and provider bound to that one repository, and the Vercel project, then writes every value into the repo's GitHub secrets and variables. Re-running reuses what exists. Nothing secret touches disk or the terminal: captured values go straight to `gh secret set`. Created resources are recorded in `.provisioned.json`, which is gitignored — it holds only identifiers and URLs, but they are a Project's private infrastructure and nothing in the repo reads them back.

Pushing to `main` then deploys: `deploy-api.yml` builds `apps/api/Dockerfile`, pushes to Artifact Registry and rolls a Cloud Run revision, authenticated by exchanging GitHub's OIDC token through Workload Identity Federation — no service-account key exists. The API applies pending Drizzle migrations on boot, so there is no migrate step. `deploy-web.yml` runs the Vercel CLI (`pull`, `build --prod`, `deploy --prebuilt --prod`) against the project whose Root Directory is `apps/web`.

Where each variable comes from: GitHub **variables** hold the non-secret config the Cloud Run revision needs (`GCP_PROJECT_ID`, `GCP_REGION`, `GCP_ARTIFACT_REPOSITORY`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_DEPLOY_SERVICE_ACCOUNT`, `CLOUD_RUN_SERVICE`, `API_URL`, `WEB_URL`, `EMAIL_TRANSPORT`, `LLM_PROVIDER`). The API's five secrets — `DATABASE_URL`, `AUTH_SECRET`, `SENTRY_DSN`, `RESEND_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY` — are **Secret Manager** secrets, not GitHub ones. GitHub **secrets** hold what the workflows themselves read: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` for the web deploy, and the Loops' `SENTRY_AUTH_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN` and `REVIEW_LOOP_GH_TOKEN`. Web's own two variables, `API_URL` and `NEXT_PUBLIC_SENTRY_DSN`, live in Vercel's production environment, not in GitHub, because `vercel build` reads them from there. `apps/api/.env.example` and `apps/web/.env.example` list every variable each app validates, one line of purpose each.

The API's secrets never reach GitHub. The wizard writes each one straight into Google Secret Manager (`gcloud secrets versions add --data-file=-`, so no value touches disk or the terminal) and grants `roles/secretmanager.secretAccessor` on it to `api-runtime@<project>.iam.gserviceaccount.com`, the dedicated service account the Cloud Run service runs as — the default compute account carries Editor and would read every secret in the project. `deploy-api.yml` passes them through `deploy-cloudrun`'s `secrets:` input as `NAME=NAME:latest`, so the revision stores only the references and `run.services.get` shows no values; the deploy account attaches them but cannot read them. Re-running the wizard adds a new version, which is how these secrets rotate: the next deploy picks it up.

## Kit Loop

Every two hours `.github/workflows/kit-loop.yml` picks the lowest-numbered open `ready-for-agent` issue that has no open blocker and no open PR, and runs the `kit-loop` skill on it: implement on an `<issue>-<slug>` branch, open one PR whose body closes the issue. It never merges and never labels — the Review Loop takes it from there (ADR 0008); triage stays human (ADR 0005). `workflow_dispatch` accepts an optional `issue` number to force one issue (its label and blockers are ignored, an open PR still skips it). Run `bash scripts/kit-loop/pick.sh` to see what the next run would pick. Secrets: the same `CLAUDE_CODE_OAUTH_TOKEN` as the Review Loop, plus `REVIEW_LOOP_GH_TOKEN` — without that PAT the Loop's push and PR do not trigger Kit CI or the Review Loop, and the PR sits untouched.

## Review Loop

Every non-draft PR is reviewed headless by the `review-loop` skill (`.github/workflows/review-loop.yml`) against `STACK-RULES.md` and its linked issue, fixed up to twice, and auto-merged when CI and the review are green (ADR 0008). One-time setup per repo: set the `CLAUDE_CODE_OAUTH_TOKEN` secret (`claude setup-token`), `REVIEW_LOOP_GH_TOKEN` (fine-grained PAT with contents, pull-requests and workflows write; without it fix commits do not re-trigger CI, so fix rounds need a manual re-run, and on the Kit the `reference` branch cannot be published because it carries workflow files), then run `bash scripts/review-loop/setup-repo.sh <owner/repo> master "<your CI job name>" "Review Loop"` (the Kit itself uses the defaults). Projects call the Kit's workflow as a reusable workflow, so the skill and Stack Rules always come from the Kit's `master`.

## Error Loop

Every six hours a Project's `.github/workflows/error-loop.yml` calls the Kit's reusable `error-loop.yml`, which runs the `error-loop` skill over the unresolved Sentry issues of `SENTRY_ORG/SENTRY_PROJECT`. Sentry issues already named by an open PR or open issue are skipped, and at most three are handled per run, most events first. For each: reproduce with a failing API Test (or E2E Test for browser errors), fix, prove the test fails without the fix (`git stash`), and open one PR on `error-<short-id>` labelled `ready-for-human` and linking the Sentry issue. When it cannot reproduce one, it files a `needs-info` issue with the Sentry link and what it tried instead. It never merges and never touches Sentry (ADR 0004). `workflow_dispatch` runs it on demand. Run `bash scripts/error-loop/pick.sh` (with the Sentry variables set) to see what the next run would pick.

Secrets, per Project: `SENTRY_AUTH_TOKEN` (a Sentry auth token with `event:read` and `project:read`), `SENTRY_ORG` and `SENTRY_PROJECT` (the slugs from the Sentry project's URL), plus the same `CLAUDE_CODE_OAUTH_TOKEN` and `REVIEW_LOOP_GH_TOKEN` the other Loops use. The Reference Project's `SENTRY_DSN` is what puts errors into Sentry in the first place; without it the Loop finds nothing.
