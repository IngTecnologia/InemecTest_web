# Arquitectura de Despliegue - InemecTest Web

## Resumen
Este documento describe la arquitectura de despliegue del proyecto InemecTest Web, especificando las configuraciones necesarias para adaptarlo a diferentes entornos (desarrollo, pruebas y producción).

## Arquitectura General

### Stack Tecnológico
```
Frontend: React + Vite + Nginx
Backend: FastAPI + Python
Base de Datos: PostgreSQL (opcional - proyecto usa Excel)
Containerización: Docker + Docker Compose
```

### Estructura de Puertos

#### Desarrollo Local
```
Frontend: localhost:5173 (Vite dev server)
Backend: localhost:8000 (FastAPI)
```

#### Despliegue con Docker
```
Frontend: localhost:80 (Nginx)
Backend: localhost:8000 (FastAPI)
```

#### Producción (Ejemplo con dominio personalizado)
```
Servidor: dicacocu.inemec.com:4500 → Container Frontend:80
Backend: Comunicación interna Docker (backend:8000)
```

## Configuraciones por Entorno

### 1. Desarrollo/Pruebas (Configuración Actual)

#### docker-compose.yml
```yaml
services:
  frontend:
    ports:
      - "80:80"  # Puerto estándar HTTP
    depends_on:
      - backend
      
  backend:
    ports:
      - "8000:8000"  # Puerto directo para debugging
```

#### nginx.conf
```nginx
server {
    listen 80;
    server_name localhost;  # Genérico para desarrollo
    
    location /api/ {
        proxy_pass http://backend:8000;
        # Configuración CORS permisiva
    }
}
```

#### config.py (Backend)
```python
API_CONFIG = {
    "cors_origins": ["*"],  # Permisivo para desarrollo
    "host": "0.0.0.0",
    "port": 8000
}
```

### 2. Producción - Servicio Individual (Puerto específico)

#### docker-compose.yml
```yaml
services:
  frontend:
    ports:
      - "4500:80"  # Puerto personalizado mapeado
    depends_on:
      - backend
      
  backend:
    ports:
      - "8000:8000"  # Mantenido para comunicación interna
```

#### nginx.conf
```nginx
server {
    listen 80;
    server_name dicacocu.inemec.com;  # Dominio específico
    
    location /api/ {
        proxy_pass http://backend:8000;
        # Configuración CORS específica
    }
}
```

#### config.py (Backend)
```python
API_CONFIG = {
    "cors_origins": [
        "http://dicacocu.inemec.com:4500",
        "http://dicacocu.inemec.com",
        "http://localhost:80"
    ],
    "host": "0.0.0.0",
    "port": 8000
}
```

### 3. Producción - Múltiples Servicios con Nginx Global

#### Arquitectura con Nginx Global
```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Host Server                       │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Nginx Global   │  │  InemecTest     │  │ Otro Servicio│ │
│  │  Container      │  │  Containers     │  │ Containers   │ │
│  │                 │  │                 │  │              │ │
│  │ ┌─────────────┐ │  │ ┌─────┐ ┌─────┐ │  │ ┌─────┐ ┌───┐│ │
│  │ │   Nginx     │ │  │ │React│ │ API │ │  │ │React│ │API││ │
│  │ │   :80/443   │ │  │ │ :80 │ │:8000│ │  │ │ :80 │ │:8k││ │
│  │ └─────────────┘ │  │ └─────┘ └─────┘ │  │ └─────┘ └───┘│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│           │                      │                │         │
└───────────┼──────────────────────┼────────────────┼─────────┘
            │                      │                │
    ┌───────▼───────┐              │                │
    │ Host Port 443 │              │                │
    │   (Global)    │              │                │
    └───────────────┘              │                │
                           ┌───────▼────────────────▼─────┐
                           │   Docker Internal Network   │
                           │   (Sin puertos externos)    │
                           └──────────────────────────────┘
```

#### nginx-global/docker-compose.yml
```yaml
version: '3.8'

services:
  nginx-global:
    image: nginx:alpine
    container_name: nginx-global-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs  # Para certificados SSL
    networks:
      - global-network
    depends_on:
      - inemectest-frontend
      - otro-servicio-frontend

networks:
  global-network:
    external: true  # Red compartida entre todos los servicios
```

#### nginx-global/nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Configuración de logs
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Configuración SSL básica
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Configuración de compresión
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Servidor para InemecTest
    server {
        listen 80;
        listen 443 ssl;
        server_name dicacocu.inemec.com;
        
        # Certificados SSL (opcional)
        ssl_certificate /etc/ssl/certs/dicacocu.pem;
        ssl_certificate_key /etc/ssl/certs/dicacocu.key;
        
        # Redirección HTTP a HTTPS (opcional)
        if ($scheme != "https") {
            return 301 https://$host$request_uri;
        }
        
        # Proxy para API del backend
        location /api/ {
            proxy_pass http://inemectest-backend:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Headers CORS
            proxy_hide_header Access-Control-Allow-Origin;
            add_header Access-Control-Allow-Origin https://dicacocu.inemec.com always;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE, PATCH" always;
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
            add_header Access-Control-Allow-Credentials true always;
        }
        
        # Proxy para frontend
        location / {
            proxy_pass http://inemectest-frontend:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    
    # Servidor para otro servicio (subdominio)
    server {
        listen 80;
        listen 443 ssl;
        server_name gestion.inemec.com;
        
        ssl_certificate /etc/ssl/certs/gestion.pem;
        ssl_certificate_key /etc/ssl/certs/gestion.key;
        
        location /api/ {
            proxy_pass http://gestion-backend:8001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        location / {
            proxy_pass http://gestion-frontend:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    
    # Servidor para otro servicio (ruta)
    server {
        listen 80;
        listen 443 ssl;
        server_name dicacocu.inemec.com;
        
        ssl_certificate /etc/ssl/certs/dicacocu.pem;
        ssl_certificate_key /etc/ssl/certs/dicacocu.key;
        
        # Servicio en /reportes/*
        location /reportes/ {
            proxy_pass http://reportes-frontend:80/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        location /reportes/api/ {
            proxy_pass http://reportes-backend:8002/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### Modificaciones en servicios individuales

**InemecTest - docker-compose.yml** (SIN puertos externos):
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: inemectest-frontend
    restart: unless-stopped
    # ❌ NO exponer puertos externos
    # ports:
    #   - "80:80"
    depends_on:
      - backend
    networks:
      - global-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: inemectest-backend
    restart: unless-stopped
    # ❌ NO exponer puertos externos  
    # ports:
    #   - "8000:8000"
    volumes:
      - ./backend/data:/app/data
    environment:
      - PYTHONPATH=/app
      - ENVIRONMENT=production
    networks:
      - global-network

networks:
  global-network:
    external: true
```

**InemecTest - nginx.conf** (simplificado):
```nginx
server {
    listen 80;
    server_name localhost;  # No importa, el routing lo hace nginx global
    
    root /usr/share/nginx/html;
    index index.html index.htm;
    
    # Solo servir archivos estáticos, el proxy lo maneja nginx global
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # ❌ NO configurar proxy aquí, lo hace nginx global
    # location /api/ {
    #     proxy_pass http://backend:8000;
    # }
}
```

**InemecTest - config.py** (CORS para nginx global):
```python
API_CONFIG = {
    "cors_origins": [
        "https://dicacocu.inemec.com",
        "http://dicacocu.inemec.com",
        "http://localhost"  # Para desarrollo
    ],
    "host": "0.0.0.0",
    "port": 8000
}
```

## Flujo de Datos

### Desarrollo
```
Usuario → localhost:80 → Nginx → React App
Usuario → localhost:80/api → Nginx → Proxy → backend:8000 → FastAPI
```

### Producción
```
Usuario → dicacocu.inemec.com:4500 → Docker Host:4500 → Container:80 → Nginx → React App
Usuario → dicacocu.inemec.com:4500/api → Docker Host:4500 → Container:80 → Nginx → Proxy → backend:8000 → FastAPI
```

## Configuraciones Críticas

### 1. CORS (Cross-Origin Resource Sharing)
- **Desarrollo**: Permisivo con `["*"]` para facilitar debugging
- **Producción**: Específico con dominios exactos para seguridad

### 2. Server Name (Nginx)
- **Desarrollo**: `localhost` genérico
- **Producción**: Dominio específico para evitar conflictos con otros servicios

### 3. Port Mapping (Docker)
- **Desarrollo**: Puerto estándar `80:80`
- **Producción**: Puerto personalizado `4500:80` basado en infraestructura

## Adaptación a Otros Proyectos

### Estrategias de Despliegue

#### Opción A: Servicio Individual (Pocos servicios)
- Cada servicio usa su propio puerto
- Configuración simple y directa
- Ideal para 1-3 servicios

#### Opción B: Nginx Global (Múltiples servicios)
- Un solo nginx maneja todo el routing
- Servicios sin puertos externos
- SSL centralizado
- Ideal para 4+ servicios

### Configuración con Nginx Global

#### 1. Crear Red Global
```bash
# Crear red compartida
docker network create global-network
```

#### 2. Configurar Nginx Global
```bash
# Estructura de directorios
nginx-global/
├── docker-compose.yml
├── nginx.conf
└── ssl/
    ├── dicacocu.pem
    └── dicacocu.key
```

#### 3. Modificar Servicios Existentes

**Paso 1**: Remover puertos externos del `docker-compose.yml`
```yaml
# ❌ Quitar esto:
ports:
  - "80:80"
  - "8000:8000"

# ✅ Agregar esto:
networks:
  - global-network

networks:
  global-network:
    external: true
```

**Paso 2**: Simplificar `nginx.conf` del servicio
```nginx
# Solo servir archivos estáticos
server {
    listen 80;
    server_name localhost;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # ❌ NO configurar proxy, lo hace nginx global
}
```

**Paso 3**: Actualizar CORS en el backend
```python
API_CONFIG = {
    "cors_origins": [
        "https://dicacocu.inemec.com",
        "https://gestion.inemec.com",
        "http://localhost"  # Para desarrollo
    ]
}
```

### Ruteo de Servicios

#### Por Subdominio (Recomendado)
```
https://dicacocu.inemec.com     → InemecTest
https://gestion.inemec.com      → Sistema de Gestión
https://reportes.inemec.com     → Sistema de Reportes
```

#### Por Ruta
```
https://dicacocu.inemec.com/         → InemecTest
https://dicacocu.inemec.com/gestion/ → Sistema de Gestión
https://dicacocu.inemec.com/reportes/→ Sistema de Reportes
```

### Checklist de Migración

#### Para Servicio Existente:
- [ ] Crear red global: `docker network create global-network`
- [ ] Quitar `ports:` del `docker-compose.yml`
- [ ] Agregar `networks: - global-network`
- [ ] Simplificar `nginx.conf` (solo archivos estáticos)
- [ ] Actualizar CORS en backend
- [ ] Configurar nginx global para incluir el servicio

#### Para Nuevo Servicio:
- [ ] Copiar estructura de directorios del InemecTest
- [ ] Configurar `docker-compose.yml` sin puertos externos
- [ ] Configurar `nginx.conf` simplificado
- [ ] Configurar CORS específico en backend
- [ ] Agregar configuración en nginx global

### Comandos de Despliegue Global

#### 1. Desplegar Nginx Global
```bash
cd nginx-global/
docker-compose up -d
```

#### 2. Desplegar Servicios
```bash
cd inemectest/
docker-compose up -d

cd otro-servicio/
docker-compose up -d
```

#### 3. Verificar Conectividad
```bash
# Verificar red
docker network ls
docker network inspect global-network

# Verificar servicios
docker ps
curl -H "Host: dicacocu.inemec.com" http://localhost/
```

### Configuración SSL

#### Con Let's Encrypt (Automático)
```yaml
# nginx-global/docker-compose.yml
services:
  nginx-global:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - certbot-data:/etc/letsencrypt
      
  certbot:
    image: certbot/certbot
    volumes:
      - certbot-data:/etc/letsencrypt
    command: certonly --webroot --webroot-path=/var/www/html --email admin@inemec.com --agree-tos --no-eff-email -d dicacocu.inemec.com
```

#### Con Certificados Propios
```bash
# Copiar certificados
cp dicacocu.pem nginx-global/ssl/
cp dicacocu.key nginx-global/ssl/

# Configurar en nginx.conf
ssl_certificate /etc/ssl/certs/dicacocu.pem;
ssl_certificate_key /etc/ssl/certs/dicacocu.key;
```

## Comandos de Despliegue

### Desarrollo
```bash
# Construcción y despliegue
docker-compose up -d

# Logs
docker-compose logs -f

# Parar servicios
docker-compose down
```

### Producción
```bash
# Construcción optimizada
docker-compose up -d --build

# Verificar estado
docker-compose ps

# Backup antes de actualizar
docker-compose down
docker-compose up -d --build
```

## Troubleshooting

### Problemas Comunes

#### 1. CORS Errors
- Verificar que el dominio esté en `cors_origins`
- Comprobar que el puerto coincide

#### 2. 502 Bad Gateway
- Verificar que el backend esté corriendo
- Comprobar la configuración de `proxy_pass`

#### 3. Puerto ya en uso
- Verificar que el puerto externo no esté ocupado
- Usar `docker-compose down` para limpiar

### Logs Útiles
```bash
# Logs específicos
docker-compose logs frontend
docker-compose logs backend

# Logs de nginx
docker exec -it inemectest-frontend cat /var/log/nginx/error.log
docker exec -it inemectest-frontend cat /var/log/nginx/access.log
```

## Estructura de Archivos

### Archivos de Configuración
```
proyecto/
├── docker-compose.yml          # Orquestación de servicios
├── frontend/
│   ├── Dockerfile             # Imagen del frontend
│   ├── nginx.conf             # Configuración del servidor web
│   └── vite.config.js         # Configuración de desarrollo
└── backend/
    ├── Dockerfile             # Imagen del backend
    ├── main.py                # Servidor FastAPI
    └── src/config.py          # Configuración de la API
```

### Configuración Modular
- **docker-compose.yml**: Orquestación y puertos
- **nginx.conf**: Ruteo y proxy
- **config.py**: CORS y configuración de API
- **Dockerfile**: Construcción de imágenes

## Mejores Prácticas

### Seguridad
1. **CORS específico** en producción
2. **Server names explícitos** para evitar conflictos
3. **Puertos no estándar** para reducir exposición

### Mantenibilidad
1. **Variables de entorno** para configuraciones
2. **Documentación** de cada configuración
3. **Separación** entre desarrollo/producción

### Escalabilidad
1. **Arquitectura modular** con servicios separados
2. **Proxy inverso** para balanceo de carga
3. **Contenedores independientes** para cada servicio

---

**Nota**: Este documento refleja la arquitectura actual del proyecto InemecTest Web y puede ser usado como referencia para adaptar otros proyectos similares.