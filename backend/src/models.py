from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
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

class StatusEnum(str, Enum):
    in_progress = "in_progress"
    completed = "completed"

class SiNoEnum(str, Enum):
    si = "Sí"
    no = "No"

# Modelos base
class ProcedureBase(BaseModel):
    codigo: str = Field(..., description="Código del procedimiento")
    nombre: str = Field(..., description="Nombre del procedimiento")
    alcance: Optional[str] = Field(None, description="Alcance del procedimiento")
    objetivo: Optional[str] = Field(None, description="Objetivo del procedimiento")

class Procedure(ProcedureBase):
    id: int
    
    class Config:
        from_attributes = True

class QuestionBase(BaseModel):
    question_text: str = Field(..., description="Texto de la pregunta")
    option_a: str = Field(..., description="Opción A")
    option_b: str = Field(..., description="Opción B")
    option_c: str = Field(..., description="Opción C")
    option_d: str = Field(..., description="Opción D")
    correct_answer: OptionEnum = Field(..., description="Respuesta correcta")

class Question(QuestionBase):
    id: int
    procedure_id: int
    
    class Config:
        from_attributes = True

class QuestionWithRandomizedOptions(BaseModel):
    """Pregunta con opciones randomizadas para el frontend"""
    id: int
    question_text: str
    options: List[str] = Field(..., description="Opciones randomizadas")
    # No incluimos correct_answer por seguridad

# Modelos de evaluación
class UserData(BaseModel):
    nombre: str = Field(..., min_length=1, description="Nombre del evaluado")
    cargo: str = Field(..., min_length=1, description="Cargo del evaluado")
    campo: CampoEnum = Field(..., description="Campo de trabajo")

class KnowledgeAnswer(BaseModel):
    question_id: int = Field(..., description="ID de la pregunta")
    selected_option: OptionEnum = Field(..., description="Opción seleccionada")

class AppliedKnowledgeData(BaseModel):
    describio_procedimiento: bool = Field(False, description="Describió el procedimiento")
    identifico_riesgos: bool = Field(False, description="Identificó riesgos")
    identifico_epp: bool = Field(False, description="Identificó EPP")
    describio_incidentes: bool = Field(False, description="Describió manejo de incidentes")

class FeedbackData(BaseModel):
    hizo_sugerencia: SiNoEnum = Field(..., description="¿Hizo sugerencia?")
    cual_sugerencia: Optional[str] = Field(None, description="Descripción de la sugerencia")
    aprobo: SiNoEnum = Field(..., description="¿Aprobó la evaluación?")
    requiere_entrenamiento: Optional[str] = Field(None, description="Temas que requieren entrenamiento")

class EvaluationCreate(BaseModel):
    user_data: UserData
    procedure_codigo: str = Field(..., description="Código del procedimiento")
    knowledge_answers: List[KnowledgeAnswer]
    applied_knowledge: AppliedKnowledgeData
    feedback: FeedbackData

class EvaluationResponse(BaseModel):
    evaluation_id: int
    message: str
    status: str

# Modelos de respuesta
class AnswerResult(BaseModel):
    question_id: int
    question_text: str
    selected_option: str
    selected_text: str
    correct_option: str
    correct_text: str
    is_correct: bool

class EvaluationResults(BaseModel):
    evaluation_id: int
    user_name: str
    procedure_name: str
    procedure_codigo: str
    total_questions: int
    correct_answers: int
    score_percentage: float
    answers: List[AnswerResult]
    applied_knowledge: AppliedKnowledgeData
    feedback: FeedbackData
    completed_at: Optional[datetime]

# Modelos para procedimientos
class ProcedureWithQuestions(BaseModel):
    procedure: Procedure
    questions: List[QuestionWithRandomizedOptions]

class ProcedureSearch(BaseModel):
    query: str = Field(..., min_length=1, description="Código o nombre a buscar")

class ProcedureList(BaseModel):
    procedures: List[Procedure]
    total: int

# Respuestas de la API
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: Optional[str] = None

# Modelos de estadísticas (para futuro)
class EvaluationStats(BaseModel):
    total_evaluations: int
    average_score: float
    completion_rate: float
    most_failed_questions: List[Dict[str, Any]]

class ProcedureStats(BaseModel):
    procedure_codigo: str
    procedure_name: str
    total_evaluations: int
    average_score: float
    last_evaluation: Optional[datetime]