FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* .npmrc ./
COPY apps/backend-api/package.json ./apps/backend-api/
COPY apps/backend-api/prisma ./apps/backend-api/prisma
RUN pnpm install --filter backend-api... --frozen-lockfile

FROM deps AS build
COPY tsconfig.json ./
COPY apps/backend-api ./apps/backend-api
RUN pnpm --filter backend-api prisma:generate
RUN pnpm --filter backend-api build

FROM node:22-alpine AS runtime  
WORKDIR /app
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* .npmrc ./
COPY apps/backend-api/package.json ./apps/backend-api/
COPY apps/backend-api/prisma ./apps/backend-api/prisma
RUN pnpm install --filter backend-api... --prod --frozen-lockfile

COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/apps/backend-api/dist ./apps/backend-api/dist

EXPOSE 3000

CMD ["sh", "-c", "pnpm --filter backend-api db:migrate:deploy && node apps/backend-api/dist/main.js"]