# Multi-stage build
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force
RUN cd client && npm ci --only=production && npm cache clean --force
RUN cd server && npm ci --only=production && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build client
RUN cd client && npm run build

# Build server
RUN cd server && npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/node_modules ./node_modules

# Copy necessary files
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/package.json ./

USER nextjs

EXPOSE 3001

ENV PORT=3001

CMD ["node", "server/dist/index.js"] 