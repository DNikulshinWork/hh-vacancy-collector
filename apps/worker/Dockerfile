FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @repo/db generate
RUN pnpm turbo run build --filter=@repo/worker...

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Chromium для Playwright (системный, PLAYWRIGHT_BROWSERS_PATH=0)
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV PLAYWRIGHT_BROWSERS_PATH=0
COPY --from=build /app ./
EXPOSE 3002
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3002/health || exit 1
CMD ["node", "apps/worker/dist/app/main.js"]