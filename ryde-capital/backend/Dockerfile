# Multi-stage production Dockerfile for Ryde Capital Backend (Node.js 22 Alpine)
# Hardened for security: non-root user, minimal attack surface, multi-stage build

# Stage 1: Build & Compile
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package manifests across monorepo workspaces
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY ryde-capital/backend/package*.json ./ryde-capital/backend/
COPY ryde-capital/mobile/package*.json ./ryde-capital/mobile/
COPY ryde-customer/backend/package*.json ./ryde-customer/backend/

# Install all dependencies (including devDependencies for TypeScript compilation)
RUN npm ci

# Copy source code
COPY shared/tsconfig.json ./shared/
COPY shared/src/ ./shared/src/
COPY ryde-capital/backend/tsconfig.json ./ryde-capital/backend/
COPY ryde-capital/backend/src/ ./ryde-capital/backend/src/

# Build shared library first, then backend
RUN npm run build -w shared
RUN npm run build -w @ryde/capital-backend

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install curl for Docker health check
RUN apk add --no-cache curl

# Create non-root system group and user
RUN addgroup -S ryde && adduser -S ryde -G ryde

# Copy package manifests
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY ryde-capital/backend/package*.json ./ryde-capital/backend/
COPY ryde-customer/backend/package*.json ./ryde-customer/backend/

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JavaScript output and artifacts from builder
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/ryde-capital/backend/dist ./ryde-capital/backend/dist

# Switch to unprivileged non-root user
USER ryde

WORKDIR /app/ryde-capital/backend

EXPOSE 4000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/v1/health || exit 1

CMD ["node", "dist/server.js"]
