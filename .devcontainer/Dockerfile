FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bookworm

# pnpm версия из packageManager (pnpm@9.15.0)
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Клиенты для локальной разработки (Postgres + Redis)
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y --no-install-recommends postgresql-client redis-tools \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*