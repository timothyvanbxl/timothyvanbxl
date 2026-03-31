# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built app and production deps manifest
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# better-sqlite3 needs python/make for native compilation on alpine
# It is pre-compiled in the builder stage and carried over via node_modules
# Ensure native binaries are compatible
RUN apk add --no-cache python3 make g++ && \
    npm rebuild better-sqlite3 && \
    apk del python3 make g++

# Data directory (will be mounted as Azure File Share in production)
RUN mkdir -p /data

ENV NODE_ENV=production
ENV DB_PATH=/data/data.db
ENV PORT=3000

EXPOSE 3000

CMD ["node", "build/index.js"]
