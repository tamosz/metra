FROM --platform=linux/arm64 node:24-alpine AS build
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

FROM --platform=linux/arm64 cgr.dev/chainguard/nginx:latest
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist/ /usr/share/nginx/html/metra/
