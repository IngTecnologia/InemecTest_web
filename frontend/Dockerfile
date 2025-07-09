# Etapa 1: Build
FROM node:18-alpine AS build

WORKDIR /app

# Copiar package.json y package-lock.json si existe
COPY package*.json ./

# Instalar TODAS las dependencias (necesarias para el build)
RUN npm install

# Copiar código fuente
COPY . .

# Variables de entorno para el build
ENV NODE_ENV=production
ENV VITE_API_BASE_URL=/api/v1

# Construir la aplicación
RUN npm run build

# Verificar que el build fue exitoso
RUN ls -la dist/
RUN test -f dist/index.html || (echo "❌ Build failed - index.html not found" && exit 1)

# Etapa 2: Nginx
FROM nginx:alpine

# Instalar herramientas de debug
RUN apk add --no-cache curl

# Copiar archivos build
COPY --from=build /app/dist /usr/share/nginx/html

# Verificar que los archivos fueron copiados
RUN ls -la /usr/share/nginx/html/
RUN test -f /usr/share/nginx/html/index.html || (echo "❌ Files not copied correctly" && exit 1)

# Copiar configuración nginx personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Crear directorio para logs si no existe
RUN mkdir -p /var/log/nginx

# Script de health check
RUN echo '#!/bin/sh' > /health-check.sh && \
    echo 'curl -f http://localhost/ || exit 1' >> /health-check.sh && \
    chmod +x /health-check.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /health-check.sh

# Exponer puerto 80
EXPOSE 80

# Comando de inicio con logging
CMD ["sh", "-c", "echo 'Starting Nginx...' && nginx -t && nginx -g 'daemon off;'"]