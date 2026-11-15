FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . ./

ARG VITE_PROTECTED_PATH_PREFIX=/gateway
ENV VITE_PROTECTED_PATH_PREFIX=${VITE_PROTECTED_PATH_PREFIX}
RUN npm run build

FROM nginx:alpine

ENV NGINX_ENVSUBST_FILTER=FRONTEND_API_KEY
COPY --from=build /app/dist/ /usr/share/nginx/html/
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 8080
