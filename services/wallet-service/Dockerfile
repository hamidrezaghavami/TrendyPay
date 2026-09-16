FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy root lockfile & workspace configs if present
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY services/wallet-service/package.json ./services/wallet-service/

# Install dependencies
WORKDIR /app/services/wallet-service
RUN pnpm install --prod

# Copy shared protos and source code
WORKDIR /app
COPY proto ./proto
COPY services/wallet-service ./services/wallet-service

WORKDIR /app/services/wallet-service

EXPOSE 50051
ENV NODE_ENV=production
ENV PORT=50051

CMD ["node", "src/index.js"]