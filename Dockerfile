# syntax=docker/dockerfile:1

FROM node:24-alpine AS build
WORKDIR /app

RUN npm install -g pnpm@9.1.1

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_API_BASE_URL=/api
ARG VITE_ENABLE_MOCK=true
ARG VITE_MOCK_LATENCY=300
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_ENABLE_MOCK=$VITE_ENABLE_MOCK \
    VITE_MOCK_LATENCY=$VITE_MOCK_LATENCY

RUN pnpm build

FROM nginx:1.29-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
