# Build context is the monorepo root: docker build -f apps/api/Dockerfile .
FROM node:24-alpine AS builder
# pnpm version comes from package.json#packageManager
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=api
RUN pnpm deploy --filter=api --prod --legacy /out

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /out .
USER node
# Cloud Run injects PORT; the API refuses to boot without it.
CMD ["node", "dist/main.js"]
