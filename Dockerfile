# syntax=docker/dockerfile:1

# Base images are pinned by digest so a rebuild cannot silently pick up a
# different Node or nginx than the one the gates were run against.
FROM node:24-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS build
WORKDIR /app

RUN npm install -g pnpm@9.1.1

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_API_BASE_URL=/api
# A default build must not ship the mock API; the demo build passes
# --build-arg VITE_ENABLE_MOCK=true explicitly.
ARG VITE_ENABLE_MOCK=false
ARG VITE_MOCK_LATENCY=300
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_ENABLE_MOCK=$VITE_ENABLE_MOCK \
    VITE_MOCK_LATENCY=$VITE_MOCK_LATENCY

RUN pnpm build

FROM nginxinc/nginx-unprivileged:1.29-alpine@sha256:0c79d56aee561a1d81c63f00eee5fb5fe29279560cdc55e91425133104c7fbe6 AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Outside conf.d on purpose: nginx includes conf.d/*.conf into `http`, and this
# file is a server/location snippet.
COPY security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
