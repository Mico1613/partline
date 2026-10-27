# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src ./src
ARG VITE_FAVORIT_API_KEY=
ARG VITE_FAVORIT_API_URL=
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
