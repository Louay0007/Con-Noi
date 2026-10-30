# syntax=docker/dockerfile:1

# ---- deps ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# ---- build: static assets ----
FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

# ---- production: Caddy serves dist and proxies /api ----
FROM caddy:2-alpine AS production
# API_UPSTREAM is substituted by Caddy at runtime via {env.API_UPSTREAM}.
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
ENV API_UPSTREAM=api:4000
EXPOSE 8080
