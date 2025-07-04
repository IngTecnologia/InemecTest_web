# InemecTest Web - Sistema de Generación Automática de Preguntas

> **Sistema inteligente para la generación automática de preguntas de evaluación basado en procedimientos operacionales, utilizando OpenAI GPT-4 y validación automatizada.**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-orange.svg)

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Características Principales](#-características-principales)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Flujo de Procesamiento](#-flujo-de-procesamiento)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Uso del Sistema](#-uso-del-sistema)
- [Gestión de Archivos](#-gestión-de-archivos)
- [API y Endpoints](#-api-y-endpoints)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Troubleshooting](#-troubleshooting)
- [Contribución](#-contribución)

---

## 🎯 Descripción General

**InemecTest Web** es una plataforma completa que automatiza el proceso de generación de preguntas de evaluación para procedimientos operacionales. El sistema utiliza inteligencia artificial (OpenAI GPT-4) para analizar documentos de procedimientos en formato DOCX y generar preguntas de opción múltiple con validación automática de calidad.

### ¿Para qué sirve?

- **Empresas**: Automatizar la creación de evaluaciones para capacitación de personal
- **Instituciones educativas**: Generar exámenes basados en material técnico
- **Departamentos de seguridad**: Crear evaluaciones de procedimientos críticos
- **Consultoras**: Acelerar el desarrollo de material de evaluación

---

## ✨ Características Principales

### 🤖 Generación Inteligente
- **IA Avanzada**: Utiliza GPT-4 para análisis profundo de procedimientos
- **Preguntas Contextuales**: Genera preguntas relevantes al contenido específico
- **Múltiples Formatos**: Soporta diferentes tipos de procedimientos técnicos

### 🔍 Validación Automatizada
- **4 Niveles de Validación**:
  - **Estructura**: Formato y completitud de preguntas
  - **Técnico**: Precisión del contenido técnico
  - **Dificultad**: Nivel apropiado de complejidad
  - **Claridad**: Comprensibilidad y redacción

### 🔄 Corrección Automática
- **Auto-corrección**: Mejora automática de preguntas que no pasan validación
- **Versionado**: Mantiene historial de revisiones
- **Iteración Inteligente**: Hasta 2 intentos de corrección por pregunta

### 📊 Gestión Completa
- **Dashboard Administrativo**: Interfaz intuitiva para gestión
- **Seguimiento en Tiempo Real**: Monitor de progreso del workflow
- **Estados Visuales**: Indicadores claros del estado de cada procedimiento
- **Exportación Excel**: Integración con hojas de cálculo

---

## 🏗️ Arquitectura del Sistema

### Componentes Principales

#### 🎨 **Frontend (React + Vite)**
- **Tecnologías**: React 18, Vite, JavaScript ES6+
- **Funcionalidades**:
  - Dashboard administrativo interactivo
  - Cola de procedimientos con filtros y búsqueda
  - Monitor de workflow en tiempo real
  - Sistema de notificaciones
  - Gestión de estados y configuración

#### ⚙️ **Backend (FastAPI + Python)**
- **Tecnologías**: FastAPI, Python 3.9+, Asyncio
- **Módulos**:
  - **API REST**: Endpoints para todas las operaciones
  - **Workflow Engine**: Orquestación del proceso completo
  - **Scanner**: Análisis y procesamiento de archivos DOCX
  - **Generator**: Interfaz con OpenAI para generación
  - **Validators**: Sistema de validación multi-nivel
  - **Corrector**: Auto-corrección de preguntas
  - **Excel Sync**: Integración con hojas de cálculo

---

## 🔄 Flujo de Procesamiento

### 1. **Escaneo de Archivos**
```
Directorio procedures_source/ → Scanner → Extracción de metadatos → Cola de procesamiento
```

**Proceso detallado:**
- El sistema escanea el directorio `procedures_source/`
- Extrae código y versión del nombre del archivo
- Analiza el contenido del documento DOCX
- Determina el estado: `nuevo`, `nueva_version`, o `ya_procesado`
- Agrega a la cola de procesamiento

### 2. **Generación de Preguntas**
```
Documento DOCX → Análisis GPT-4 → 5 Preguntas → Formato JSON → Almacenamiento temporal
```

**Detalles del proceso:**
- Extrae texto completo del documento
- Envía a OpenAI GPT-4 con prompt especializado
- Genera 5 preguntas de opción múltiple
- Estructura en formato JSON estandarizado
- Asigna ID único a cada pregunta

### 3. **Validación Multi-Nivel**
```
Preguntas → Validador 1 (Estructura) → Validador 2 (Técnico) → Validador 3 (Dificultad) → Validador 4 (Claridad)
```

**Validadores específicos:**
- **Estructura (E1)**: Verifica formato, opciones completas, respuesta correcta
- **Técnico (E2)**: Valida precisión técnica y correspondencia con el procedimiento
- **Dificultad (E3)**: Evalúa nivel apropiado de complejidad
- **Claridad (E4)**: Revisa redacción y comprensibilidad

### 4. **Corrección Automática**
```
Preguntas con errores → Análisis de fallos → GPT-4 Corrector → Nueva versión → Re-validación
```

**Lógica de corrección:**
- Identifica preguntas que no pasan validación
- Analiza comentarios específicos de validadores
- Envía a GPT-4 con contexto de errores
- Genera versión corregida
- Re-ejecuta validación automáticamente

### 5. **Sincronización y Almacenamiento**
```
Preguntas validadas → Excel Sync → Archivos JSON → Tracking → Estado final
```

**Almacenamiento múltiple:**
- **Excel**: `procedimientos_y_preguntas.xlsx` para uso directo
- **JSON**: `generated_questions.json` para integración API
- **Tracking**: `question_generation_tracking.json` para control de estados
- **Resultados**: `resultados_evaluaciones.xlsx` para análisis

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Docker**: >= 20.10
- **Docker Compose**: >= 1.29
- **OpenAI API Key**: Cuenta activa con acceso a GPT-4

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/inemectest-web.git
cd inemectest-web
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tu API key
nano .env
```

**Configuración `.env`:**
```env
# OpenAI Configuration
OPENAI_API_KEY=sk-tu-api-key-aqui

# Environment
ENVIRONMENT=production
DEBUG=false

# Admin Module
ADMIN_ENABLED=true
PROCEDURES_SOURCE_DIR=data/procedures_source
GENERATION_BATCH_SIZE=5
MAX_RETRIES=3
```

### 3. Preparar Directorio de Datos

```bash
# Crear estructura de directorios
mkdir -p backend/data/procedures_source
mkdir -p backend/data/admin_temp
mkdir -p logs

# Permisos correctos
chmod 755 backend/data
chmod 777 backend/data/procedures_source
```

### 4. Construir y Ejecutar

```bash
# Construir imágenes
docker-compose build

# Ejecutar en modo detached
docker-compose up -d

# Verificar estado
docker-compose ps
```

### 5. Verificar Instalación

- **Frontend**: http://localhost (puerto 80)
- **Backend API**: http://localhost:8000
- **Documentación API**: http://localhost:8000/docs

---

## 📖 Uso del Sistema

### Acceso al Dashboard

1. Navega a http://localhost
2. Ve a la sección "Admin" → "Cola de Procedimientos"

### Subir Procedimientos

1. **Formato de archivo**: `CODIGO-PROCEDIMIENTO V.VERSION.docx`
   - ✅ Correcto: `PEP-PRO-1141 V.2.docx`
   - ✅ Correcto: `SOP-MANT-001.docx` (versión 1 implícita)
   - ❌ Incorrecto: `procedimiento manual.docx`

2. **Subir archivos**:
   ```bash
   # Copiar a directorio de procedimientos
   cp "PEP-PRO-1141 V.2.docx" backend/data/procedures_source/
   ```

3. **Escanear en la interfaz**:
   - Hacer clic en "🔍 Escanear"
   - El archivo aparecerá en la cola como "Nuevo"

### Generar Preguntas

#### Opción 1: Procesamiento Individual
- Hacer clic en el botón ▶️ junto al procedimiento deseado

#### Opción 2: Procesamiento Masivo
- Seleccionar procedimientos con checkboxes
- Hacer clic en "🚀 Procesar Seleccionados"

#### Opción 3: Procesar Todos Disponibles
- Hacer clic en "🚀 Procesar Disponibles"
- Solo procesará procedimientos no procesados

### Monitorear Progreso

El sistema muestra un **banner azul** cuando está procesando:
```
🚀 Workflow en Progreso
Procesando procedimientos...
```

### Estados de Procedimientos

| Estado | Color | Descripción | Acciones Disponibles |
|--------|-------|-------------|---------------------|
| **Nuevo** | Verde | Procedimiento nunca procesado | ▶️ Procesar |
| **Nueva Versión** | Naranja | Versión actualizada | ▶️ Procesar |
| **Ya Procesado** | Gris | Completamente procesado | 🔄 Regenerar |

---

## 📁 Gestión de Archivos

### Estructura de Datos

```
backend/data/
├── procedures_source/          # Archivos DOCX fuente
│   ├── PEP-PRO-1141 V.2.docx
│   └── SOP-MANT-001.docx
├── generated_questions.json    # Preguntas generadas (API)
├── procedimientos_y_preguntas.xlsx  # Excel principal
├── resultados_evaluaciones.xlsx     # Resultados de evaluación
├── question_generation_tracking.json # Control de estados
└── admin_temp/                 # Archivos temporales
    ├── batch_*.json
    └── *.log
```

### Convenciones de Nomenclatura

#### Archivos de Procedimientos
```
FORMATO: [CÓDIGO] V.[VERSIÓN].docx

Ejemplos válidos:
- PEP-PRO-1141 V.2.docx        → Código: PEP-PRO-1141, Versión: 2
- SOP-MANT-001.docx            → Código: SOP-MANT-001, Versión: 1
- PROC-SEG-025 V.10.docx       → Código: PROC-SEG-025, Versión: 10

Ejemplos inválidos:
- manual seguridad.docx        → No tiene código identificable
- PEP-1141-version2.docx       → Formato de versión incorrecto
```

### Tracking de Estados

El sistema mantiene un tracking detallado en `question_generation_tracking.json`:

```json
{
  "generated_questions": {},
  "last_scan": "2024-01-15T10:30:00Z",
  "scan_history": [],
  "batch_PEP-PRO-1141_2_20240115_103000": {
    "codigo": "PEP-PRO-1141",
    "version": "2",
    "batch_id": "batch_PEP-PRO-1141_2_20240115_103000",
    "fecha_generacion": "2024-01-15T10:30:00Z",
    "preguntas_count": 5,
    "promedio_score": 0.95,
    "status": "completed"
  }
}
```

### Versionado Inteligente

El sistema maneja versiones automáticamente:

- **V.1**: Si no se especifica versión
- **V.2, V.3, etc.**: Versiones explícitas
- **Tracking independiente**: Cada versión se trackea por separado
- **Regeneración**: Permite regenerar cualquier versión

### Comportamiento con Archivos Repetidos

#### ¿Qué pasa si vuelvo a subir un procedimiento que ya se había subido?

- **Si es exactamente el mismo archivo** (mismo nombre y versión):
  - Aparece en la cola como **"ya_procesado"** (fondo gris)
  - El botón ▶️ aparece deshabilitado con ✓ 
  - Solo se puede **regenerar** (reemplazar preguntas existentes)

- **Si cambias el contenido pero mantienes el mismo nombre**:
  - El sistema **NO detecta** el cambio de contenido
  - Sigue comportándose como "ya_procesado"
  - Para procesarlo, necesitas **regenerar** manualmente

- **Si quieres que se procese como nuevo**:
  - Cambia la versión en el nombre: `PEP-PRO-1141 V.3.docx`

#### Diferencia entre "Actualizar" y "Escanear"

| Aspecto | 🔄 **Actualizar** | 🔍 **Escanear** |
|---------|------------------|------------------|
| **Función** | Refresca la vista de la cola | Busca archivos nuevos en el directorio |
| **Acción backend** | `GET /api/v1/admin/queue` | `POST /api/v1/admin/scan` |
| **Cuándo usar** | Ver cambios en estados existentes | Después de subir archivos nuevos |
| **Detecta archivos nuevos** | ❌ No | ✅ Sí |
| **Actualiza estados** | ✅ Sí | ✅ Sí + escaneo |

---

## 🌐 API y Endpoints

### Base URL
```
http://localhost:8000/api/v1/admin
```

### Endpoints Principales

#### 📊 Estado y Configuración
```http
GET /status                 # Estado general del sistema
GET /config                 # Configuración actual
```

#### 🔍 Escaneo y Cola
```http
POST /scan                  # Escanear directorio de procedimientos
GET /queue                  # Obtener cola de procedimientos
DELETE /queue/{codigo}/{version}  # Remover de cola
```

#### 🚀 Workflow
```http
POST /workflow/start        # Iniciar workflow completo
GET /workflow/status        # Estado del workflow
POST /workflow/cancel       # Cancelar workflow activo
GET /workflow/progress/{batch_id}  # Progreso específico
```

#### 📈 Estadísticas
```http
GET /stats                  # Estadísticas del sistema
GET /results                # Resultados de evaluaciones
```

### Ejemplos de Uso

#### Iniciar Procesamiento de Procedimientos Específicos
```bash
curl -X POST "http://localhost:8000/api/v1/admin/workflow/start" \
  -H "Content-Type: application/json" \
  -d '{
    "procedure_codes": ["PEP-PRO-1141", "SOP-MANT-001"]
  }'
```

#### Obtener Estado del Sistema
```bash
curl -X GET "http://localhost:8000/api/v1/admin/status"
```

---

## 📂 Estructura del Proyecto

```
inemectest-web/
├── 📁 frontend/                     # Frontend React
│   ├── 📁 components/
│   │   ├── 📁 admin/               # Componentes admin
│   │   │   ├── AdminDashboard.jsx  # Dashboard principal
│   │   │   ├── ProcedureQueue.jsx  # Cola de procedimientos
│   │   │   ├── WorkflowMonitor.jsx # Monitor de workflow
│   │   │   └── ConfigPanel.jsx     # Panel de configuración
│   │   └── 📁 shared/              # Componentes compartidos
│   ├── 📁 hooks/                   # React hooks
│   │   └── useAdminStatus.js       # Hooks para admin
│   ├── 📁 src/
│   │   └── 📁 services/
│   │       └── api.js              # Cliente API
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
│
├── 📁 backend/                      # Backend FastAPI
│   ├── 📁 src/
│   │   └── 📁 admin/               # Módulo administrativo
│   │       ├── api.py              # Endpoints REST
│   │       ├── workflow_engine.py  # Motor de workflow
│   │       ├── procedure_scanner.py # Scanner de archivos
│   │       ├── question_generator.py # Generador con OpenAI
│   │       ├── validators.py       # Motor de validación
│   │       ├── corrector.py        # Corrector automático
│   │       ├── excel_handler.py    # Manejo de Excel
│   │       ├── models.py           # Modelos de datos
│   │       ├── config.py           # Configuración
│   │       └── utils.py            # Utilidades
│   ├── 📁 data/                    # Datos persistentes
│   │   ├── 📁 procedures_source/   # Archivos DOCX
│   │   ├── 📁 admin_temp/          # Archivos temporales
│   │   ├── generated_questions.json
│   │   ├── procedimientos_y_preguntas.xlsx
│   │   └── question_generation_tracking.json
│   ├── main.py                     # Punto de entrada
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml              # Orquestación Docker
├── .env.example                    # Variables de entorno ejemplo
├── .gitignore                      # Archivos excluidos
└── README.md                       # Esta documentación
```

---

## 🐛 Troubleshooting

### Problemas Comunes

#### 1. **Error 409: Workflow está ocupado**
```
Síntoma: No se puede iniciar nuevo workflow
Causa: Estado del workflow no se resetea
Solución: Reiniciar backend
```

```bash
# Solución rápida
docker-compose restart backend
```

#### 2. **OpenAI API Key inválida**
```
Síntoma: Error de autenticación con OpenAI
Causa: API key incorrecta o sin permisos
Solución: Verificar y actualizar .env
```

#### 3. **Archivos no se detectan al escanear**
```
Síntoma: Escanear no encuentra archivos DOCX
Causa: Archivos en directorio incorrecto o nombres inválidos
Solución: Verificar ubicación y nomenclatura
```

#### 4. **Frontend no se actualiza**
```
Síntoma: Cambios no aparecen en la interfaz
Causa: Cache de Docker
Solución: Rebuild sin cache
```

```bash
docker-compose down -v
docker rmi inemectest_web_frontend
docker-compose build --no-cache frontend
docker-compose up -d
```

### Logs y Debugging

#### Ver logs en tiempo real
```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend
```

#### Verificar estado del sistema
```bash
# Estado de contenedores
docker-compose ps

# Verificar salud de la aplicación
curl http://localhost:8000/api/v1/admin/status
```

---

## 🤝 Contribución

### Guías de Contribución

1. **Fork** el repositorio
2. **Crear** una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
3. **Commit** tus cambios: `git commit -am 'Agregar nueva funcionalidad'`
4. **Push** a la rama: `git push origin feature/nueva-funcionalidad`
5. **Crear** un Pull Request

### Estándares de Código

#### Backend (Python)
- **PEP 8**: Seguir estándares de Python
- **Type Hints**: Usar anotaciones de tipo
- **Docstrings**: Documentar funciones y clases
- **Async/Await**: Usar programación asíncrona

#### Frontend (React)
- **ESLint**: Seguir reglas de linting
- **Hooks**: Usar hooks de React apropiadamente
- **PropTypes**: Documentar props de componentes
- **CSS Modules**: Usar estilos modulares

---

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT.

---

## 🚀 Roadmap

### Versión 1.1 (Planificada)
- [ ] Soporte para archivos PDF
- [ ] Integración con LMS (Moodle, Canvas)
- [ ] Dashboard de analytics avanzado
- [ ] API para integración externa

### Versión 1.2 (Futuro)
- [ ] Soporte multiidioma
- [ ] Plantillas de preguntas personalizables
- [ ] Integración con bases de datos externas
- [ ] App móvil para revisión

---

**¡Gracias por usar InemecTest Web!** 🎉

> *Sistema desarrollado para automatizar y optimizar la generación de evaluaciones técnicas, combinando la potencia de la inteligencia artificial con validación automatizada para garantizar calidad y precisión.*
