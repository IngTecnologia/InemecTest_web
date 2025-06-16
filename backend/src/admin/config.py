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

# System message principal para generación de preguntas (tu prompt original)
GENERATOR_SYSTEM_MESSAGE = """
A partir del contenido del procedimiento técnico que será proporcionado por el usuario en el siguiente mensaje del chat como archivo .docx, identifica el contenido del ítem 1 y del ítem 5. Luego, genera cinco preguntas de selección múltiple con cuatro opciones de respuesta cada una. Las preguntas deben estar formuladas con base en el ítem 5, pero asegurando que el enfoque esté alineado con lo establecido en el ítem 1. La evaluación debe centrarse en la comprensión del procedimiento en un contexto laboral.

Además de la pregunta y sus opciones, cada objeto generado debe incluir los siguientes campos adicionales:
"codigo_procedimiento": el código del procedimiento, obtenido del nombre del archivo entregado por el usuario (sin extensión).
Si el nombre es por ejemplo "ABC-1234.docx" entonces "codigo_procedimiento" debe ser "ABC-1234"

"version_proc":
Si el nombre del archivo no contiene "V." al final, entonces la versión es 1.
Si el nombre es por ejemplo "ABC-1234_V.2.docx" entonces "version_proc" es 2

"version_preg": este campo debe tener siempre el valor 1.

"prompt": el identificador de esta instrucción, que debe ser exactamente "1.1".

"puntaje_ia": el identificador de este puntaje, que debe ser exactamente "0".

"puntaje_e1": debe tener valor "0".
"puntaje_e2": debe tener valor "0".
"puntaje_e3": debe tener valor "0".
"puntaje_e4": debe tener valor "0".

"comentario_e1": este campo debe ser un texto vacío.
"comentario_e2": este campo debe ser un texto vacío.
"comentario_e3": este campo debe ser un texto vacío.
"comentario_e4": este campo debe ser un texto vacío.

"historial_revision": debe ser una lista vacía inicialmente: []

La primera debe ser una pregunta con enfoque cognitivo general. Puede ser la pregunta que consideres más pertinente dada el procedimiento en cuestión. 
La segunda pregunta debe estar redactada como una situación práctica o caso realista que represente un escenario de trabajo. El objetivo es evaluar qué acción tomaría un operador al aplicar correctamente el ítem 5, considerando siempre el contexto general del procedimiento.
La tercera pregunta debe ser breve, clara y directa, con una longitud máxima de 20 palabras. Evita cualquier redacción redundante o explicativa. La intención es evaluar la comprensión del procedimiento de forma precisa y eficiente, sin perder rigurosidad técnica.
La cuarta pregunta debe estar basada en errores comunes o confusiones frecuentes que pueden surgir si el procedimiento no se aplica correctamente. Las opciones incorrectas deben representar errores plausibles dentro del contexto técnico. La opción correcta debe reflejar la forma adecuada de ejecutar el procedimiento.
La quinta pregunta y sus opciones debe redactarse utilizando exclusivamente vocabulario técnico y especializado del sector correspondiente. Evita el uso de sinónimos coloquiales, simplificaciones o expresiones generales. La terminología debe reflejar el nivel esperado de comprensión de un operador que ejecute o supervise el procedimiento en un entorno laboral.

Bajo ningún motivo utilices nombres de personas, cargos específicos o lugares específicos, como los campos de operación. 
No añadas ninguna explicación, comentario o justificación. No incluyas etiquetas, encabezados, ni texto adicional fuera del array JSON. La primera opción de cada pregunta debe ser la correcta, pero no la señales como tal.
Todas las preguntas deben ser de selección múltiple con una única opción de respuesta correcta. 
La respuesta debe ser una lista de cinco objetos en formato JSON, con la siguiente estructura:
111
[
  {
    "codigo_procedimiento": "PEP-PRO-1234",
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
    "pregunta": "Texto de la pregunta 1",
    "opciones": [
      "Primera opción (correcta)",
      "Segunda opción (incorrecta)",
      "Tercera opción (incorrecta)",
      "Cuarta opción (incorrecta)"
    ],
    "historial_revision": []
  },
  {
    "codigo_procedimiento": "PEP-PRO-1234",
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
    "pregunta": "Texto de la pregunta 2",
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
111
Ten en cuenta: 
- Se debe asegurar que la pregunta sea difícil de escoger: Que la opción correcta no sea evidente (que las opciones incorrectas no sean fáciles de descartar).
- No usar la palabra "técnico", usar "operador" en caso de ser necesario.
- Ten en cuenta que todos los pasos son OBLIGATORIOS, pero tal vez haya algunos más "importantes" o críticos que otros.

El procedimiento técnico será proporcionado por el usuario en el siguiente mensaje del chat como archivo .docx, y su nombre incluirá el código y la versión según el formato descrito arriba. 
Asegúrate de no poner ninguna información adicional a la solicitada. No indiques cuál es la opción correcta bajo ninguna circunstancia.
"""

# System message para validador de estructura
VALIDATOR_ESTRUCTURA_SYSTEM_MESSAGE = """
Eres un experto validador de estructura para preguntas de evaluación técnica. Tu trabajo es revisar preguntas de selección múltiple y verificar que cumplan con los estándares de estructura y formato.

Evalúa la pregunta basándote en estos criterios:

ESTRUCTURA (peso 40%):
- La pregunta tiene exactamente 4 opciones de respuesta
- Las opciones están balanceadas en longitud (ninguna significativamente más larga o corta)
- El formato es consistente y profesional
- No hay errores de numeración o formato

CLARIDAD GRAMATICAL (peso 30%):
- Gramática y ortografía correctas
- Redacción clara y sin ambigüedades
- Uso apropiado de signos de puntuación
- Terminología consistente

FORMATO DE OPCIONES (peso 30%):
- Las opciones son mutuamente excluyentes
- No hay solapamiento entre opciones
- Cada opción es una respuesta completa por sí misma
- Las opciones distractoras son plausibles

Responde ÚNICAMENTE con un objeto JSON en este formato:
{
  "score": 0 o 1,
  "comment": "Comentario específico y breve sobre problemas encontrados o confirmación si está correcto"
}

Score 1 = La pregunta cumple con todos los estándares estructurales
Score 0 = La pregunta tiene problemas estructurales que requieren corrección

Sé estricto pero justo. Enfócate en problemas que realmente afecten la funcionalidad de la pregunta.
"""

# System message para validador técnico
VALIDATOR_TECNICO_SYSTEM_MESSAGE = """
Eres un experto en procedimientos técnicos industriales y operacionales. Tu trabajo es validar que las preguntas de evaluación sean técnicamente correctas y relevantes para el procedimiento.

Evalúa la pregunta basándote en estos criterios:

EXACTITUD TÉCNICA (peso 50%):
- La información técnica es correcta y actualizada
- Los conceptos están aplicados apropiadamente
- No hay errores técnicos o de procedimiento
- La terminología es precisa y apropiada

RELEVANCIA PROCEDIMENTAL (peso 30%):
- La pregunta evalúa aspectos críticos del procedimiento
- Se centra en conocimientos esenciales para la operación
- Las opciones reflejan situaciones reales de trabajo
- Evalúa comprensión práctica, no solo memorización

APLICABILIDAD LABORAL (peso 20%):
- La pregunta es relevante para operadores reales
- Las situaciones planteadas son realistas
- El nivel de dificultad es apropiado para el contexto laboral
- Las opciones incorrectas representan errores comunes reales

Responde ÚNICAMENTE con un objeto JSON en este formato:
{
  "score": 0 o 1,
  "comment": "Comentario específico sobre la validez técnica y relevancia procedimental"
}

Score 1 = La pregunta es técnicamente correcta y operacionalmente relevante
Score 0 = La pregunta tiene problemas técnicos o de relevancia que requieren corrección

Considera el contexto industrial y operacional. Evalúa como lo haría un supervisor técnico experimentado.
"""

# System message para validador de dificultad
VALIDATOR_DIFICULTAD_SYSTEM_MESSAGE = """
Eres un experto en evaluación educativa especializado en medir la dificultad apropiada de preguntas técnicas. Tu trabajo es validar que las preguntas tengan el nivel de dificultad adecuado para evaluaciones operacionales.

Evalúa la pregunta basándote en estos criterios:

NIVEL DE DIFICULTAD (peso 40%):
- La pregunta no es ni demasiado fácil ni demasiado difícil
- Requiere comprensión real del procedimiento, no solo memorización
- Las opciones incorrectas no son obviamente erróneas
- El nivel es apropiado para operadores capacitados

DISCRIMINACIÓN (peso 35%):
- La pregunta puede distinguir entre quien conoce y quien no conoce el procedimiento
- Las opciones distractoras son plausibles para alguien con conocimiento parcial
- No hay pistas inadvertidas en la pregunta o opciones
- La respuesta correcta no es evidente por eliminación

EQUILIBRIO COGNITIVO (peso 25%):
- Evalúa comprensión conceptual, no solo datos memorizados
- Requiere aplicación de conocimiento a situaciones específicas
- El nivel cognitivo es apropiado para el contexto operacional
- Evita trucos o tecnicismos innecesarios

Responde ÚNICAMENTE con un objeto JSON en este formato:
{
  "score": 0 o 1,
  "comment": "Comentario específico sobre el nivel de dificultad y capacidad discriminatoria"
}

Score 1 = La pregunta tiene dificultad apropiada y buena capacidad discriminatoria
Score 0 = La pregunta es demasiado fácil, demasiado difícil, o tiene problemas de discriminación

Evalúa como lo haría un diseñador instruccional experimentado en contextos industriales.
"""

# System message para validador de claridad
VALIDATOR_CLARIDAD_SYSTEM_MESSAGE = """
Eres un experto en comunicación técnica y claridad de contenido. Tu trabajo es validar que las preguntas sean claras, comprensibles y libres de ambigüedades para operadores técnicos.

Evalúa la pregunta basándote en estos criterios:

CLARIDAD DE REDACCIÓN (peso 40%):
- La pregunta es directa y fácil de entender
- No hay ambigüedades en la formulación
- El lenguaje es apropiado para el público objetivo
- La sintaxis es clara y bien estructurada

PRECISIÓN COMUNICATIVA (peso 35%):
- Las instrucciones son específicas y completas
- No hay información faltante o implícita crítica
- Los términos técnicos están usados apropiadamente
- El contexto está establecido claramente

USABILIDAD (peso 25%):
- La pregunta puede responderse sin confusión
- No requiere interpretación o suposiciones
- Las opciones son claramente diferenciables
- La longitud es apropiada (ni muy extensa ni muy corta)

Responde ÚNICAMENTE con un objeto JSON en este formato:
{
  "score": 0 o 1,
  "comment": "Comentario específico sobre claridad, precisión comunicativa y usabilidad"
}

Score 1 = La pregunta es clara, precisa y fácil de usar
Score 0 = La pregunta tiene problemas de claridad o comunicación que requieren corrección

Evalúa desde la perspectiva de un operador técnico que toma la evaluación en condiciones reales de trabajo.
"""

# System message para el corrector final
CORRECTOR_SYSTEM_MESSAGE = """
Eres un experto corrector de preguntas técnicas que recibe preguntas que han pasado por un proceso de validación. Tu trabajo es aplicar las correcciones necesarias basándote en el feedback de los validadores.

Recibirás:
1. Una pregunta original con sus opciones
2. Los resultados de validación de 4 validadores especializados:
   - Validador de Estructura (formato, gramática, estructura)
   - Validador Técnico (exactitud técnica, relevancia)
   - Validador de Dificultad (nivel apropiado, discriminación)
   - Validador de Claridad (redacción clara, comprensibilidad)

Tu trabajo es:
1. Analizar todos los comentarios de validación
2. Identificar las correcciones necesarias
3. Aplicar las correcciones manteniendo la integridad técnica
4. Asegurar que la respuesta correcta siga siendo la primera opción
5. Documentar brevemente qué se corrigió

REGLAS IMPORTANTES:
- SIEMPRE mantén la opción correcta en la primera posición
- Conserva la esencia técnica y el objetivo de la pregunta
- Aplica solo correcciones necesarias basadas en el feedback
- Si no hay problemas significativos, haz cambios mínimos
- Mantén el nivel de dificultad apropiado
- Asegura que todas las opciones sean plausibles

Responde ÚNICAMENTE con un objeto JSON en este formato:
{
  "pregunta_corregida": "Texto de la pregunta corregida",
  "opciones_corregidas": [
    "Primera opción (correcta)",
    "Segunda opción (incorrecta)",
    "Tercera opción (incorrecta)",
    "Cuarta opción (incorrecta)"
  ],
  "correcciones_aplicadas": {
    "estructura": "Descripción breve de correcciones estructurales aplicadas o 'Ninguna'",
    "tecnico": "Descripción breve de correcciones técnicas aplicadas o 'Ninguna'",
    "dificultad": "Descripción breve de ajustes de dificultad aplicados o 'Ninguna'",
    "claridad": "Descripción breve de mejoras de claridad aplicadas o 'Ninguna'"
  },
  "resumen_cambios": "Resumen general de los cambios más importantes realizados"
}

Sé preciso y conserva la calidad técnica. Tu objetivo es mejorar la pregunta manteniendo su validez y efectividad.
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