---
name: stack-rules
description: How to build anything in a Project on the Kit's stack - add an endpoint, a migration, a form, a translated string, an LLM call, a scheduled job, an E2E Test - plus the conventions Loops depend on. Use before writing code in a Project, and when a task needs a capability the stack deliberately leaves out.
---

# Stack Rules

The rules themselves are [`STACK-RULES.md`](../../STACK-RULES.md): seven numbered hard rules the Review Loop blocks on, and the deliberately absent list. This skill is how to carry them out. Paths are relative to a Project's root; the Reference Project (`reference/` in the Kit) is the same tree, and every file named below is a worked example you can read.

## Add an endpoint

1. **Contract first.** A Zod schema per request and response shape in `packages/contract/src/<thing>.ts`, re-exported from `src/index.ts`. Validation messages are stable error codes (`note.title.required`), never prose: the API's 400 body and the form resolver both return them and the web app translates them.
2. **Controller** in `apps/api/src/<thing>/<thing>.controller.ts`. `class XDto extends createZodDto(schema)` for every shape; `@ZodResponse({ status, type })` on the success path; `@ApiResponse({ status: 400, type: ValidationFailureDto })` for a failure the UI has to show. `@UseGuards(SessionGuard)` plus `@CurrentUser()` (`apps/api/src/auth/session.ts`) when the data belongs to someone. Add the class to `apps/api/src/app.module.ts`.
3. **Regenerate**: `pnpm turbo run generate`, then commit `apps/api/openapi.json` and `packages/api-client/src/schema.ts`. CI regenerates and diffs; drift fails the build. Web never hand-writes a type for it.
4. **API Test** in `apps/api/test/<thing>.api-spec.ts`: the success, the validation failure by its error code, and 401 without a session.

`apps/api/src/notes/notes.controller.ts` with `apps/api/test/notes.api-spec.ts` is the whole shape end to end.

## Add a migration

Edit `apps/api/src/db/schema.ts`, then `pnpm --filter api db:generate`. Commit the generated `apps/api/drizzle/*.sql` and its `drizzle/meta` snapshot. Nobody applies it by hand: `applyMigrations()` in `apps/api/src/main.ts` runs pending migrations at boot — locally, in CI, and on the Cloud Run revision. A migration that needs a manual step in existing Projects carries an `Upgrade:` line (below).

## Add a form

A client component under `apps/web/src/app/[locale]/<route>/page.tsx`, as in `notes/page.tsx`:

- `useForm({ resolver: zodResolver(<the same Contract schema Nest validates with>) })` — one schema, both ends.
- `createQueryHooks(createApiClient('/api'))` from `openapi-react-query`, then `api.useQuery` / `api.useMutation` against the generated paths. `/api` is the same-origin rewrite in `apps/web/next.config.ts`, which is how the session cookie travels.
- Invalidate the list query in the mutation's `onSuccess`.
- Render errors through `useErrorCodes()` (`apps/web/src/i18n/error-codes.ts`): `translate(formState.errors.title?.message)` for the client-side failure, `translate(failureCode(mutation.error))` for the server's.
- Every visible string comes from `useTranslations`, and every field gets a `<label htmlFor>` — the E2E Tests locate by label and role.

Mobile forms are the same react-hook-form and the same Contract schema through `zodResolver`; only the field binding differs, since `TextInput` is uncontrolled-unfriendly: wrap each one in react-hook-form's `Controller` (`apps/mobile/src/app/index.tsx`) instead of `register`.

## Add a translated string

Add the key to `packages/messages/src/en.json` **and** every other locale file (`bg.json`). `packages/messages/src/index.ts` types the map against `en`, so a missing translation fails typecheck rather than shipping a blank. Contract error codes live under `errors.<code>`. `apps/web/e2e/i18n.spec.ts` is the test that a page really translates.

Mobile reads those same ICU files: `apps/mobile/src/app/_layout.tsx` wraps the app in `use-intl`'s `IntlProvider`, with the locale from `expo-localization` and the messages from `@reference/messages`. One key added to the locale files reaches both clients; there is no second copy of a string anywhere.

## Add an LLM call

`apps/api/src/ask/ask.controller.ts` is the pattern: the Vercel AI SDK's `generateText` behind a Contract-first endpoint like any other. The model comes from `LLM_PROVIDER` — `google` builds Gemini through `@ai-sdk/google` with `GOOGLE_GENERATIVE_AI_API_KEY` (`apps/api/src/env.ts` refuses to boot without it), `mock` returns a `MockLanguageModelV4`. Tests, CI and the E2E servers set `LLM_PROVIDER=mock`, so an LLM feature is keyless, offline and deterministic to test. Never read a provider key or call a provider SDK outside the model factory.

## Add a Sentry-instrumented job

There is no job runner (see the absent list). A job is a Nest endpoint that Cloud Scheduler POSTs on a schedule, built Contract-first like everything else. It is instrumented already: `apps/api/src/instrument.ts` is `main.ts`'s first import and initialises the SDK when `SENTRY_DSN` is set, and `SentryModule.forRoot()` with `SentryGlobalFilter` in `apps/api/src/app.module.ts` reports every exception that escapes a route. So a job reports failures by throwing. For a failure you handle rather than throw, `Sentry.captureException(error)` and carry on. `apps/api/src/sentry/sentry.controller.ts` is the route whose only purpose is proving that wiring. Whatever Sentry receives is what the Error Loop later turns into a PR, so the message and the request are the fix's only evidence: make them specific.

## Add a Playwright E2E Test

`apps/web/e2e/<thing>.spec.ts`. `signedIn(page, request)` from `e2e/sign-up.ts` hands you a browser with a verified, logged-in user. Locate by role and label, never by CSS or test ids. `apps/web/playwright.config.ts` starts the API and web servers itself with `LLM_PROVIDER=mock` and `EMAIL_TRANSPORT=capture` (verification links come back from `GET /debug/emails`), so the only thing you start is Postgres: `docker compose up -d postgres`. Then `pnpm --filter web exec playwright install --with-deps chromium` once, and `pnpm turbo run e2e`.

## Before you push

What CI runs, from `reference/`: `pnpm biome ci .`, `pnpm knip`, `pnpm turbo run typecheck build test api-test`, `pnpm turbo run generate` with a clean `git diff`, `pnpm turbo run e2e`, and `docker build -f apps/api/Dockerfile .`. Then, because the mobile app is opt-in and a Project generated without it has to stay green, it deletes `apps/mobile`, reinstalls, and re-runs `biome ci .`, `knip` and `turbo run typecheck build test`.

## Test naming

API Tests are `apps/api/test/*.api-spec.ts` (`vitest.api.config.ts` collects that glob and nothing else). E2E Tests are `apps/web/e2e/*.spec.ts`. Pure Contract schemas may have unit tests at `packages/contract/src/*.test.ts`. Those are the three; hard rule 7 rules out the rest.

## The Loop boundary

A Loop is a skill the owner starts on demand, not a scheduled job (ADR 0009). Loops open pull requests. The Review Loop is the only thing that merges, and only when `Reference Project` and its own review are green (ADR 0008). No Loop implements a feature: the Kit Loop implements triaged Kit issues, the Error Loop fixes production errors, the Sync Loop merges the Reference Project. Feature work is interactive, always.

## The `Upgrade:` line

A Reference Project commit that needs a manual step in Projects already running it says so in its commit message body:

```
Upgrade: set EMAIL_TRANSPORT in each Project's GitHub variables before merging.
```

The Sync Loop copies every such line from the incoming commits into the PR it opens (ADR 0006). Nothing enforces it; a forgotten line is a manual step nobody is told about.

## "Agent-ready" is not "no questions"

`/implement` in a Project pauses on any decision the ticket left open — a copy string, an error path, a field's shape, a name the glossary does not have, anything a user will see — and asks. For anything visible, show it first: the `/design` canvas or the page running locally, before the commit, not in the PR. Guessing silently is what turns one open question into a PR built on it.

## When the stack does not have it

`STACK-RULES.md`'s absent list names the intended option for background jobs, file storage, feature flags, analytics, rate limiting, policy authorization, infrastructure as code and Kubernetes. The moment a task needs one, name that option, say what it would cost, and stop. Adopting it is a Lesson to `harvest`, not a decision to make mid-ticket.
