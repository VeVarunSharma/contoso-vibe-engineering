FROM node:20-alpine AS builder

WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY services/medical-api/package.json services/medical-api/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json

RUN pnpm install --frozen-lockfile --filter @contoso/medical-api...

COPY services/medical-api/tsconfig.json services/medical-api/tsconfig.json
COPY services/medical-api/src services/medical-api/src

RUN pnpm --filter @contoso/medical-api build \
  && pnpm deploy --filter @contoso/medical-api --prod --legacy /prod/medical-api

FROM node:20-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder --chown=node:node /prod/medical-api ./

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "const port = process.env.PORT || '3001'; fetch('http://127.0.0.1:' + port + '/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1));"

CMD ["node", "dist/index.js"]
