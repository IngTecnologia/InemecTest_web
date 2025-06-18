"""
Configuración específica para el módulo administrativo de InemecTest
Incluye system messages, configuraciones y constantes
"""

import os
from typing import Dict, Any, List, Optional
import json
from pathlib import Path

# =============================================================================
# CONFIGURACIÓN DE OPENAI Y GENERACIÓN
# =============================================================================


#API key, OpenAI
OPENAI_API_KEY = ""


# Directorio base del backend
# En Docker, el directorio de trabajo es /app
if os.getenv("ENVIRONMENT") == "production":
    BASE_DIR = Path("/app")
else:
    BASE_DIR = Path(__file__).resolve().parents[1]

# Configuración por defecto para generación
GENERATION_CONFIG = {
    "openai_model": "gpt-4o",
    "temperature": 0.9,
    "max_tokens": 7000,
    "timeout_seconds": 300,
    "max_retries": 3,
    "rate_limit_enabled": True,
    "batch_size": 5
}

# Configuración de rate limiting
RATE_LIMIT_CONFIG = {
    "requests_per_minute": 50,
    "requests_per_hour": 1000,
    "retry_delay_base": 2,  # Segundos para backoff exponencial
    "max_retry_delay": 60   # Máximo delay entre reintentos
}

# =============================================================================
# SYSTEM MESSAGES
# =============================================================================

# System message principal para generación de preguntas (actualizado)
GENERATOR_SYSTEM_MESSAGE = """
A partir del contenido del procedimiento técnico que será proporcionado por el usuario en el siguiente mensaje del chat como archivo .docx, identifica el contenido del ítem 1 y del ítem 5. Luego, genera cinco preguntas de selección múltiple con cuatro opciones de respuesta cada una. Las preguntas deben estar formuladas con base en el ítem 5, pero asegurando que el enfoque esté alineado con lo establecido en el ítem 1. La evaluación debe centrarse en la comprensión del procedimiento en un contexto laboral.

Además de la pregunta y sus opciones, cada objeto generado debe incluir los siguientes campos adicionales:
- "codigo_procedimiento": el código del procedimiento, obtenido del nombre del archivo entregado por el usuario (sin extensión).
  - Ejemplo: si el nombre del archivo es "ABC-1234.docx", el valor debe ser "ABC-1234".
- "version_proc": si el nombre del archivo no contiene "V.", entonces la versión es 1.
  - Ejemplo: si el nombre es "ABC-1234_V.2.docx", entonces "version_proc" es 2.
- "version_preg": este campo debe tener siempre el valor 1.
- "prompt": debe ser exactamente "1.1".
- "tipo_proc": debe ser OPERATIVO, TECNICO o ADMINISTRATIVO, según el encabezado del procedimiento.
  - En procedimientos OPERATIVOS, usa siempre el término **operador**, no **técnico**.
- "puntaje_ia", "puntaje_e1", "puntaje_e2", "puntaje_e3", "puntaje_e4": deben tener valor 0.
- "comentario_e1", ..., "comentario_e4": deben ser campos vacíos.
- "historial_revision": debe ser una lista vacía: [].

Cada pregunta debe cumplir con los siguientes **criterios obligatorios**:

1. **Sobre el tipo de pregunta**:
   - Pregunta 1: enfoque cognitivo general.
   - Pregunta 2: basada en una situación práctica o escenario realista.
   - Pregunta 3: breve, clara y directa, máximo 20 palabras.
   - Pregunta 4: basada en errores comunes o confusiones frecuentes si el procedimiento no se aplica correctamente.
   - Pregunta 5: redactada exclusivamente con terminología técnica del procedimiento. No usar sinónimos coloquiales ni expresiones generales.

2. **Criterios de forma**:
   - La pregunta no debe depender del orden de las opciones.
     - Ejemplos inválidos: "¿Cuál es la primera?", "¿Cuál es la última?", etc.
   - No se permiten preguntas de memorización o sobre numeración de pasos.
     - Ejemplo inválido: "¿Cuál es el paso 5?"

3. **Criterios sobre la opción correcta**:
   - La **primera opción debe ser la única correcta**, sin marcarla como tal.
   - La opción correcta debe ser:
     - Clara y comprensible.
     - Exclusiva (que no haya ambigüedad con otras opciones).
     - Basada únicamente en el procedimiento técnico (no conocimiento externo).

4. **Criterios técnicos**:
   - Usar terminología técnica presente en el procedimiento.
   - **Evitar nombres de campos o lugares específicos** como "Campo Cupiagua", "Campo Cusiana", "Campo Floreña".
   - **No usar alias como "Águila", "Charly", "Tigre"**. Siempre escribir "Autoridad de Área Local".

5. **Criterios de dificultad**:
   - La opción correcta **no debe ser evidente**.
   - Las opciones incorrectas deben ser técnicamente plausibles y no absurdas o fáciles de descartar.
   - Toda la pregunta y sus opciones deben estar basadas en el contenido del procedimiento, no en conocimiento general del oficio.

No añadas ninguna explicación, encabezado ni comentario fuera del array JSON. No marques cuál es la opción correcta. Las cinco preguntas deben formar un **array JSON de objetos** con la siguiente estructura:

```json
[
  {
    "codigo_procedimiento": "PEP-PRO-1234",
    "version_proc": 1,
    "version_preg": 1,
    "prompt": "1.1",
    "tipo_proc": "TECNICO",
    "puntaje_ia": 0,
    "puntaje_e1": 0,
    "puntaje_e2": 0,
    "puntaje_e3": 0,
    "puntaje_e4": 0,
    "comentario_e1": "",
    "comentario_e2": "",
    "comentario_e3": "",
    "comentario_e4": "",
    "pregunta": "Texto de la pregunta",
    "opciones": [
      "Primera opción (correcta)",
      "Segunda opción (incorrecta)",
      "Tercera opción (incorrecta)",
      "Cuarta opción (incorrecta)"
    ],
    "historial_revision": []
  },
  ...
]

Todas las preguntas deben ser de selección múltiple con única respuesta correcta. Asegúrate de cumplir estrictamente todos los puntos anteriores. No repitas texto innecesario ni incluyas elementos no solicitados.
"""

# System message para validador 1 (estructura y forma)
VALIDATOR_ESTRUCTURA_SYSTEM_MESSAGE = """
Eres un validador automático de calidad para preguntas de selección múltiple con única respuesta correcta, utilizadas en pruebas técnicas para contextos laborales. Recibirás dos elementos:

1. Un procedimiento técnico completo proporcionado por el usuario.
2. Un conjunto de cinco preguntas en formato JSON, generadas previamente a partir del mismo procedimiento.

Debes evaluar cada pregunta de forma individual y emitir dos elementos por cada una:

- Un campo "puntaje_e1", con valor:
  - `1` si la pregunta cumple completamente los criterios especificados.
  - `0` si la pregunta **debe corregirse** por incumplimiento de alguno de los criterios.

- Un campo `comentario_e1`, con un **comentario breve y claro** (máximo 25 palabras) que indique cuál es el problema, si existe.

Tu evaluación debe enfocarse exclusivamente en los siguientes criterios:

1. **Neutralidad en el orden de opciones**:  
   - Las preguntas no deben depender del orden en que se presentan las opciones.  
   - Las frases como "¿Cuál es la primera?", "¿Cuál es la última?", "¿Cuál aparece al final?", o variantes similares, **no son válidas**.  
   - Las opciones deben poder aleatorizarse sin perder sentido o coherencia.

2. **Evitar preguntas de memoria**:
   - Las preguntas no deben basarse en recordar posiciones, listados o secuencias numéricas del procedimiento.  
   - Evita cualquier formulación que implique recordar datos exactos, numeraciones, pasos o listados en un orden particular.
   - No se permite preguntar por el primer paso, el paso cinco, el último ítem de un listado, etc.

No debes comentar sobre otros aspectos de la pregunta, como redacción, contenido técnico, errores conceptuales u otros. Tu función es **exclusivamente validar la forma**, según los dos criterios anteriores.

Tu salida debe ser un array JSON de cinco objetos, uno por cada pregunta, con la siguiente estructura:

[
  {"puntaje_e1": 1, "comentario_e1": ""},
  {"puntaje_e1": 0, "comentario_e1": "Pregunta depende del orden de opciones"},
  {"puntaje_e1": 1, "comentario_e1": ""},
  {"puntaje_e1": 0, "comentario_e1": "Pregunta basada en número de paso"},
  {"puntaje_e1": 1, "comentario_e1": ""}
]
"""

# System message para validador 2 (técnico - opción correcta)
VALIDATOR_TECNICO_SYSTEM_MESSAGE = """
Eres un validador automático para preguntas de selección múltiple con única respuesta correcta, utilizadas en pruebas técnicas laborales. Recibirás dos elementos:

1. Un procedimiento técnico completo proporcionado por el usuario.
2. Un conjunto de cinco preguntas en formato JSON, generadas previamente a partir del mismo procedimiento.

Tu tarea es evaluar si la primera opción de cada pregunta cumple con los criterios establecidos para ser considerada la única opción correcta. Por cada pregunta, debes devolver:

- Un campo "puntaje_e2" con valor:
  - `1` si la primera opción es **claramente correcta**, única y está respaldada por el procedimiento técnico.
  - `0` si **debe corregirse** porque no cumple alguno de los criterios.

- Un campo "comentario_e2" con una explicación breve (máximo 25 palabras) que indique la razón en caso de que la pregunta deba corregirse.

Los criterios a validar son:

1. **Primera opción correcta**:  
   La primera opción de cada pregunta debe ser **la única opción correcta** según el procedimiento técnico.

2. **Claridad de la opción correcta**:  
   La opción correcta debe estar **bien redactada, ser comprensible y precisa**, sin ambigüedades o formulaciones confusas.

3. **Unicidad de la respuesta correcta**:  
   Solo debe haber **una opción que pueda considerarse correcta**. Si más de una opción es técnicamente válida, la pregunta es inválida.

4. **Pertinencia al procedimiento**:  
   La opción correcta debe estar basada **únicamente en el contenido del procedimiento**.  
   No debe evaluarse conocimiento externo o general.

No debes comentar sobre la redacción general de la pregunta ni sobre las opciones incorrectas, salvo que estas generen ambigüedad respecto a la opción correcta.

Tu salida debe ser un array JSON de cinco objetos, uno por cada pregunta, con la siguiente estructura:

[
  {"puntaje_e2": 1, "comentario_e2": ""},
  {"puntaje_e2": 0, "comentario_e2": "Primera opción no es clara"},
  {"puntaje_e2": 0, "comentario_e2": "Más de una opción es válida"},
  {"puntaje_e2": 1, "comentario_e2": ""},
  {"puntaje_e2": 0, "comentario_e2": "Opción no está en el procedimiento"}
]
"""

# System message para validador 3 (vocabulario técnico)
VALIDATOR_DIFICULTAD_SYSTEM_MESSAGE = """
Eres un validador automático para preguntas de selección múltiple con única respuesta correcta, utilizadas en pruebas técnicas laborales. Recibirás dos elementos:

1. Un procedimiento técnico completo proporcionado por el usuario.
2. Un conjunto de cinco preguntas en formato JSON, generadas previamente a partir del mismo procedimiento.

Tu tarea es evaluar la **precisión técnica y el uso adecuado del lenguaje** en cada pregunta y sus opciones de respuesta. Por cada pregunta, debes devolver:

- Un campo "puntaje_e3" con valor:
  - `1` si la pregunta y sus opciones cumplen completamente los criterios técnicos.
  - `0` si la pregunta **debe corregirse** por incumplimiento de alguno de los criterios.

- Un campo "comentario_e3" con una explicación breve (máximo 25 palabras) si la pregunta requiere corrección.

Evalúa cada pregunta en función de los siguientes criterios:

1. **Uso de vocabulario técnico**:
   - La redacción debe incluir terminología técnica presente en el procedimiento técnico.
   - No se permite el uso de sinónimos coloquiales o lenguaje excesivamente general.

2. **Evitar nombres de lugares o campos específicos**:
   - No debe aparecer ninguna referencia a lugares concretos como: *Campo Cupiagua*, *Campo Cusiana*, *Campo Floreña*, u otros nombres propios geográficos.

3. **Sustitución de alias por cargo genérico**:
   - No se deben usar alias como *Águila*, *Charly*, o *Tigre* seguidos de un número (ej. "Águila 20").
   - Siempre se debe utilizar el término **Autoridad de Área Local** en su lugar.

No debes evaluar si la opción correcta es válida, ni comentar sobre el enfoque pedagógico o la forma de la pregunta. Tu única tarea es verificar la calidad técnica del contenido textual.

Tu salida debe ser un array JSON de cinco objetos, uno por cada pregunta, con la siguiente estructura:

[
  {"puntaje_e3": 1, "comentario_e3": ""},
  {"puntaje_e3": 0, "comentario_e3": "Usa Campo Cusiana"},
  {"puntaje_e3": 1, "comentario_e3": ""},
  {"puntaje_e3": 0, "comentario_e3": "Dice 'Águila 20', debe decir Autoridad de Área Local"},
  {"puntaje_e3": 0, "comentario_e3": "Falta vocabulario técnico del procedimiento"}
]
"""

# System message para validador 4 (dificultad)
VALIDATOR_CLARIDAD_SYSTEM_MESSAGE = """
Eres un validador automático de dificultad para preguntas de selección múltiple con única respuesta correcta, utilizadas en pruebas técnicas laborales. Recibirás dos elementos:

1. Un procedimiento técnico completo proporcionado por el usuario.
2. Un conjunto de cinco preguntas en formato JSON, generadas previamente a partir del mismo procedimiento.

Tu tarea es evaluar **la dificultad real** de cada pregunta y sus opciones de respuesta. Por cada pregunta, debes devolver:

- Un campo "puntaje_e4" con valor:
  - `1` si la pregunta presenta un nivel de dificultad adecuado.
  - `0` si la pregunta **debe corregirse** porque no cumple alguno de los criterios.

- Un campo "comentario_e4" con una explicación breve (máximo 25 palabras) que justifique la corrección, si es necesaria.

Evalúa cada pregunta en función de los siguientes criterios:

1. **La respuesta correcta no debe ser obvia**:
   - Las opciones incorrectas deben ser **verosímiles y técnicamente plausibles**.
   - No deben ser absurdas, incoherentes o fácilmente descartables por simple lógica o sentido común.
   - La pregunta debe requerir análisis del procedimiento, no simple reconocimiento superficial.

2. **Todo el contenido debe basarse en el procedimiento**:
   - Tanto la pregunta como las cuatro opciones deben estar **exclusivamente sustentadas en el contenido del procedimiento técnico**.
   - No se debe evaluar conocimiento técnico general ni sentido común del oficio. Solo lo que está descrito en el documento.

No evalúes aspectos de redacción, forma, orden de opciones ni terminología técnica. Solo evalúa la dificultad efectiva de la pregunta según los criterios anteriores.

Tu salida debe ser un array JSON de cinco objetos, uno por cada pregunta, con la siguiente estructura:

[
  {"puntaje_e4": 1, "comentario_e4": ""},
  {"puntaje_e4": 0, "comentario_e4": "Opción correcta es demasiado obvia"},
  {"puntaje_e4": 1, "comentario_e4": ""},
  {"puntaje_e4": 0, "comentario_e4": "Opciones incorrectas son fácilmente descartables"},
  {"puntaje_e4": 0, "comentario_e4": "Pregunta evalúa conocimiento técnico externo"}
]
"""

# System message para el corrector final
CORRECTOR_SYSTEM_MESSAGE = """
Eres un corrector automático de preguntas de selección múltiple con única respuesta correcta, utilizadas en pruebas técnicas laborales. Recibirás dos elementos:

1. El procedimiento técnico completo proporcionado por el usuario.
2. Un conjunto de cinco preguntas en formato JSON, generadas previamente a partir del procedimiento, que ya han sido evaluadas por cuatro validadores automáticos.

Cada pregunta contiene:

- Texto original de la pregunta y sus opciones.
- Los campos `puntaje_e1`, `puntaje_e2`, `puntaje_e3`, `puntaje_e4`, con valores 0 o 1.
- Los campos `comentario_e1`, `comentario_e2`, `comentario_e3`, `comentario_e4`, con observaciones breves si corresponde.
- El campo `version_preg`, que indica la versión actual de la pregunta.

Tu tarea es revisar **cada pregunta individualmente** y realizar correcciones **solo si al menos uno de los puntajes es 0**.

Cuando realices una corrección, debes:

1. Reescribir completamente la pregunta y/o sus opciones si es necesario.
2. Asegurarte de que la nueva versión cumpla con todos los criterios evaluados por los validadores.
3. Dejar la primera opción como la correcta (sin indicarlo).
4. Basarte exclusivamente en el contenido del procedimiento técnico.
5. **Aumentar en uno el valor de `version_preg`** si se realizó cualquier modificación a la pregunta o sus opciones.
6. Añadir una entrada al campo `historial_revision` con esta estructura:

```json
{
  "pregunta_original": "Texto original de la pregunta",
  "opciones_originales": [...],
  "motivo_revision": ["comentario_e1", "comentario_e3", ...] (solo los que tengan puntaje 0),
  "corregida_por": "IA"
}

Si la pregunta no requiere cambios (todos los puntajes son 1), déjala exactamente igual, sin modificar version_preg y sin agregar entradas al historial_revision.

La salida debe ser un array JSON de cinco objetos, con la misma estructura original, actualizados solo en caso de corrección.

No incluyas explicaciones adicionales, encabezados ni texto fuera del JSON. No repitas el procedimiento. No modifiques campos innecesarios.

Ejemplo de objeto corregido:

{
  "codigo_procedimiento": "PEP-PRO-1234",
  "version_proc": 1,
  "version_preg": 2,  ← (se incrementó desde 1)
  "prompt": "1.1",
  "tipo_proc": "TECNICO",
  "puntaje_ia": 0,
  "puntaje_e1": 1,
  "puntaje_e2": 0,
  "puntaje_e3": 1,
  "puntaje_e4": 0,
  "comentario_e1": "",
  "comentario_e2": "Opción correcta no es clara",
  "comentario_e3": "",
  "comentario_e4": "Opciones incorrectas son muy débiles",
  "pregunta": "Versión corregida de la pregunta",
  "opciones": [
    "Opción corregida correcta",
    "Opción incorrecta plausible",
    "Opción incorrecta plausible",
    "Opción incorrecta plausible"
  ],
  "historial_revision": [
    {
      "pregunta_original": "Texto original de la pregunta",
      "opciones_originales": [
        "Opción anterior 1",
        "Opción anterior 2",
        "Opción anterior 3",
        "Opción anterior 4"
      ],
      "motivo_revision": [
        "Opción correcta no es clara",
        "Opciones incorrectas son muy débiles"
      ],
      "corregida_por": "IA"
    }
  ]
}

Repite esta lógica para cada una de las cinco preguntas. La salida final debe ser un array JSON de cinco objetos (con la misma estructura que recibiste), actualizados según sea necesario.
"""

# =============================================================================
# CONFIGURACIÓN DE VALIDADORES
# =============================================================================

# Configuración específica para cada validador
VALIDATORS_CONFIG = {
    "estructura": {
        "enabled": True,
        "system_message": VALIDATOR_ESTRUCTURA_SYSTEM_MESSAGE,
        "weight": 1.0,
        "timeout": 30,
        "critical": True  # Si falla, detener el proceso
    },
    "tecnico": {
        "enabled": True,
        "system_message": VALIDATOR_TECNICO_SYSTEM_MESSAGE,
        "weight": 1.5,  # Peso mayor porque es más crítico
        "timeout": 45,
        "critical": True
    },
    "dificultad": {
        "enabled": True,
        "system_message": VALIDATOR_DIFICULTAD_SYSTEM_MESSAGE,
        "weight": 1.0,
        "timeout": 30,
        "critical": False  # Puede continuar aunque falle
    },
    "claridad": {
        "enabled": True,
        "system_message": VALIDATOR_CLARIDAD_SYSTEM_MESSAGE,
        "weight": 1.0,
        "timeout": 30,
        "critical": False
    }
}

# Umbral mínimo de validación (promedio ponderado)
VALIDATION_THRESHOLD = 0.7

# =============================================================================
# CONFIGURACIÓN DEL CORRECTOR
# =============================================================================

CORRECTOR_CONFIG = {
    "enabled": True,
    "system_message": CORRECTOR_SYSTEM_MESSAGE,
    "timeout": 60,
    "max_retries": 2,
    "apply_corrections_threshold": 0.6  # Solo corregir si la puntuación es menor a esto
}

# =============================================================================
# CONFIGURACIÓN DE DIRECTORIOS Y ARCHIVOS
# =============================================================================


BASE_DATA_DIR = BASE_DIR / "data"
# Directorios del módulo admin
ADMIN_DIRECTORIES = {
    "procedures_source": os.getenv("PROCEDURES_SOURCE_DIR", str(BASE_DATA_DIR / "procedures_source")),
    "tracking": str(BASE_DATA_DIR / "admin_tracking"),
    "backups": str(BASE_DATA_DIR / "admin_backups"), 
    "temp": str(BASE_DATA_DIR / "admin_temp"),
    "logs": "logs/admin"
}

# Archivos de tracking y control
ADMIN_FILES = {
    "tracking": str(BASE_DATA_DIR / "question_generation_tracking.json"),
    "processing_queue": str(BASE_DATA_DIR / "admin_processing_queue.json"),
    "validation_results": str(BASE_DATA_DIR / "admin_validation_results.json"),
    "correction_log": str(BASE_DATA_DIR / "admin_correction_log.json"),
    "generation_stats": str(BASE_DATA_DIR / "admin_generation_stats.json"),
    # ARCHIVOS PRINCIPALES
    "generated_questions": str(BASE_DATA_DIR / "generated_questions.json"),
    "excel_data": str(BASE_DATA_DIR / "procedimientos_y_preguntas.xlsx"),
    "excel_results": str(BASE_DATA_DIR / "resultados_evaluaciones.xlsx")
}

# =============================================================================
# CONFIGURACIÓN DE LOGGING
# =============================================================================

LOGGING_CONFIG = {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "file": "logs/admin_module.log",
    "max_size_mb": 50,
    "backup_count": 5,
    "console_output": True
}

# =============================================================================
# CONFIGURACIÓN DE MONITOREO Y MÉTRICAS
# =============================================================================

MONITORING_CONFIG = {
    "enable_metrics": True,
    "metrics_interval_seconds": 300,  # 5 minutos
    "performance_tracking": True,
    "error_tracking": True,
    "success_rate_alert_threshold": 0.8,
    "processing_time_alert_threshold": 600  # 10 minutos
}

# =============================================================================
# CONFIGURACIÓN DE BACKUP Y SINCRONIZACIÓN
# =============================================================================

BACKUP_CONFIG = {
    "enabled": True,
    "auto_backup_before_sync": True,
    "backup_retention_days": 30,
    "backup_compression": True,
    "backup_schedule": "daily",  # daily, weekly, manual
    "excel_sync_enabled": True,
    "excel_backup_before_update": True
}

# =============================================================================
# CONSTANTES DEL WORKFLOW
# =============================================================================

# Estados del workflow
WORKFLOW_STATES = [
    "pending",
    "generating", 
    "validating",
    "correcting",
    "completed",
    "failed",
    "skipped"
]

# Número de preguntas por procedimiento
QUESTIONS_PER_PROCEDURE = 5

# Número de validadores
NUMBER_OF_VALIDATORS = 4

# Tiempo máximo de procesamiento por lote (en minutos)
MAX_PROCESSING_TIME_MINUTES = 60

# =============================================================================
# FUNCIONES DE CONFIGURACIÓN
# =============================================================================

def ensure_admin_directories():
    """Crear todos los directorios necesarios para el módulo admin"""
    try:
        # Crear directorio base
        BASE_DATA_DIR.mkdir(parents=True, exist_ok=True)
        
        # Crear subdirectorios
        for key, path in ADMIN_DIRECTORIES.items():
            Path(path).mkdir(parents=True, exist_ok=True)
            
        print(f"✅ Directorios admin creados en: {BASE_DATA_DIR}")
        return True
        
    except Exception as e:
        print(f"❌ Error creando directorios admin: {e}")
        return False
    
def get_admin_file_path(file_key: str) -> Path:
    """
    Obtener ruta de archivo del módulo admin
    
    Args:
        file_key: Clave del archivo en ADMIN_FILES
        
    Returns:
        Path del archivo
    """
    if file_key not in ADMIN_FILES:
        raise ValueError(f"Archivo no encontrado: {file_key}")
    
    return Path(ADMIN_FILES[file_key])

def get_admin_directory_path(dir_key: str) -> Path:
    """
    Obtener ruta de directorio del módulo admin
    
    Args:
        dir_key: Clave del directorio en ADMIN_DIRECTORIES
        
    Returns:
        Path del directorio
    """
    if dir_key not in ADMIN_DIRECTORIES:
        raise ValueError(f"Directorio no encontrado: {dir_key}")
    
    return Path(ADMIN_DIRECTORIES[dir_key])

def get_system_message(component: str) -> str:
    """
    Obtener system message para un componente específico
    
    Args:
        component: 'generator', 'validator_estructura', 'validator_tecnico', 
                  'validator_dificultad', 'validator_claridad', 'corrector'
    """
    messages = {
        "generator": GENERATOR_SYSTEM_MESSAGE,
        "validator_estructura": VALIDATOR_ESTRUCTURA_SYSTEM_MESSAGE,
        "validator_tecnico": VALIDATOR_TECNICO_SYSTEM_MESSAGE,
        "validator_dificultad": VALIDATOR_DIFICULTAD_SYSTEM_MESSAGE,
        "validator_claridad": VALIDATOR_CLARIDAD_SYSTEM_MESSAGE,
        "corrector": CORRECTOR_SYSTEM_MESSAGE
    }
    
    if component not in messages:
        raise ValueError(f"Componente no válido: {component}. Disponibles: {list(messages.keys())}")
    
    return messages[component]

def get_validator_config(validator_type: str) -> Dict[str, Any]:
    """
    Obtener configuración para un validador específico
    """
    if validator_type not in VALIDATORS_CONFIG:
        raise ValueError(f"Validador no válido: {validator_type}. Disponibles: {list(VALIDATORS_CONFIG.keys())}")
    
    return VALIDATORS_CONFIG[validator_type]

def get_enabled_validators() -> List[str]:
    """
    Obtener lista de validadores habilitados
    """
    return [name for name, config in VALIDATORS_CONFIG.items() if config["enabled"]]

def validate_admin_config() -> bool:
    """Validar configuración del módulo admin"""
    try:
        print("🔧 Validando configuración del módulo admin...")
        
        # Verificar OpenAI API key
        if not get_openai_api_key():
            print("⚠️ OpenAI API Key no configurado (requerido para generación)")
        
        # Crear directorios necesarios
        ensure_admin_directories()
        
        # Verificar archivos existentes
        for key, path in ADMIN_FILES.items():
            file_path = Path(path)
            if file_path.exists():
                print(f"✅ {key}: {path}")
            else:
                print(f"📝 {key}: {path} (será creado)")
        
        print("✅ Configuración admin validada")
        return True
        
    except Exception as e:
        print(f"❌ Error validando configuración admin: {e}")
        return False
    
def get_openai_api_key() -> str:
    """Obtener API key de OpenAI"""
    return OPENAI_API_KEY

def get_current_timestamp() -> str:
    """Obtener timestamp actual en formato ISO"""
    from datetime import datetime
    return datetime.now().isoformat()

def create_tracking_key(codigo: str, version: str) -> str:
    """Crear clave única para tracking de procedimientos"""
    return f"{codigo}_v{version}"

def extract_procedure_code_and_version(filename: str) -> tuple[str, str]:
    """
    Extraer código y versión del nombre de archivo
    
    Args:
        filename: Nombre del archivo (ej: "PEP-PRO-1141_V.2.docx")
        
    Returns:
        tuple: (codigo, version)
    """
    # Remover extensión
    base_name = filename.replace('.docx', '').replace('.DOCX', '')
    
    # Buscar patrón de versión
    version = "1"  # Default
    codigo = base_name
    
    # Patrón: CODIGO_V.X o CODIGO V.X
    import re
    version_match = re.search(r'[_\s]V\.?(\d+)', base_name, re.IGNORECASE)
    if version_match:
        version = version_match.group(1)
        codigo = base_name[:version_match.start()]
    
    return codigo.strip(), version.strip()



# =============================================================================
# CONFIGURACIÓN DE DESARROLLO Y DEBUG
# =============================================================================

# Configuración para desarrollo/testing
DEBUG_CONFIG = {
    "enabled": True,
    "mock_openai_calls": False,  # Para testing sin usar API real
    "verbose_logging": True,
    "save_all_intermediate_results": True,
    "test_with_single_question": False  # Generar solo 1 pregunta para testing rápido
}

# Mensajes de prueba para testing sin OpenAI
MOCK_RESPONSES = {
    "generator": """[
  {
    "codigo_procedimiento": "TEST-001",
    "version_proc": 1,
    "version_preg": 1,
    "prompt": "1.1",
    "puntaje_ia": 0,
    "puntaje_e1": 0,
    "puntaje_e2": 0,
    "puntaje_e3": 0,
    "puntaje_e4": 0,
    "comentario_e1": "",
    "comentario_e2": "",
    "comentario_e3": "",
    "comentario_e4": "",
    "pregunta": "¿Cuál es el primer paso del procedimiento de prueba?",
    "opciones": [
      "Verificar condiciones iniciales",
      "Iniciar operación directamente", 
      "Contactar supervisor",
      "Revisar documentación"
    ],
    "historial_revision": []
  }
]""",
    "validator": '{"score": 1, "comment": "Pregunta estructuralmente correcta para testing"}',
    "corrector": """{"pregunta_corregida": "¿Cuál es el primer paso del procedimiento de prueba?", "opciones_corregidas": ["Verificar condiciones iniciales", "Iniciar operación directamente", "Contactar supervisor", "Revisar documentación"], "correcciones_aplicadas": {"estructura": "Ninguna", "tecnico": "Ninguna", "dificultad": "Ninguna", "claridad": "Ninguna"}, "resumen_cambios": "Sin cambios necesarios"}"""
}

if __name__ == "__main__":
    # Test de configuración
    print("🧪 Testing configuración del módulo admin...")
    validate_admin_config()