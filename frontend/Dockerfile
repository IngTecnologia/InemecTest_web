# Etapa 1: Build
FROM node:18-alpine as build

WORKDIR /app

# Copiar package.json
COPY package.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Etapa 2: Nginx
FROM nginx:alpine

# Copiar archivos build
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración nginx personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]