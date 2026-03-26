# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# ---- Runtime Stage ----
FROM node:20-alpine

WORKDIR /app

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy production dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY src/server/ ./src/server/
COPY src/db/ ./src/db/
COPY package.json ./

# Build the frontend static assets
COPY src/client/ ./src/client/
RUN cd src/client && npm ci && npm run build

# Create data directory for SQLite volume mount
RUN mkdir -p /app/data && chown -R appuser:appgroup /app/data

# Switch to non-root user
USER appuser

# Expose the backend API port
EXPOSE 7432

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:7432/healthz || exit 1

# Start the application
CMD ["node", "src/server/index.js"]
