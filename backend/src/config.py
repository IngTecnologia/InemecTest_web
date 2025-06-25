"""
Configuración centralizada para InemecTest
Manejo de archivos Excel y configuración de columnas
"""

import os
from pathlib import Path
from typing import Dict, Any, List

# =============================================================================
# CONFIGURACIÓN DE ARCHIVOS EXCEL
# =============================================================================

# Detectar si estamos en Docker o desarrollo
if os.getenv("ENVIRONMENT") == "production" or os.path.exists("/app"):
    BASE_DIR = Path("/app")
else:
    BASE_DIR = Path(__file__).resolve().parents[1]

DATA_DIR = BASE_DIR / "data"

# Rutas de archivos Excel
EXCEL_FILES = {
    "data": {
        "path": DATA_DIR / "procedimientos_y_preguntas.xlsx",
    },
    "results": {
        "path": DATA_DIR / "resultados_evaluaciones.xlsx",
    }
}

# Configuración de hojas en el archivo de datos
DATA_SHEETS = {
    "procedures": {
        "name": "Procedimientos",
        "description": "Hoja con información de procedimientos"
    },
    "questions": {
        "name": "Preguntas",
        "description": "Hoja con preguntas para cada procedimiento"
    }
}

# Configuración de hojas en el archivo de resultados
RESULTS_SHEETS = {
    "evaluations": {
        "name": "Evaluaciones",
        "description": "Resultados principales de evaluaciones"
    },
    "answers": {
        "name": "Respuestas",
        "description": "Respuestas detalladas por pregunta"
    },
    "applied_knowledge": {
        "name": "Conocimiento_Aplicado",
        "description": "Resultados de evaluación práctica"
    },
    "feedback": {
        "name": "Feedback",
        "description": "Observaciones y sugerencias"
    }
}

# =============================================================================
# MAPEO DE COLUMNAS - ARCHIVO DE DATOS
# =============================================================================

# Columnas para hoja de Procedimientos
PROCEDURES_COLUMNS = {
    "codigo": "A",           # Código del procedimiento (ej: OP-001)
    "nombre": "B",           # Nombre del procedimiento
    "alcance": "C",          # Alcance del procedimiento
    "objetivo": "D",         # Objetivo del procedimiento
    "version": "E",          # Versión del procedimiento
    "edicion": "F",          # Edición del procedimiento
    "disciplina": "G",       # Disciplina del procedimiento
    "recursos_requeridos": "H",  # Recursos requeridos
    "elementos_proteccion": "I", # Elementos de protección personal
    "descripcion_actividades": "J", # Descripción completa de actividades
    "tipo_procedimiento": "K",   # Tipo de procedimiento (OPERATIVO/TECNICO/ADMINISTRATIVO)
    "campo": "L"             # Campo de aplicación del procedimiento
}

# Columnas para hoja de Preguntas
QUESTIONS_COLUMNS = {
    "procedure_codigo": "A",  # Código del procedimiento al que pertenece
    "question_text": "B",    # Texto de la pregunta
    "option_a": "C",         # Opción A
    "option_b": "D",         # Opción B
    "option_c": "E",         # Opción C
    "option_d": "F"         # Opción D
}

# =============================================================================
# MAPEO DE COLUMNAS - ARCHIVO DE RESULTADOS
# =============================================================================

# Columnas para hoja de Evaluaciones
EVALUATIONS_COLUMNS = {
    "evaluation_id": "A",     # ID único de la evaluación
    "nombre": "B",            # Nombre del evaluado
    "cargo": "C",             # Cargo del evaluado
    "campo": "D",             # Campo (Cusiana, Cupiagua, etc.)
    "procedure_codigo": "E",  # Código del procedimiento evaluado
    "procedure_nombre": "F",  # Nombre del procedimiento
    "total_questions": "G",   # Total de preguntas
    "correct_answers": "H",   # Respuestas correctas
    "score_percentage": "I",  # Porcentaje de aciertos
    "aprobo": "J",           # Si aprobó o no
    "started_at": "K",       # Fecha/hora de inicio
    "completed_at": "L"      # Fecha/hora de finalización
}

# Columnas para hoja de Respuestas
ANSWERS_COLUMNS = {
    "evaluation_id": "A",     # ID de la evaluación
    "question_id": "B",       # Número de pregunta (1, 2, 3, etc.)
    "question_text": "C",    # Texto de la pregunta
    "selected_option": "D",   # Opción seleccionada (A, B, C, D)
    "selected_text": "E",    # Texto de la opción seleccionada
    "correct_option": "F",    # Opción correcta
    "correct_text": "G",     # Texto de la opción correcta
    "is_correct": "H"        # Si la respuesta fue correcta
}

# Columnas para hoja de Conocimiento Aplicado
APPLIED_KNOWLEDGE_COLUMNS = {
    "evaluation_id": "A",
    "describio_procedimiento": "B",
    "identifico_riesgos": "C", 
    "identifico_epp": "D",
    "describio_incidentes": "E"
}

# Columnas para hoja de Feedback
FEEDBACK_COLUMNS = {
    "evaluation_id": "A",
    "hizo_sugerencia": "B",
    "cual_sugerencia": "C",
    "requiere_entrenamiento": "D"
}

# =============================================================================
# CONFIGURACIÓN DE VALIDACIÓN
# =============================================================================

# Valores válidos para campos
VALID_CAMPOS = ["Cusiana", "Cupiagua", "Floreña", "Transversal"]
VALID_OPTIONS = ["A", "B", "C", "D"]
VALID_SI_NO = ["Sí", "No"]

# Configuración de validación de archivos
FILE_VALIDATION = {
    "max_file_size_mb": 50,
    "required_extensions": [".xlsx", ".xls"],
    "backup_enabled": True,
    "backup_directory": DATA_DIR / "backups"
}

# =============================================================================
# CONFIGURACIÓN DE LA API
# =============================================================================

API_CONFIG = {
    "title": "InemecTest API",
    "description": "API para sistema de evaluación basado en Excel",
    "version": "2.0.0",
    "host": "0.0.0.0",
    "port": 8000,
    "cors_origins": ["*"],  # Permitir todos los orígenes para acceso remoto
    "upload_folder": "uploads/",
    "temp_folder": "temp/"
}

# =============================================================================
# FUNCIONES AUXILIARES
# =============================================================================

def get_data_file_path() -> Path:
    """Obtener ruta del archivo de datos"""
    return Path(EXCEL_FILES["data"]["path"])

def get_results_file_path() -> Path:
    """Obtener ruta del archivo de resultados"""
    return Path(EXCEL_FILES["results"]["path"])

def ensure_data_directory():
    """Crear directorio de datos si no existe"""
    data_dir = DATA_DIR
    data_dir.mkdir(exist_ok=True)
    
    # Crear subdirectorios
    backup_dir = Path(FILE_VALIDATION["backup_directory"])
    backup_dir.mkdir(exist_ok=True)
    
    temp_dir = Path(API_CONFIG["temp_folder"])
    temp_dir.mkdir(exist_ok=True)
    
    upload_dir = Path(API_CONFIG["upload_folder"])
    upload_dir.mkdir(exist_ok=True)

def get_column_letter_to_index(column_letter: str) -> int:
    """Convertir letra de columna a índice (A=0, B=1, etc.)"""
    return ord(column_letter.upper()) - ord('A')

def get_index_to_column_letter(index: int) -> str:
    """Convertir índice a letra de columna (0=A, 1=B, etc.)"""
    return chr(ord('A') + index)

def replace_dynamic_content(text: str, procedure_data: Dict[str, Any]) -> str:
    """Reemplazar contenido dinámico en textos del formulario"""
    replacements = {
        "{CODIGO_NOMBRE}": f"({procedure_data.get('codigo', '')}-{procedure_data.get('nombre', '')})",
        "{ALCANCE}": procedure_data.get('alcance', ''),
        "{OBJETIVO}": procedure_data.get('objetivo', '')
    }
    
    result = text
    for placeholder, value in replacements.items():
        result = result.replace(placeholder, value)
    
    return result

def get_form_text(section: str, key: str = None, procedure_data: Dict[str, Any] = None) -> str:
    """Obtener texto del formulario con reemplazo dinámico"""
    try:
        if key:
            text = FORM_TEXTS[section][key]
        else:
            text = FORM_TEXTS[section]
        
        if procedure_data and isinstance(text, str):
            text = replace_dynamic_content(text, procedure_data)
        
        return text
    except KeyError:
        return f"Texto no encontrado: {section}.{key if key else ''}"

def validate_config():
    """Validar configuración al iniciar la aplicación"""
    try:
        # Verificar que las rutas de archivos son válidas
        data_path = get_data_file_path()
        results_path = get_results_file_path()
        
        # Crear directorios necesarios
        ensure_data_directory()
        
        print("✅ Configuración validada correctamente")
        print(f"📁 Archivo de datos: {data_path}")
        print(f"📁 Archivo de resultados: {results_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en configuración: {e}")
        return False

# =============================================================================
# CONFIGURACIÓN DE LOGGING
# =============================================================================

LOGGING_CONFIG = {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "file": "logs/inemectest.log"
}

# =============================================================================
# TEXTOS DE INFORMACIÓN DEL FORMULARIO
# =============================================================================

FORM_TEXTS = {
    "objective": {
        "title": "1. Objetivo",
        "content": "Definir el propósito del procedimiento integrando el objetivo, el alcance y el valor agregado que aporta al colaborador. Este documento garantiza que el personal cuente con los conocimientos técnicos necesarios para ejecutar las actividades de manera adecuada, asegurando el cumplimiento de las Guías de Entrenamiento y evaluación, y fortaleciendo el proceso de comunicación del procedimiento {CODIGO_NOMBRE}."
    },
    "development": {
        "title": "2. Desarrollo",
        "content": "{ALCANCE}"  # Se reemplazará con el alcance del procedimiento
    },
    "training_topic": {
        "title": "2.1. Tema de entrenamiento",
        "content": "{CODIGO_NOMBRE}"  # Se reemplazará con código y nombre del procedimiento
    },
    "how_to_learn": {
        "title": "2.2. Cómo aprender:",
        "item_1": "Lea el manual técnico del equipo, planos, diagramas de tuberías e instrumentación (P&ID), normatividad y los documentos de referencia (Relacionar el ítem 8 del procedimiento)",
        "item_2": "Realizar las formaciones de nivel conciencia según el anexo del Plan de Formación proporcionado por el supervisor de disciplina (según corresponda), complementándolas con prácticas en campo junto al técnico líder o supervisor, garantizando la validación del aprendizaje mediante visitas en campo, listas de verificación y auditorías."
    },
    "knowledge_evaluation": {
        "title": "2.3. Evaluación de Conocimiento",
        "instruction": "Responda las siguientes preguntas, en caso de dudas consulte con su supervisor:"
    },
    "applied_knowledge": {
        "title": "2.4. Evaluación de conocimiento aplicado",
        "instruction": "Ubique en la carpeta OneDrive (Procedimientos CUS-CUP-FLO) con acceso compartido el procedimiento (Código-nombre) y siga las indicaciones descritas a continuación:",
        "item_1": "Describa de forma verbal e interactúe con el supervisor del área o tutor en que consiste el procedimiento",
        "item_2": "Identifique riesgos de la operación descrita en el procedimiento",
        "item_3": "¿Cuáles EPP deben usar los ejecutantes o el personal que desarrolla la actividad?",
        "item_4": "En caso de presentarse un incidente operacional durante el desarrollo de la tarea, describa el procedimiento que usted aplicaría para atenderlo."
    },
    "observations": {
        "title": "2.5. Observaciones (mejoras al procedimiento y/o condiciones Sub-estándar):",
        "suggestion_question": "¿Se hizo alguna sugerencia acerca del procedimiento?",
        "suggestion_detail": "¿Cuál?",
        "suggestion_placeholder": "Describa la sugerencia..."
    },
    "verification": {
        "title": "2.6. Verificación del conocimiento de la operación o actividad a realizar:",
        "approval_question": "¿Aprobó?",
        "training_question": "¿En qué se requiere entrenamiento?",
        "training_placeholder": "Describa los temas que requieren entrenamiento adicional..."
    },
    "final_verification": {
        "title": "2.8. Verificación del conocimiento de la operación o actividad a realizar:",
        "instruction": "Registre la información en el plan de comunicación y entrenamiento."
    }
}

# Textos para la interfaz de usuario
UI_TEXTS = {
    "app_title": "InemecTest",
    "app_subtitle": "Sistema de Evaluación de Conocimientos Técnicos",
    "user_data": {
        "title": "Datos del Usuario",
        "nombre_label": "Nombre:",
        "nombre_placeholder": "Ingrese su nombre completo",
        "cargo_label": "Cargo:",
        "cargo_placeholder": "Ingrese su cargo",
        "campo_label": "Campo:",
        "campo_placeholder": "Seleccione un campo"
    },
    "buttons": {
        "continue": "Continuar",
        "previous": "Anterior",
        "continue_knowledge": "Continuar a Evaluación de Conocimiento",
        "continue_applied": "Continuar a Conocimiento Aplicado",
        "continue_observations": "Continuar a Observaciones",
        "complete_evaluation": "Completar Evaluación"
    },
    "messages": {
        "evaluation_completed": "Evaluación completada exitosamente!",
        "data_in_console": "(Los datos se muestran en la consola del navegador)",
        "loading": "Cargando...",
        "error_loading": "Error cargando datos",
        "select_all_required": "Debe completar todos los campos requeridos"
    }
}

# Mensajes de validación
VALIDATION_MESSAGES = {
    "required_field": "Este campo es obligatorio",
    "invalid_option": "Opción no válida",
    "invalid_file": "Archivo no válido",
    "file_too_large": "El archivo es demasiado grande",
    "invalid_format": "Formato de archivo no válido",
    "missing_data": "Faltan datos requeridos",
    "invalid_procedure_code": "Código de procedimiento no válido",
    "no_questions_found": "No se encontraron preguntas para este procedimiento"
}

# =============================================================================
# CONFIGURACIÓN DE BACKUP
# =============================================================================

BACKUP_CONFIG = {
    "enabled": True,
    "frequency": "daily",  # daily, weekly, monthly
    "retention_days": 30,
    "compress": True
}