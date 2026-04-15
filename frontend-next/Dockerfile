# Build stage
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time public envs for Next.js. Default to same-origin API routing.
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
ARG NEXT_PUBLIC_OAUTH_BASE_URL=

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_TMDB_IMAGE_BASE_URL=$NEXT_PUBLIC_TMDB_IMAGE_BASE_URL
ENV NEXT_PUBLIC_OAUTH_BASE_URL=$NEXT_PUBLIC_OAUTH_BASE_URL
ENV BACKEND_URL=http://backend:8081

RUN npm run build

# Production stage - standalone output
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV BACKEND_URL=http://backend:8081
ENV NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
ENV NEXT_PUBLIC_OAUTH_BASE_URL=

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
