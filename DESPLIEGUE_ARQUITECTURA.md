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

### 2. Producción (Configuración Adaptada)

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

### Checklist de Configuración

#### 1. Variables de Entorno
```bash
# docker-compose.yml
FRONTEND_PORT=80      # Puerto interno del container
EXTERNAL_PORT=4500    # Puerto expuesto al exterior
DOMAIN=dicacocu.inemec.com
```

#### 2. Archivos a Modificar
```
docker-compose.yml    → Mapeo de puertos
nginx.conf           → server_name y proxy_pass
config.py            → CORS origins
```

#### 3. Configuración por Fases
```
Fase 1: Desarrollo   → Configuración permisiva
Fase 2: Pruebas      → Configuración intermedia
Fase 3: Producción   → Configuración específica y segura
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