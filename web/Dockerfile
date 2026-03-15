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

FROM cgr.dev/chainguard/nginx:latest@sha256:245afcb4eb018784059cae8c28328d70576f2a6231b8c0e25594620a70a6aa72
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist/ /usr/share/nginx/html/metra/
