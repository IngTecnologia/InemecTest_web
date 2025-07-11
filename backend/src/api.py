
"""
API endpoints para InemecTest - Versión corregida con manejo de randomización
Integración completa con módulo administrativo
"""

from fastapi import APIRouter, HTTPException, Query, Form
from typing import List, Optional, Dict, Any
import random

from .models import *
from .excel_handler import ExcelHandler
from .email_service import EmailService
# INTEGRACIÓN: Importar router admin
from .admin.api import admin_router

router = APIRouter()

# INTEGRACIÓN: Incluir router admin con todos sus endpoints
router.include_router(admin_router)

# Inicializar handler de Excel
excel_handler = ExcelHandler()

# =============================================================================
# FUNCIONES AUXILIARES
# =============================================================================

def randomize_question_options(question: dict) -> tuple[QuestionForUser, Dict[str, str]]:
    """
    Randomizar opciones de una pregunta y retornar mapeo inverso
    Retorna: (pregunta_randomizada, mapeo_inverso)
    """
    # Crear lista de opciones con sus letras originales
    options_with_letters = [
        ("A", question["option_a"]),
        ("B", question["option_b"]), 
        ("C", question["option_c"]),
        ("D", question["option_d"])
    ]
    
    # Randomizar
    random.shuffle(options_with_letters)
    
    # Crear mapeo inverso: posición_visual -> letra_original
    inverse_mapping = {}
    randomized_options = []
    
    for idx, (original_letter, option_text) in enumerate(options_with_letters):
        visual_position = chr(65 + idx)  # A, B, C, D basado en posición visual
        inverse_mapping[visual_position] = original_letter
        randomized_options.append(option_text)
    
    return QuestionForUser(
        id=question["id"],
        question_text=question["question_text"],
        options=randomized_options
    ), inverse_mapping

# Cache global para guardar mapeos de opciones por sesión
# En producción, usar Redis o similar
question_mappings_cache = {}

def store_question_mappings(session_id: str, questions_data: List[dict], mappings: Dict[int, Dict[str, str]]):
    """Guardar mapeos de preguntas para una evaluación con ID de sesión único"""
    cache_key = f"session_{session_id}_mappings"
    question_mappings_cache[cache_key] = {
        "questions": questions_data,
        "mappings": mappings
    }

def get_question_mappings(session_id: str) -> tuple[List[dict], Dict[int, Dict[str, str]]]:
    """Obtener mapeos guardados por ID de sesión"""
    cache_key = f"session_{session_id}_mappings"
    if cache_key in question_mappings_cache:
        data = question_mappings_cache[cache_key]
        return data["questions"], data["mappings"]
    return None, None

def calculate_detailed_answers_direct(
    questions: List[dict], 
    user_answers: List[dict]
) -> List[dict]:
    """
    Calcular respuestas detalladas comparando directamente con las opciones originales del Excel
    """
    questions_dict = {q["id"]: q for q in questions}
    detailed_answers = []
    
    for answer in user_answers:
        question_id = answer["question_id"]
        question = questions_dict.get(question_id)
        
        if not question:
            continue
        
        # La respuesta del usuario es la posición visual (A, B, C, D)
        visual_position = answer["selected_option"]
        
        # Obtener las opciones originales del Excel
        original_options = {
            "A": question["option_a"],
            "B": question["option_b"], 
            "C": question["option_c"],
            "D": question["option_d"]
        }
        
        # El usuario seleccionó una opción visual, necesitamos saber qué texto seleccionó
        # Este texto viene en display_order si está disponible
        selected_text = ""
        if "display_order" in answer and answer["display_order"]:
            display_order = answer["display_order"]
            option_key = f"option_{visual_position.lower()}_text"
            selected_text = display_order.get(option_key, "")
        
        # Encontrar cuál opción original corresponde al texto seleccionado
        selected_original_option = None
        for orig_option, orig_text in original_options.items():
            if orig_text.strip() == selected_text.strip():
                selected_original_option = orig_option
                break
        
        # Si no encontramos coincidencia exacta, usar la posición visual como fallback
        if not selected_original_option:
            selected_original_option = visual_position
            selected_text = original_options.get(visual_position, "")
        
        # La respuesta correcta siempre es A en el original
        correct_option = "A"
        correct_text = original_options["A"]
        is_correct = selected_original_option == correct_option
        
        detailed_answer = {
            "question_id": question_id,
            "question_text": question["question_text"],
            "selected_option": visual_position,
            "selected_text": selected_text,
            "correct_option": correct_option,
            "correct_text": correct_text,
            "correct_option_displayed": visual_position,  # Simplificado
            "is_correct": is_correct
        }
        
        # Agregar display_order si está disponible
        if "display_order" in answer:
            detailed_answer["display_order"] = answer["display_order"]
        
        detailed_answers.append(detailed_answer)
    
    return detailed_answers

def calculate_detailed_answers_with_mapping(
    questions: List[dict], 
    user_answers: List[dict],
    mappings: Dict[int, Dict[str, str]]
) -> List[dict]:
    """
    Calcular respuestas detalladas usando mapeo de opciones randomizadas
    """
    questions_dict = {q["id"]: q for q in questions}
    detailed_answers = []
    
    for answer in user_answers:
        question_id = answer["question_id"]
        question = questions_dict.get(question_id)
        
        if not question:
            continue
        
        # La respuesta del usuario es la posición visual (A, B, C, D)
        visual_position = answer["selected_option"]
        
        # Obtener el mapeo para esta pregunta
        question_mapping = mappings.get(question_id, {})
        
        # Convertir posición visual a letra original
        original_selected = question_mapping.get(visual_position, visual_position)
        
        # La respuesta correcta siempre es A en el original
        correct_option = "A"
        is_correct = original_selected == correct_option
        
        # Obtener textos de las opciones
        option_map = {
            "A": question["option_a"],
            "B": question["option_b"],
            "C": question["option_c"],
            "D": question["option_d"]
        }
        
        # Para mostrar al usuario, necesitamos saber qué opción visual corresponde a la A original
        visual_correct = None
        for visual_pos, original_pos in question_mapping.items():
            if original_pos == "A":
                visual_correct = visual_pos
                break
        
        detailed_answer = {
            "question_id": question_id,
            "question_text": question["question_text"],
            "selected_option": visual_position,  # Lo que vio el usuario
            "selected_text": option_map.get(original_selected, ""),
            "correct_option": visual_correct or "A",  # Posición visual de la correcta
            "correct_text": option_map.get("A", ""),  # Siempre es option_a
            "is_correct": is_correct
        }
        
        detailed_answers.append(detailed_answer)
    
    return detailed_answers

def calculate_score(detailed_answers: List[dict]) -> dict:
    """Calcular puntuación basada en respuestas detalladas"""
    total_questions = len(detailed_answers)
    correct_answers = sum(1 for answer in detailed_answers if answer["is_correct"])
    score_percentage = (correct_answers / total_questions * 100) if total_questions > 0 else 0
    
    return {
        "total_questions": total_questions,
        "correct_answers": correct_answers,
        "score_percentage": round(score_percentage, 2)
    }

# =============================================================================
# ENDPOINTS DE PROCEDIMIENTOS
# =============================================================================

@router.get("/procedures", response_model=ProcedureList)
async def get_all_procedures():
    """Obtener lista de todos los procedimientos disponibles"""
    try:
        procedures_data = await excel_handler.get_all_procedures()
        
        procedures = [Procedure(**proc) for proc in procedures_data]
        
        return ProcedureList(
            procedures=procedures,
            total=len(procedures)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error obteniendo procedimientos: {str(e)}"
        )

@router.get("/procedures/search")
async def search_procedures(q: str = Query(..., min_length=1, description="Código o nombre a buscar")):
    """Buscar procedimientos por código o nombre"""
    try:
        all_procedures = await excel_handler.get_all_procedures()
        
        # Filtrar procedimientos que coincidan con la búsqueda
        filtered = []
        query_lower = q.lower()
        
        for proc in all_procedures:
            if (query_lower in proc["codigo"].lower() or 
                query_lower in proc["nombre"].lower()):
                filtered.append(Procedure(**proc))
        
        return ProcedureList(
            procedures=filtered,
            total=len(filtered)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error buscando procedimientos: {str(e)}"
        )

@router.get("/procedures/{codigo}")
async def get_procedure_by_code(codigo: str):
    """Obtener procedimiento específico por código"""
    try:
        procedure_data = await excel_handler.get_procedure_by_code(codigo)
        
        if not procedure_data:
            raise HTTPException(
                status_code=404, 
                detail=f"Procedimiento {codigo} no encontrado"
            )
        
        return Procedure(**procedure_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error obteniendo procedimiento: {str(e)}"
        )

@router.get("/procedures/{codigo}/questions")
async def get_procedure_questions(codigo: str, session_id: str = None):
    """Obtener preguntas de un procedimiento con opciones randomizadas"""
    try:
        # Verificar que existe el procedimiento
        procedure_data = await excel_handler.get_procedure_by_code(codigo)
        if not procedure_data:
            raise HTTPException(
                status_code=404, 
                detail=f"Procedimiento {codigo} no encontrado"
            )
        
        # Obtener preguntas originales
        questions_data = await excel_handler.get_questions_by_procedure(codigo)
        if not questions_data:
            raise HTTPException(
                status_code=404, 
                detail=f"No hay preguntas para el procedimiento {codigo}"
            )
        
        # Randomizar opciones para cada pregunta y guardar mapeos
        randomized_questions = []
        mappings = {}
        
        for question in questions_data:
            randomized_q, mapping = randomize_question_options(question)
            randomized_questions.append(randomized_q)
            mappings[question["id"]] = mapping
        
        # Generar ID de sesión único si no se proporciona
        if not session_id:
            import uuid
            session_id = str(uuid.uuid4())
        
        # Guardar mapeos en cache para usar al calificar
        store_question_mappings(session_id, questions_data, mappings)
        
        return ProcedureWithQuestions(
            procedure=Procedure(**procedure_data),
            questions=randomized_questions,
            session_id=session_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error obteniendo preguntas: {str(e)}"
        )

# =============================================================================
# ENDPOINTS DE EVALUACIONES
# =============================================================================

@router.post("/evaluations", response_model=EvaluationResponse)
async def create_evaluation(evaluation_data: EvaluationCreate):
    """Crear y procesar evaluación completa"""
    try:
        # Verificar que existe el procedimiento
        procedure_data = await excel_handler.get_procedure_by_code(evaluation_data.procedure_codigo)
        if not procedure_data:
            raise HTTPException(
                status_code=404, 
                detail=f"Procedimiento {evaluation_data.procedure_codigo} no encontrado"
            )
        
        # Obtener preguntas originales directamente del Excel (sin caché)
        questions_data = await excel_handler.get_questions_by_procedure(evaluation_data.procedure_codigo)
        if not questions_data:
            raise HTTPException(
                status_code=404, 
                detail=f"No hay preguntas para el procedimiento {evaluation_data.procedure_codigo}"
            )
        
        # Validar que se respondieron todas las preguntas
        if len(evaluation_data.knowledge_answers) != len(questions_data):
            raise HTTPException(
                status_code=400, 
                detail=f"Se esperaban {len(questions_data)} respuestas, se recibieron {len(evaluation_data.knowledge_answers)}"
            )
        
        # Calcular respuestas detalladas comparando directamente con opciones originales
        user_answers = [answer.dict() for answer in evaluation_data.knowledge_answers]
        detailed_answers = calculate_detailed_answers_direct(
            questions_data, 
            user_answers
        )
        
        # Calcular puntuación
        score_data = calculate_score(detailed_answers)
        
        # Preparar datos completos para guardar en Excel
        complete_evaluation_data = {
            "user_data": evaluation_data.user_data.dict(),
            "procedure_codigo": evaluation_data.procedure_codigo,
            "procedure_nombre": procedure_data["nombre"],
            "knowledge_answers": detailed_answers,
            "applied_knowledge": evaluation_data.applied_knowledge.dict(),
            "feedback": evaluation_data.feedback.dict(),
            "score_data": score_data
        }
        
        # Guardar en Excel
        evaluation_id = await excel_handler.save_evaluation_result(complete_evaluation_data)
        
        return EvaluationResponse(
            evaluation_id=evaluation_id,
            message="Evaluación completada exitosamente",
            success=True,
            score_percentage=score_data["score_percentage"],
            total_questions=score_data["total_questions"],
            correct_answers=score_data["correct_answers"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error creando evaluación: {str(e)}"
        )

@router.get("/evaluations/{evaluation_id}/results", response_model=EvaluationResults)
async def get_evaluation_results(evaluation_id: str):
    """Obtener resultados completos de una evaluación"""
    try:
        results = await excel_handler.get_evaluation_results(evaluation_id)
        
        if not results:
            raise HTTPException(
                status_code=404, 
                detail=f"Evaluación {evaluation_id} no encontrada"
            )
        
        evaluation = results["evaluation"]
        answers = results["answers"]
        applied = results["applied"]
        feedback = results["feedback"]
        
        # Procesar respuestas para el formato esperado
        answer_results = []
        for answer in answers:
            answer_results.append(AnswerResult(
                question_id=int(answer.get("Question Id", 0)),
                question_text=str(answer.get("Question Text", "")),
                selected_option=str(answer.get("Selected Option", "")),
                selected_text=str(answer.get("Selected Text", "")),
                correct_option=str(answer.get("Correct Option", "")),
                correct_text=str(answer.get("Correct Text", "")),
                is_correct=answer.get("Is Correct", "No") == "Sí"
            ))
        
        return EvaluationResults(
            evaluation_id=evaluation_id,
            user_name=str(evaluation.get("Nombre", "")),
            user_cargo=str(evaluation.get("Cargo", "")),
            user_campo=str(evaluation.get("Campo", "")),
            procedure_codigo=str(evaluation.get("Procedure Codigo", "")),
            procedure_name=str(evaluation.get("Procedure Nombre", "")),
            total_questions=int(evaluation.get("Total Questions", 0)),
            correct_answers=int(evaluation.get("Correct Answers", 0)),
            score_percentage=float(evaluation.get("Score Percentage", 0)),
            answers=answer_results,
            applied_knowledge=AppliedKnowledgeData(
                describio_procedimiento=applied.get("Describio Procedimiento", "No") == "Sí",
                identifico_riesgos=applied.get("Identifico Riesgos", "No") == "Sí",
                identifico_epp=applied.get("Identifico Epp", "No") == "Sí",
                describio_incidentes=applied.get("Describio Incidentes", "No") == "Sí"
            ) if applied else AppliedKnowledgeData(),
            feedback=FeedbackData(
                hizo_sugerencia=SiNoEnum(feedback.get("Hizo Sugerencia", "No")) if feedback else SiNoEnum.no,
                cual_sugerencia=str(feedback.get("Cual Sugerencia", "")) if feedback else None,
                aprobo=SiNoEnum(feedback.get("Aprobo", "No")) if feedback else SiNoEnum.no,
                requiere_entrenamiento=str(feedback.get("Requiere Entrenamiento", "")) if feedback else None
            ) if feedback else FeedbackData(hizo_sugerencia=SiNoEnum.no, aprobo=SiNoEnum.no),
            completed_at=str(evaluation.get("Completed At", ""))
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error obteniendo resultados: {str(e)}"
        )

# =============================================================================
# ENDPOINTS DE ESTADÍSTICAS Y CONSULTAS
# =============================================================================

@router.get("/evaluations")
async def get_all_evaluations():
    """Obtener lista de todas las evaluaciones"""
    try:
        evaluations = await excel_handler.get_all_evaluations()
        
        # Formatear respuesta
        formatted_evaluations = []
        for eval_data in evaluations:
            formatted_evaluations.append({
                "evaluation_id": eval_data.get("Evaluation Id", ""),
                "nombre": eval_data.get("Nombre", ""),
                "cargo": eval_data.get("Cargo", ""),
                "campo": eval_data.get("Campo", ""),
                "procedure_codigo": eval_data.get("Procedure Codigo", ""),
                "procedure_nombre": eval_data.get("Procedure Nombre", ""),
                "score_percentage": eval_data.get("Score Percentage", 0),
                "aprobo": eval_data.get("Aprobo", "No"),
                "completed_at": eval_data.get("Completed At", "")
            })
        
        return {
            "evaluations": formatted_evaluations,
            "total": len(formatted_evaluations)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error obteniendo evaluaciones: {str(e)}"
        )

@router.get("/stats/procedures")
async def get_procedure_stats():
    """Obtener estadísticas básicas de procedimientos"""
    try:
        stats = await excel_handler.get_procedure_statistics()
        
        return {
            "stats": stats,
            "total_procedures": len(stats)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error obteniendo estadísticas: {str(e)}"
        )

@router.get("/stats/general")
async def get_general_stats():
    """Obtener estadísticas generales del sistema"""
    try:
        # Obtener datos de procedimientos
        procedures = await excel_handler.get_all_procedures()
        
        # Obtener evaluaciones
        evaluations = await excel_handler.get_all_evaluations()
        
        # Calcular estadísticas generales
        if evaluations:
            scores = [float(e.get("Score Percentage", 0)) for e in evaluations]
            approvals = [e.get("Aprobo", "No") for e in evaluations]
            
            general_stats = {
                "total_procedures": len(procedures),
                "total_evaluations": len(evaluations),
                "average_score": round(sum(scores) / len(scores), 2) if scores else 0,
                "approval_rate": round((approvals.count("Sí") / len(approvals) * 100), 2) if approvals else 0,
                "total_approved": approvals.count("Sí"),
                "total_rejected": approvals.count("No")
            }
        else:
            general_stats = {
                "total_procedures": len(procedures),
                "total_evaluations": 0,
                "average_score": 0,
                "approval_rate": 0,
                "total_approved": 0,
                "total_rejected": 0
            }
        
        return general_stats
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error obteniendo estadísticas generales: {str(e)}"
        )

# =============================================================================
# ENDPOINTS DE ENVÍO DE CORREO
# =============================================================================

@router.post("/evaluations/{evaluation_id}/send-email")
async def send_evaluation_email(
    evaluation_id: str,
    recipient_email: str = Form(..., description="Correo del destinatario")
):
    """
    Enviar reporte de evaluación por correo electrónico
    
    Args:
        evaluation_id: ID de la evaluación
        recipient_email: Correo electrónico del destinatario
        
    Returns:
        dict: Resultado del envío
    """
    try:
        # Validar formato de correo básico
        if "@" not in recipient_email or "." not in recipient_email:
            raise HTTPException(
                status_code=400, 
                detail="Formato de correo electrónico inválido"
            )
        
        # Obtener datos de la evaluación
        evaluations = await excel_handler.get_all_evaluations()
        evaluation_data = None
        
        for evaluation in evaluations:
            if evaluation.get("evaluation_id") == evaluation_id:
                evaluation_data = evaluation
                break
        
        if not evaluation_data:
            raise HTTPException(
                status_code=404, 
                detail="Evaluación no encontrada"
            )
        
        # Inicializar servicio de correo
        email_service = EmailService()
        
        # Enviar correo
        success, message = email_service.send_evaluation_report(
            evaluation_data, 
            recipient_email
        )
        
        if success:
            return {
                "success": True,
                "message": "Correo enviado exitosamente",
                "recipient": recipient_email,
                "evaluation_id": evaluation_id
            }
        else:
            raise HTTPException(
                status_code=500, 
                detail=f"Error enviando correo: {message}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error interno enviando correo: {str(e)}"
        )

@router.post("/email/test-connection")
async def test_email_connection():
    """
    Probar conexión SMTP (útil para debugging)
    
    Returns:
        dict: Estado de la conexión
    """
    try:
        email_service = EmailService()
        success, message = email_service.test_connection()
        
        return {
            "success": success,
            "message": message,
            "smtp_server": email_service.smtp_server,
            "smtp_port": email_service.smtp_port
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Error probando conexión: {str(e)}"
        }