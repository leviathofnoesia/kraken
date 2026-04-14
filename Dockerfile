# Kraken Code Dockerfile
# Multi-stage build for minimal production image

# Stage 1: Build
FROM oven/bun:1.2-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the project
RUN bun run build

# Stage 2: Production
FROM oven/bun:1.2-alpine AS production

LABEL maintainer="Kraken Code Team <https://github.com/leviathofnoesia/kraken-code>"
LABEL description="Kraken Code - Autonomous development environment for OpenCode"
LABEL version="1.1.4"

WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/docs ./docs
COPY --from=builder /app/scripts ./scripts

# Install only production dependencies
RUN bun install --production --frozen-lockfile

# Create non-root user
RUN addgroup -g 1001 -S kraken && \
    adduser -S kraken -u 1001 -G kraken

# Create config directories
RUN mkdir -p /home/kraken/.config/opencode && \
    mkdir -p /home/kraken/.config/kraken-code && \
    chown -R kraken:kraken /home/kraken

# Switch to non-root user
USER kraken

# Set environment
ENV HOME=/home/kraken
ENV NODE_ENV=production
ENV KRAKEN_CODE_VERSION=1.1.4

# Initialize Kraken Code
RUN bun run dist/cli/index.js init --minimal || true

# Expose port (if needed for MCP servers)
EXPOSE 3000

# Default command
ENTRYPOINT ["bun", "run", "dist/cli/index.js"]
CMD ["--help"]

# Alternative: Run OpenCode directly
# ENTRYPOINT ["opencode"]
