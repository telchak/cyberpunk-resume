# The production image: builds the static site with Node, then serves it with nginx.
# CI builds it on every push to main (.github/workflows/cd.yml); `docker build .` works too.

FROM node:24-alpine AS build
WORKDIR /site
# Dependencies first: Docker reuses this layer until package-lock.json changes.
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# The skill tree artwork is downloaded here, never stored in git (see README).
RUN npm run assets:skilltree && npm run build

FROM nginxinc/nginx-unprivileged:1.30-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /site/dist /usr/share/nginx/html
