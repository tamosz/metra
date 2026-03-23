FROM cgr.dev/chainguard/node:latest-dev AS build
USER root
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY packages/engine/package.json packages/engine/
RUN npm ci
COPY web/package.json web/package-lock.json web/
RUN cd web && npm ci
COPY src/ src/
COPY data/ data/
COPY packages/ packages/
COPY web/ web/
RUN cd web && npx vite build

FROM cgr.dev/chainguard/nginx:latest@sha256:d5b9daa0f96c23e62412ffe80d6de0b507f406fe6568b90eecc6c5dbbed59a3d
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist/ /usr/share/nginx/html/metra/
