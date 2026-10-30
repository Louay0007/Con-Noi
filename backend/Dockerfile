# ---- deps: install once, reuse for build ----
FROM node:24-alpine AS deps
WORKDIR /app
# bcrypt is a native module: build tools are needed for the install step only.
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci

# ---- build: compile TypeScript ----
FROM deps AS build
COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ---- production: minimal runtime ----
FROM node:24-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Run as a non-root user.
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/package.json ./package.json

# Uploads live here; mount a volume over it in production.
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app/uploads

USER nestjs
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
