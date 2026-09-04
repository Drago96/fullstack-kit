# Stack Rules

The conventions every Project follows. The Review Loop's Standards axis enforces the **hard rules** below as blocking Findings; everything else in the Kit (ADRs, glossary, the Reference Project itself) is guidance the reviewer may cite as a non-blocking smell.

## Hard rules

1. **Contract first.** Every request and response shape is a Zod schema in the Contract package. Nest validates with it (`createZodDto`), the OpenAPI document and the typed client derive from it. No hand-written DTOs, no duplicated types in web.
2. **Explicit response status.** Every endpoint declares `@ZodResponse({ status, type })` with an explicit status, so the generated client types the success path.
3. **Env validated at boot.** Every environment variable is read through the package's Zod-validated `env` module. A missing variable fails boot; no `process.env` reads elsewhere, no defaults for secrets.
4. **Typed boundaries.** No `any`, no `as` casts to cross a module or package boundary, no non-null assertions to silence the type checker. Fix the type or the Contract instead.
5. **Files stay under 1000 lines.** A diff must not push a file past 1000 lines. Split first.
6. **No ad-hoc conditionals in unrelated flows.** A change that adds a special case to code paths it does not own is a design problem, not a nit. Put the logic where its data lives.
7. **Tests at the seams only.** Behaviour is tested as API Tests (`*.api-spec.ts` against a running Nest) and E2E Tests (Playwright against the whole stack). Pure Contract schemas may have unit tests. No unit tests of controllers, services or components through mocks.

## Deliberately absent (suggest, do not improvise)

Background jobs (Cloud Scheduler hitting a Nest endpoint), file storage, feature flags, analytics, rate limiting beyond Nest's throttler, policy-based authorization, Terraform, Kubernetes. When a task needs one, say so and stop; adopting one is a Lesson (ADR 0007).
