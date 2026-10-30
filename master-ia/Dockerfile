# Plataforma del Máster en IA Aplicada al Desarrollo de Aplicaciones Multiplataforma
# Imagen estática con nginx sin privilegios (puerto 8080).
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/nginx-headers.conf /etc/nginx/snippets/master-ia-headers.conf
COPY --from=build /app/dist/index.html /usr/share/nginx/html/index.html
COPY --from=build /app/dist/ /tmp/dist/
RUN if [ -f /tmp/dist/logo-jrotero.png ]; then cp /tmp/dist/logo-jrotero.png /usr/share/nginx/html/; fi
EXPOSE 8080
