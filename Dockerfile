# ---- Stage 1: Build the Vite PWA Frontend ----
FROM node:24-alpine AS builder

WORKDIR /app/src/client
COPY src/client/package*.json ./

# Specifically use --legacy-peer-deps to bypass Vite peer-dependency version locking
RUN npm ci --legacy-peer-deps

COPY src/client ./
RUN npm run build

# ---- Stage 2: Production Server Environment ----
FROM node:24-alpine

# Set execution mode explicitly
ENV NODE_ENV=production

WORKDIR /app

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Install production dependencies for the Express backend
COPY package*.json ./
RUN apk add --no-cache python3 make g++ \
    && npm ci --omit=dev \
    && apk del python3 make g++

# Copy the backend source files
COPY src/server ./src/server
COPY src/db ./src/db

# Copy compiled frontend assets from builder stage
COPY --from=builder /app/src/client/dist ./src/client/dist

# Ensure destination path for the database has the correct constraints
RUN mkdir -p /app/src/db && chown -R appuser:appgroup /app/src

USER appuser

EXPOSE 7432

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:7432/healthz || exit 1

# Boot the Express API/Static Server
CMD ["node", "src/server/index.js"]
