"""
Modelos de datos específicos para el módulo administrativo de InemecTest
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# =============================================================================
# ENUMS ESPECÍFICOS DEL MÓDULO ADMIN
# =============================================================================

class ProcedureStatus(str, Enum):
    """Estados del procedimiento en el flujo de generación"""
    # Estados principales para la cola
    nuevo = "nuevo"  # Procedimiento sin preguntas generadas
    ya_procesado = "ya_procesado"  # Procedimiento con preguntas generadas
    necesita_reproceso = "necesita_reproceso"  # Procedimiento que falló y necesita reproceso
    
    # Estados heredados del sistema anterior (mantener compatibilidad)
    nuevo_procedimiento = "nuevo_procedimiento"
    nueva_version = "nueva_version"
    necesita_preguntas = "necesita_preguntas"
    pending = "pending"
    generating = "generating"
    validating = "validating"
    correcting = "correcting"
    completed = "completed"
    failed = "failed"
    skipped = "skipped"

class QuestionStatus(str, Enum):
    """Estados de una pregunta individual"""
    generated = "generated"
    validating = "validating"
    needs_correction = "needs_correction"
    correcting = "correcting"
    completed = "completed"
    failed = "failed"

class ValidatorType(str, Enum):
    """Tipos de validadores"""
    estructura = "estructura"
    tecnico = "tecnico"
    dificultad = "dificultad"
    claridad = "claridad"

# =============================================================================
# MODELOS DE PROCEDIMIENTOS Y ARCHIVOS
# =============================================================================

class ScannedProcedure(BaseModel):
    """Procedimiento escaneado desde archivo .docx"""
    # Campos básicos compatibles con Excel
    codigo: str = Field(..., description="Código del procedimiento")
    nombre: str = Field(..., description="Nombre del procedimiento")
    alcance: str = Field("", description="Alcance del procedimiento")  # ✅ Default vacío
    objetivo: str = Field("", description="Objetivo del procedimiento")  # ✅ Default vacío
    
    # Información adicional del archivo
    version: str = Field(..., description="Versión del procedimiento")
    edicion: str = Field("", description="Edición del procedimiento")
    archivo: str = Field(..., description="Nombre del archivo")
    ruta_completa: str = Field(..., description="Ruta completa del archivo")
    fecha_escaneado: str = Field(..., description="Fecha de escaneo")
    
    # Información técnica adicional - TODOS OPCIONALES
    disciplina: str = Field("", description="Disciplina del procedimiento")
    recursos_requeridos: str = Field("", description="Recursos requeridos")
    elementos_proteccion: str = Field("", description="Elementos de protección personal")
    descripcion_actividades: str = Field("", description="Descripción completa de actividades")
    
    # Información de procesamiento
    error: Optional[str] = Field(None, description="Error durante procesamiento")

class QueueItem(BaseModel):
    """Item en la cola de generación"""
    codigo: str = Field(..., description="Código del procedimiento")
    nombre: str = Field(..., description="Nombre del procedimiento")
    version: str = Field(..., description="Versión")
    archivo: str = Field(..., description="Nombre del archivo")
    estado: ProcedureStatus = Field(..., description="Estado del procedimiento")
    tracking_key: str = Field(..., description="Clave única para tracking")
    datos_completos: ScannedProcedure = Field(..., description="Datos completos del procedimiento")
    fecha_agregado: Optional[str] = Field(None, description="Fecha de agregado a cola")
    prioridad: int = Field(1, description="Prioridad (1=alta, 5=baja)")
    
    # Nuevos campos para el manejo de estados
    preguntas_generadas: int = Field(0, description="Número de preguntas ya generadas")
    puede_generar: bool = Field(True, description="Si se puede generar preguntas (botón Generar)")
    puede_regenerar: bool = Field(False, description="Si se puede regenerar preguntas (botón Regenerar)")

class ScanResult(BaseModel):
    """Resultado de un escaneo de directorio"""
    success: bool = Field(..., description="Si el escaneo fue exitoso")
    message: str = Field(..., description="Mensaje del resultado")
    archivos_encontrados: int = Field(..., description="Número de archivos encontrados")
    procedimientos_nuevos: int = Field(..., description="Procedimientos sin preguntas generadas")
    procedimientos_ya_procesados: int = Field(..., description="Procedimientos con preguntas generadas")
    total_procedimientos: int = Field(..., description="Total de procedimientos en cola")
    cola_generacion: List[QueueItem] = Field(..., description="Items en cola de generación")
    tracking_file: str = Field(..., description="Ruta del archivo de tracking")
    timestamp: str = Field(..., description="Timestamp del escaneo")

# =============================================================================
# MODELOS DE PREGUNTAS EN PROCESO
# =============================================================================

class ValidationResult(BaseModel):
    """Resultado de validación de un validador específico"""
    validator_type: ValidatorType = Field(..., description="Tipo de validador")
    score: int = Field(..., ge=0, le=1, description="Puntuación 0 o 1")
    comment: str = Field("", description="Comentario del validador")
    timestamp: str = Field(..., description="Timestamp de la validación")
    model_used: str = Field("gpt-4o", description="Modelo usado para validación")

class QuestionInProcess(BaseModel):
    """Pregunta en proceso de generación/validación/corrección"""
    # Identificación
    id: str = Field(..., description="ID único de la pregunta")
    procedure_codigo: str = Field(..., description="Código del procedimiento")
    procedure_version: str = Field(..., description="Versión del procedimiento")
    
    # Contenido de la pregunta
    pregunta: str = Field(..., description="Texto de la pregunta")
    opciones: List[str] = Field(..., description="Lista de 4 opciones")
    
    # Metadatos de generación (compatibles con tu formato actual)
    version_preg: int = Field(1, description="Versión de la pregunta")
    prompt: str = Field("1.1", description="Identificador del prompt usado")
    puntaje_ia: int = Field(0, description="Puntaje inicial de IA")
    
    # Resultados de validación
    validations: List[ValidationResult] = Field(default_factory=list, description="Resultados de validación")
    
    # Estado y timestamps
    status: QuestionStatus = Field(QuestionStatus.generated, description="Estado actual")
    created_at: str = Field(..., description="Timestamp de creación")
    updated_at: str = Field(..., description="Timestamp de última actualización")
    
    # Historial de revisiones
    historial_revision: List[str] = Field(default_factory=list, description="Historial de cambios")

class QuestionBatch(BaseModel):
    """Lote de 5 preguntas para un procedimiento"""
    batch_id: str = Field(..., description="ID único del lote")
    procedure_codigo: str = Field(..., description="Código del procedimiento")
    procedure_version: str = Field(..., description="Versión del procedimiento")
    procedure_name: str = Field(..., description="Nombre del procedimiento")
    
    questions: List[QuestionInProcess] = Field(..., description="5 preguntas del lote")
    
    # Estado del lote
    status: ProcedureStatus = Field(ProcedureStatus.pending, description="Estado del lote")
    created_at: str = Field(..., description="Timestamp de creación")
    updated_at: str = Field(..., description="Timestamp de última actualización")
    
    # Métricas del lote
    total_questions: int = Field(5, description="Total de preguntas (siempre 5)")
    questions_completed: int = Field(0, description="Preguntas completadas")
    validation_score: float = Field(0.0, description="Puntuación promedio de validación")

# =============================================================================
# MODELOS DE CONFIGURACIÓN Y CONTROL
# =============================================================================

class GenerationConfig(BaseModel):
    """Configuración para generación de preguntas"""
    openai_model: str = Field("gpt-4o", description="Modelo de OpenAI a usar")
    max_retries: int = Field(3, description="Máximo número de reintentos")
    timeout_seconds: int = Field(60, description="Timeout por request")
    batch_size: int = Field(5, description="Tamaño del lote de procesamiento")
    rate_limit_enabled: bool = Field(True, description="Si aplicar rate limiting")

class SystemPrompts(BaseModel):
    """Prompts del sistema para cada componente"""
    generator: str = Field(..., description="Prompt para generación de preguntas")
    validator_estructura: str = Field(..., description="Prompt para validador de estructura")
    validator_tecnico: str = Field(..., description="Prompt para validador técnico")
    validator_dificultad: str = Field(..., description="Prompt para validador de dificultad")
    validator_claridad: str = Field(..., description="Prompt para validador de claridad")
    corrector: str = Field(..., description="Prompt para corrector final")

# =============================================================================
# MODELOS DE ESTADÍSTICAS Y MONITOREO
# =============================================================================

class GenerationStats(BaseModel):
    """Estadísticas de generación"""
    total_procedures_scanned: int = Field(0, description="Total de procedimientos escaneados")
    procedures_in_queue: int = Field(0, description="Procedimientos en cola")
    procedures_generating: int = Field(0, description="Procedimientos generando")
    procedures_validating: int = Field(0, description="Procedimientos en validación")
    procedures_correcting: int = Field(0, description="Procedimientos en corrección")
    procedures_completed: int = Field(0, description="Procedimientos completados")
    procedures_failed: int = Field(0, description="Procedimientos fallidos")
    
    total_questions_generated: int = Field(0, description="Total de preguntas generadas")
    total_questions_validated: int = Field(0, description="Total de preguntas validadas")
    total_questions_corrected: int = Field(0, description="Total de preguntas corregidas")
    
    avg_generation_time_minutes: float = Field(0.0, description="Tiempo promedio de generación")
    avg_validation_score: float = Field(0.0, description="Puntuación promedio de validación")
    success_rate_percentage: float = Field(0.0, description="Tasa de éxito")
    
    last_scan_date: Optional[str] = Field(None, description="Fecha del último escaneo")
    last_generation_date: Optional[str] = Field(None, description="Fecha de la última generación")

class ProcessingProgress(BaseModel):
    """Progreso de procesamiento en tiempo real"""
    batch_id: str = Field(..., description="ID del lote en procesamiento")
    procedure_codigo: str = Field(..., description="Código del procedimiento")
    current_step: str = Field(..., description="Paso actual")
    total_steps: int = Field(..., description="Total de pasos")
    completed_steps: int = Field(..., description="Pasos completados")
    progress_percentage: float = Field(..., description="Porcentaje de progreso")
    estimated_time_remaining: Optional[str] = Field(None, description="Tiempo estimado restante")
    current_status: str = Field(..., description="Estado actual detallado")
    started_at: str = Field(..., description="Timestamp de inicio")
    last_update: str = Field(..., description="Último update")

# =============================================================================
# MODELOS DE RESPUESTA API
# =============================================================================

class AdminResponse(BaseModel):
    """Respuesta genérica del módulo admin"""
    success: bool = Field(..., description="Si la operación fue exitosa")
    message: str = Field(..., description="Mensaje de respuesta")
    data: Optional[Any] = Field(None, description="Datos de la respuesta")
    timestamp: str = Field(..., description="Timestamp de la respuesta")

class QueueResponse(BaseModel):
    """Respuesta específica para operaciones de cola"""
    queue_items: List[QueueItem] = Field(..., description="Items en la cola")
    total_pending: int = Field(..., description="Total de items pendientes")
    status_summary: Dict[str, int] = Field(..., description="Resumen por estado")
    last_scan: Optional[str] = Field(None, description="Fecha del último escaneo")

class GenerationStartResponse(BaseModel):
    """Respuesta al iniciar generación"""
    batch_id: str = Field(..., description="ID del lote iniciado")
    procedures_to_process: int = Field(..., description="Procedimientos a procesar")
    estimated_time_minutes: int = Field(..., description="Tiempo estimado en minutos")
    started_at: str = Field(..., description="Timestamp de inicio")

class ValidationSummary(BaseModel):
    """Resumen de validación para una pregunta"""
    question_id: str = Field(..., description="ID de la pregunta")
    total_validators: int = Field(4, description="Total de validadores")
    validators_passed: int = Field(..., description="Validadores que pasaron")
    average_score: float = Field(..., description="Puntuación promedio")
    needs_correction: bool = Field(..., description="Si necesita corrección")
    main_issues: List[str] = Field(..., description="Principales problemas encontrados")

class BatchValidationSummary(BaseModel):
    """Resumen de validación para un lote completo"""
    batch_id: str = Field(..., description="ID del lote")
    procedure_codigo: str = Field(..., description="Código del procedimiento")
    total_questions: int = Field(5, description="Total de preguntas")
    questions_passed: int = Field(..., description="Preguntas que pasaron validación")
    questions_need_correction: int = Field(..., description="Preguntas que necesitan corrección")
    overall_score: float = Field(..., description="Puntuación general del lote")
    validation_details: List[ValidationSummary] = Field(..., description="Detalles por pregunta")

# =============================================================================
# MODELOS PARA TRACKING Y AUDITORÍA
# =============================================================================

class TrackingEntry(BaseModel):
    """Entrada en el sistema de tracking"""
    tracking_key: str = Field(..., description="Clave única de tracking")
    codigo: str = Field(..., description="Código del procedimiento")
    version: str = Field(..., description="Versión del procedimiento")
    status: str = Field(..., description="Estado actual")
    fecha_creacion: str = Field(..., description="Fecha de creación")
    fecha_actualizacion: str = Field(..., description="Fecha de última actualización")
    preguntas_count: int = Field(0, description="Número de preguntas generadas")
    validation_score: float = Field(0.0, description="Puntuación de validación")
    processing_time_minutes: float = Field(0.0, description="Tiempo de procesamiento")
    errors: List[str] = Field(default_factory=list, description="Errores encontrados")

class AuditLog(BaseModel):
    """Log de auditoría para el sistema"""
    id: str = Field(..., description="ID único del log")
    timestamp: str = Field(..., description="Timestamp del evento")
    action: str = Field(..., description="Acción realizada")
    component: str = Field(..., description="Componente que realizó la acción")
    procedure_codigo: Optional[str] = Field(None, description="Código del procedimiento afectado")
    details: Dict[str, Any] = Field(..., description="Detalles adicionales")
    success: bool = Field(..., description="Si la acción fue exitosa")
    error_message: Optional[str] = Field(None, description="Mensaje de error si falló")

# =============================================================================
# MODELOS DE CONFIGURACIÓN AVANZADA
# =============================================================================

class OpenAIConfig(BaseModel):
    """Configuración específica de OpenAI"""
    api_key: str = Field(..., description="API Key de OpenAI")
    model: str = Field("gpt-4o", description="Modelo a usar")
    temperature: float = Field(0.3, description="Temperatura para generación")
    max_tokens: int = Field(4000, description="Máximo número de tokens")
    request_timeout: int = Field(60, description="Timeout por request")
    max_retries: int = Field(3, description="Máximo número de reintentos")
    rate_limit_rpm: int = Field(50, description="Rate limit requests per minute")

class AdminModuleConfig(BaseModel):
    """Configuración completa del módulo admin"""
    openai: OpenAIConfig = Field(..., description="Configuración de OpenAI")
    procedures_source_dir: str = Field("data/procedures_source", description="Directorio de procedimientos")
    tracking_file: str = Field("data/question_generation_tracking.json", description="Archivo de tracking")
    backup_enabled: bool = Field(True, description="Si crear backups automáticos")
    backup_directory: str = Field("data/backups", description="Directorio de backups")
    processing_batch_size: int = Field(5, description="Tamaño del lote de procesamiento")
    validation_threshold: float = Field(0.7, description="Umbral mínimo de validación")
    auto_correction_enabled: bool = Field(True, description="Si aplicar corrección automática")
    excel_sync_enabled: bool = Field(True, description="Si sincronizar con Excel automáticamente")

# =============================================================================
# MODELOS PARA OPERACIONES ESPECÍFICAS
# =============================================================================

class ProcedureRemovalRequest(BaseModel):
    """Request para remover procedimiento de cola"""
    codigo: str = Field(..., description="Código del procedimiento")
    version: str = Field(..., description="Versión del procedimiento")
    reason: str = Field("manual_removal", description="Razón de la remoción")

class BatchProcessingRequest(BaseModel):
    """Request para procesar lote de procedimientos"""
    procedure_codes: List[str] = Field(..., description="Códigos de procedimientos a procesar")
    priority: int = Field(1, description="Prioridad del procesamiento")
    force_regeneration: bool = Field(False, description="Forzar regeneración si ya existe")
    validation_enabled: bool = Field(True, description="Si aplicar validación")
    correction_enabled: bool = Field(True, description="Si aplicar corrección")

class QuestionCorrectionRequest(BaseModel):
    """Request para corrección manual de pregunta"""
    question_id: str = Field(..., description="ID de la pregunta")
    corrected_question: str = Field(..., description="Pregunta corregida")
    corrected_options: List[str] = Field(..., description="Opciones corregidas")
    correction_notes: str = Field(..., description="Notas de la corrección")
    corrected_by: str = Field("manual", description="Quien realizó la corrección")

class ExcelSyncRequest(BaseModel):
    """Request para sincronización con Excel"""
    batch_ids: Optional[List[str]] = Field(None, description="IDs de lotes específicos a sincronizar")
    force_update: bool = Field(False, description="Forzar actualización incluso si existe")
    create_backup: bool = Field(True, description="Crear backup antes de sincronizar")

# =============================================================================
# FUNCIONES DE VALIDACIÓN Y UTILIDADES
# =============================================================================

def validate_question_format(question_data: Dict[str, Any]) -> bool:
    """
    Validar que una pregunta tenga el formato correcto
    """
    required_fields = ["pregunta", "opciones"]
    
    if not all(field in question_data for field in required_fields):
        return False
    
    if not isinstance(question_data["opciones"], list) or len(question_data["opciones"]) != 4:
        return False
    
    return True

def get_current_timestamp() -> str:
    """
    Obtener timestamp actual en formato ISO
    """
    return datetime.now().isoformat()

# =============================================================================
# CONSTANTES DEL MÓDULO
# =============================================================================

# Estados válidos para transiciones
VALID_STATUS_TRANSITIONS = {
    ProcedureStatus.pending: [ProcedureStatus.generating, ProcedureStatus.skipped],
    ProcedureStatus.generating: [ProcedureStatus.validating, ProcedureStatus.failed],
    ProcedureStatus.validating: [ProcedureStatus.correcting, ProcedureStatus.completed, ProcedureStatus.failed],
    ProcedureStatus.correcting: [ProcedureStatus.completed, ProcedureStatus.failed],
    ProcedureStatus.completed: [],  # Estado final
    ProcedureStatus.failed: [ProcedureStatus.pending],  # Puede reiniciarse
    ProcedureStatus.skipped: []  # Estado final
}

# Configuraciones por defecto
DEFAULT_GENERATION_CONFIG = GenerationConfig(
    openai_model="gpt-4o",
    max_retries=3,
    timeout_seconds=60,
    batch_size=5,
    rate_limit_enabled=True
)

# Tipos de archivos soportados
SUPPORTED_FILE_EXTENSIONS = [".docx", ".doc"]

