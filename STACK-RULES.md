# Stack Rules

The conventions every Project follows. The Review Loop's Standards axis enforces the **hard rules** below as blocking Findings; everything else in the Kit (ADRs, glossary, the Reference Project itself) is guidance the reviewer may cite as a non-blocking smell.

How to carry these out — add an endpoint, a migration, a form, a translated string, an LLM call, a job, an E2E Test — is the `stack-rules` skill (`skills/stack-rules/SKILL.md`).

## Hard rules

1. **Contract first.** Every request and response shape is a Zod schema in the Contract package. Nest validates with it (`createZodDto`), the OpenAPI document and the typed client derive from it. No hand-written DTOs, no duplicated types in web.
2. **Explicit response status.** Every endpoint declares `@ZodResponse({ status, type })` with an explicit status, so the generated client types the success path.
3. **Env validated at boot.** Every environment variable is read through the package's Zod-validated `env` module. A missing variable fails boot; no `process.env` reads elsewhere, no defaults for secrets.
4. **Typed boundaries.** No `any`, no `as` casts to cross a module or package boundary, no non-null assertions to silence the type checker. Fix the type or the Contract instead.
5. **Files stay under 1000 lines.** A diff must not push a file past 1000 lines. Split first.
6. **No ad-hoc conditionals in unrelated flows.** A change that adds a special case to code paths it does not own is a design problem, not a nit. Put the logic where its data lives.
7. **Tests at the seams only.** Behaviour is tested as API Tests (`*.api-spec.ts` against a running Nest) and E2E Tests (Playwright against the whole stack). Pure Contract schemas may have unit tests. No unit tests of controllers, services or components through mocks.

## Deliberately absent (suggest, do not improvise)

None of these is in the stack. The moment a task needs one, name the option below, say what adopting it costs, and stop. Adopting it is a Lesson to `harvest` (ADR 0007), never a decision to improvise mid-ticket and never a gap to silently skip.

- **Background jobs** — Cloud Scheduler POSTing a Nest endpoint while one schedule is enough; pg-boss on the Project's own Postgres once jobs need a queue, retries or fan-out.
- **File storage** — Google Cloud Storage, next to Cloud Run and S3-compatible through its interoperability API; Nest signs the upload URLs and stores only the object key.
- **Feature flags** — PostHog.
- **Analytics** — PostHog, the same project as the flags.
- **Rate limiting** — `@nestjs/throttler` for route limits, Better Auth's built-in limiter for the auth routes. Anything beyond that (per-tenant quotas, a shared budget across instances) is its own Lesson.
- **Policy authorization** — a small policy module in `apps/api/src/auth/`: one `can(user, action, resource)` function per resource, called from the controller. Not a policy engine. Roles (Better Auth's `admin` plugin) and ownership checks in guards cover everything until they do not.
- **Infrastructure as code** — Terraform, transcribed from `scripts/provision.sh` and the `.provisioned.json` it records, once enough Projects exist to drift.
- **Mobile i18n** — `i18n-js` (or `react-intl`) reading the same `@reference/messages` ICU files the web app uses. The messages package stays the one source of strings.
- **Kubernetes** — no. Cloud Run is the container host; a cluster costs money and has nothing to orchestrate for a solo Project.
