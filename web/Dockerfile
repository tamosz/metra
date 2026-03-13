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

FROM cgr.dev/chainguard/nginx:latest@sha256:346e8e55447ead9829d2700a69fb73f107d8fafbdc10fe5a0ec25ac788fcc6c6
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist/ /usr/share/nginx/html/metra/
