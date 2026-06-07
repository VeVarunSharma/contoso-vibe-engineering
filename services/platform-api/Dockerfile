# Build from the repository root: docker build -t platform-api:test -f services/platform-api/Dockerfile .
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY services/platform-api/package.json ./services/platform-api/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json

RUN pnpm install --frozen-lockfile --filter platform-api...

COPY packages/typescript-config ./packages/typescript-config
COPY services/platform-api/tsconfig.json ./services/platform-api/tsconfig.json
COPY services/platform-api/src ./services/platform-api/src

RUN pnpm --filter platform-api build
RUN pnpm --filter platform-api --prod deploy /prod/platform-api --legacy

FROM node:20-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder --chown=node:node /prod/platform-api/node_modules ./node_modules
COPY --from=builder --chown=node:node /prod/platform-api/package.json ./package.json
COPY --from=builder --chown=node:node /app/services/platform-api/dist ./dist

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3001; fetch('http://127.0.0.1:' + port + '/health').then((res) => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
