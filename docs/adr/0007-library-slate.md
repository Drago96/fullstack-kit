# The library slate for every Project, and what is deliberately absent

Fixed for every Project, chosen as the most agent-documented option in each slot unless noted:

- UI: Tailwind + shadcn/ui (copied components, Radix, lucide). Mobile stays React Native core + Expo Router.
- Forms: react-hook-form with the Zod resolver, validating against the same Contract schemas Nest validates with.
- Client: openapi-typescript + openapi-fetch for the typed client, openapi-react-query for TanStack Query hooks. Server components call the fetch client directly.
- Authorization: Better Auth admin plugin for roles (user/admin); ownership enforced in Nest guards and services. No policy library.
- Email: Resend (free tier) for verification and password reset.
- Logging: pino via nestjs-pino, JSON to stdout, read by Cloud Logging.
- Lint/format: Biome. The one less-documented pick, taken because it replaces ESLint + Prettier and their plugin sets with one config.
- Env: Zod-validated at startup in Nest and Next; a missing variable fails boot.
- i18n: next-intl on web with ICU messages in a shared messages package. Nest returns error codes, the UI translates them. Mobile uses `use-intl` (see below).

Deliberately absent in v1: background jobs (Cloud Scheduler hitting a Nest endpoint when needed), file storage, feature flags, analytics, rate limiting beyond Nest's throttler, policy-based authorization, Terraform, Kubernetes. Stack Rules must name the intended option for each and instruct the agent to *suggest it the moment a task needs it*, rather than improvise or silently skip. Adopting one is a Lesson.

## Superseded in part — mobile i18n, 2026-09-05

The i18n line used to defer the mobile choice ("Mobile i18n is chosen when a Project opts into mobile"). The maintainer settled it on 2026-09-05: mobile uses **`use-intl`**, next-intl's framework-agnostic core, over the same shared `packages/messages`. It is the same `useTranslations` API and the same ICU format, so the message files are shared as-is and a key added for one app is typechecked for both. The mobile login form is **react-hook-form** with the Zod resolver over the Contract's `credentialsSchema`, exactly as the web forms already are — the Forms line above was never mobile-exempt.
