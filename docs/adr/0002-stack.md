# One fixed stack for every Project, and it must be free

Every Project uses the same stack so the Kit's skills can encode "production-ready" concretely. Hard constraint: every hosted piece runs on a free tier, which rules out xAI Grok (no free tier since May 2025) and paid hosts.

- TypeScript end to end, pnpm workspaces + Turborepo monorepo
- NestJS API on Google Cloud Run (Docker). Owns auth via Better Auth.
- Next.js (App Router) for server-rendered web on Vercel Hobby. Vercel Hobby forbids commercial use; a Project that goes commercial moves Next to Cloud Run.
- React Native via Expo for mobile, generated only when a Project opts in
- Postgres on Neon, schema and migrations via Drizzle
- LLM access through the Vercel AI SDK, default provider Gemini Flash (real free tier). Provider is one env var.
- Sentry for errors. Vitest unit tests, API Tests against Nest, and Playwright E2E Tests all run inside GitHub Actions against a Postgres service container and block merge. No tests run against deployed environments.
