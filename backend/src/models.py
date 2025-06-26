"""
Modelos de datos para InemecTest - Versión limpia basada en Excel
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# =============================================================================
# ENUMS
# =============================================================================

class CampoEnum(str, Enum):
    cusiana = "Cusiana"
    cupiagua = "Cupiagua"
    florena = "Floreña"
    transversal = "Transversal"

class OptionEnum(str, Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"

class SiNoEnum(str, Enum):
    si = "Sí"
    no = "No"

# =============================================================================
# MODELOS DE PROCEDIMIENTOS
# =============================================================================

class DatosCompletos(BaseModel):
    """Datos adicionales del procedimiento para filtros"""
    disciplina: Optional[str] = Field(None, description="Disciplina del procedimiento")
    campo: Optional[str] = Field(None, description="Campo operativo del procedimiento")

class Procedure(BaseModel):
    """Modelo para procedimiento"""
    codigo: str = Field(..., description="Código del procedimiento")
    nombre: str = Field(..., description="Nombre del procedimiento")
    alcance: str = Field(..., description="Alcance del procedimiento")
    objetivo: str = Field(..., description="Objetivo del procedimiento")
    datos_completos: Optional[DatosCompletos] = Field(None, description="Datos adicionales para filtros")

class ProcedureList(BaseModel):
    """Lista de procedimientos"""
    procedures: List[Procedure]
    total: int

# =============================================================================
# MODELOS DE PREGUNTAS
# =============================================================================

class QuestionForUser(BaseModel):
    """Pregunta para mostrar al usuario (sin respuesta correcta, opciones randomizadas)"""
    id: int
    question_text: str
    options: List[str] = Field(..., description="Opciones randomizadas A, B, C, D")

class ProcedureWithQuestions(BaseModel):
    """Procedimiento con sus preguntas randomizadas"""
    procedure: Procedure
    questions: List[QuestionForUser]
    session_id: str = Field(..., description="ID único de sesión para mapear respuestas")

# =============================================================================
# MODELOS DE EVALUACIÓN - INPUT
# =============================================================================

class UserData(BaseModel):
    """Datos del usuario que toma la evaluación"""
    cedula: str = Field(..., min_length=1, description="Cédula del evaluado (identificador principal)")
    nombre: str = Field(..., min_length=1, description="Nombre del evaluado")
    cargo: str = Field(..., min_length=1, description="Cargo del evaluado")
    campo: CampoEnum = Field(..., description="Campo de trabajo")

class DisplayOrder(BaseModel):
    """Orden de opciones como se mostró al usuario"""
    question_text: Optional[str] = Field(None, description="Texto de la pregunta")
    option_a_text: Optional[str] = Field(None, description="Texto mostrado en posición A")
    option_b_text: Optional[str] = Field(None, description="Texto mostrado en posición B")
    option_c_text: Optional[str] = Field(None, description="Texto mostrado en posición C")
    option_d_text: Optional[str] = Field(None, description="Texto mostrado en posición D")

class KnowledgeAnswer(BaseModel):
    """Respuesta a una pregunta de conocimiento"""
    question_id: int = Field(..., description="ID de la pregunta")
    selected_option: OptionEnum = Field(..., description="Opción seleccionada (A, B, C, D)")
    display_order: Optional[DisplayOrder] = Field(None, description="Orden exacto como se mostró")

class AppliedKnowledgeData(BaseModel):
    """Datos de evaluación de conocimiento aplicado"""
    describio_procedimiento: bool = Field(False, description="Describió el procedimiento")
    identifico_riesgos: bool = Field(False, description="Identificó riesgos")
    identifico_epp: bool = Field(False, description="Identificó EPP")
    describio_incidentes: bool = Field(False, description="Describió manejo de incidentes")

class FeedbackData(BaseModel):
    """Datos de feedback y observaciones"""
    hizo_sugerencia: SiNoEnum = Field(..., description="¿Hizo sugerencia?")
    cual_sugerencia: Optional[str] = Field(None, description="Descripción de la sugerencia")
    aprobo: SiNoEnum = Field(..., description="¿Aprobó la evaluación?")
    requiere_entrenamiento: Optional[str] = Field(None, description="Temas que requieren entrenamiento")

class EvaluationCreate(BaseModel):
    """Datos para crear una nueva evaluación"""
    user_data: UserData
    procedure_codigo: str = Field(..., description="Código del procedimiento")
    session_id: str = Field(..., description="ID de sesión para mapear respuestas")
    knowledge_answers: List[KnowledgeAnswer]
    applied_knowledge: AppliedKnowledgeData
    feedback: FeedbackData

# =============================================================================
# MODELOS DE RESPUESTA
# =============================================================================

class EvaluationResponse(BaseModel):
    """Respuesta al crear evaluación"""
    evaluation_id: str
    message: str
    success: bool

class AnswerResult(BaseModel):
    """Resultado detallado de una respuesta"""
    question_id: int
    question_text: str
    selected_option: str
    selected_text: str
    correct_option: str
    correct_text: str
    is_correct: bool

class EvaluationResults(BaseModel):
    """Resultados completos de una evaluación"""
    evaluation_id: str
    user_name: str
    user_cargo: str
    user_campo: str
    procedure_codigo: str
    procedure_name: str
    total_questions: int
    correct_answers: int
    score_percentage: float
    answers: List[AnswerResult]
    applied_knowledge: AppliedKnowledgeData
    feedback: FeedbackData
    completed_at: str

# =============================================================================
# MODELOS AUXILIARES DE SISTEMA
# =============================================================================

class APIResponse(BaseModel):
    """Respuesta genérica de la API"""
    success: bool
    message: str
    data: Optional[Any] = None

class ErrorResponse(BaseModel):
    """Respuesta de error"""
    success: bool = False
    message: str
    error_code: Optional[str] = None

class HealthCheck(BaseModel):
    """Estado de salud de la API"""
    status: str
    excel_files: Dict[str, Any]
    timestamp: str

# =============================================================================
# MODELOS DE ESTADÍSTICAS
# =============================================================================

class ProcedureStats(BaseModel):
    """Estadísticas de un procedimiento"""
    procedure_codigo: str
    procedure_name: str
    total_evaluations: int
    average_score: float
    approval_rate: float

class EvaluationSummary(BaseModel):
    """Resumen de una evaluación para listas"""
    evaluation_id: str
    nombre: str
    cargo: str
    campo: str
    procedure_codigo: str
    procedure_nombre: str
    score_percentage: float
    aprobo: str
    completed_at: str

class EvaluationsList(BaseModel):
    """Lista de evaluaciones"""
    evaluations: List[EvaluationSummary]
    total: int

class GeneralStats(BaseModel):
    """Estadísticas generales del sistema"""
    total_procedures: int
    total_evaluations: int
    average_score: float
    approval_rate: float
    total_approved: int
    total_rejected: int

class ProcedureStatsList(BaseModel):
    """Lista de estadísticas por procedimiento"""
    stats: List[ProcedureStats]
    total_procedures: int

# =============================================================================
# MODELOS DE VALIDACIÓN DE ARCHIVOS
# =============================================================================

class FileValidationResult(BaseModel):
    """Resultado de validación de archivos Excel"""
    exists: bool
    valid: bool
    procedures_count: int
    questions_count: int
    errors: List[str]

class SystemInfo(BaseModel):
    """Información completa del sistema"""
    system: Dict[str, str]
    data: Dict[str, Any]
    files: Dict[str, str]
    top_procedures: List[ProcedureStats]