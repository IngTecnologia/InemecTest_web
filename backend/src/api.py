from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import random
import string

from .models import *
from .database import *

router = APIRouter()

def randomize_question_options(question: dict) -> QuestionWithRandomizedOptions:
    """Randomizar opciones de una pregunta de forma segura"""
    options = [
        question["option_a"],
        question["option_b"], 
        question["option_c"],
        question["option_d"]
    ]
    
    # Randomizar opciones
    random.shuffle(options)
    
    return QuestionWithRandomizedOptions(
        id=question["id"],
        question_text=question["question_text"],
        options=options
    )

def calculate_score(answers: List[dict]) -> dict:
    """Calcular puntuación de las respuestas"""
    total_questions = len(answers)
    correct_answers = sum(1 for answer in answers if answer["is_correct"])
    score_percentage = (correct_answers / total_questions * 100) if total_questions > 0 else 0
    
    return {
        "total_questions": total_questions,
        "correct_answers": correct_answers,
        "score_percentage": round(score_percentage, 2)
    }

def get_option_text(question: dict, option_letter: str) -> str:
    """Obtener texto de una opción específica"""
    option_map = {
        "A": question["option_a"],
        "B": question["option_b"],
        "C": question["option_c"],
        "D": question["option_d"]
    }
    return option_map.get(option_letter, "")

# ENDPOINTS

@router.get("/procedures", response_model=ProcedureList)
async def get_all_procedures():
    """Obtener lista de todos los procedimientos"""
    try:
        procedures = await get_procedures()
        return ProcedureList(
            procedures=[Procedure(**dict(proc)) for proc in procedures],
            total=len(procedures)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo procedimientos: {str(e)}")

@router.get("/procedures/search")
async def search_procedures(q: str = Query(..., min_length=1, description="Código o nombre a buscar")):
    """Buscar procedimientos por código o nombre"""
    try:
        all_procedures = await get_procedures()
        
        # Filtrar procedimientos que coincidan con la búsqueda
        filtered = []
        query_lower = q.lower()
        
        for proc in all_procedures:
            if (query_lower in proc["codigo"].lower() or 
                query_lower in proc["nombre"].lower()):
                filtered.append(Procedure(**dict(proc)))
        
        return ProcedureList(
            procedures=filtered,
            total=len(filtered)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error buscando procedimientos: {str(e)}")

@router.get("/procedures/{codigo}")
async def get_procedure_by_code(codigo: str):
    """Obtener procedimiento específico por código"""
    try:
        procedure = await get_procedure_by_codigo(codigo)
        if not procedure:
            raise HTTPException(status_code=404, detail=f"Procedimiento {codigo} no encontrado")
        
        return Procedure(**dict(procedure))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo procedimiento: {str(e)}")

@router.get("/procedures/{codigo}/questions")
async def get_procedure_questions(codigo: str):
    """Obtener preguntas de un procedimiento con opciones randomizadas"""
    try:
        # Obtener procedimiento
        procedure = await get_procedure_by_codigo(codigo)
        if not procedure:
            raise HTTPException(status_code=404, detail=f"Procedimiento {codigo} no encontrado")
        
        # Obtener preguntas
        questions = await get_questions_by_procedure(procedure["id"])
        if not questions:
            raise HTTPException(status_code=404, detail=f"No hay preguntas para el procedimiento {codigo}")
        
        # Randomizar opciones
        randomized_questions = [randomize_question_options(dict(q)) for q in questions]
        
        return ProcedureWithQuestions(
            procedure=Procedure(**dict(procedure)),
            questions=randomized_questions
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo preguntas: {str(e)}")

@router.post("/evaluations", response_model=EvaluationResponse)
async def create_evaluation(evaluation_data: EvaluationCreate):
    """Crear y procesar evaluación completa"""
    try:
        # Verificar que existe el procedimiento
        procedure = await get_procedure_by_codigo(evaluation_data.procedure_codigo)
        if not procedure:
            raise HTTPException(status_code=404, detail=f"Procedimiento {evaluation_data.procedure_codigo} no encontrado")
        
        # Obtener preguntas originales para validar respuestas
        questions = await get_questions_by_procedure(procedure["id"])
        questions_dict = {q["id"]: q for q in questions}
        
        # Validar respuestas y calcular correctas
        validated_answers = []
        for answer in evaluation_data.knowledge_answers:
            if answer.question_id not in questions_dict:
                raise HTTPException(status_code=400, detail=f"Pregunta {answer.question_id} no existe")
            
            question = questions_dict[answer.question_id]
            is_correct = answer.selected_option == question["correct_answer"]
            
            validated_answers.append({
                "question_id": answer.question_id,
                "selected_option": answer.selected_option,
                "is_correct": is_correct
            })
        
        # Guardar evaluación
        eval_db_data = {
            "nombre": evaluation_data.user_data.nombre,
            "cargo": evaluation_data.user_data.cargo,
            "campo": evaluation_data.user_data.campo,
            "procedure_id": procedure["id"],
            "status": "completed"
        }
        
        evaluation_id = await save_evaluation(eval_db_data)
        
        # Guardar respuestas
        await save_knowledge_answers(evaluation_id, validated_answers)
        
        # Guardar conocimiento aplicado
        await save_applied_knowledge(evaluation_id, evaluation_data.applied_knowledge.dict())
        
        # Guardar feedback
        await save_feedback(evaluation_id, evaluation_data.feedback.dict())
        
        # Marcar como completada
        await complete_evaluation(evaluation_id)
        
        return EvaluationResponse(
            evaluation_id=evaluation_id,
            message="Evaluación completada exitosamente",
            status="completed"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando evaluación: {str(e)}")

@router.get("/evaluations/{evaluation_id}/results", response_model=EvaluationResults)
async def get_evaluation_results(evaluation_id: int):
    """Obtener resultados completos de una evaluación"""
    try:
        results = await get_evaluation_results(evaluation_id)
        
        if not results["evaluation"]:
            raise HTTPException(status_code=404, detail=f"Evaluación {evaluation_id} no encontrada")
        
        evaluation = results["evaluation"]
        answers = results["answers"]
        applied = results["applied"]
        feedback = results["feedback"]
        
        # Calcular puntuación
        score_data = calculate_score([dict(a) for a in answers])
        
        # Procesar respuestas para mostrar resultado detallado
        answer_results = []
        for answer in answers:
            answer_dict = dict(answer)
            answer_results.append(AnswerResult(
                question_id=answer_dict["question_id"],
                question_text=answer_dict["question_text"],
                selected_option=answer_dict["selected_option"],
                selected_text=get_option_text(answer_dict, answer_dict["selected_option"]),
                correct_option=answer_dict["correct_answer"],
                correct_text=get_option_text(answer_dict, answer_dict["correct_answer"]),
                is_correct=answer_dict["is_correct"]
            ))
        
        return EvaluationResults(
            evaluation_id=evaluation_id,
            user_name=evaluation["nombre"],
            procedure_name=evaluation["procedure_name"],
            procedure_codigo=evaluation["codigo"],
            total_questions=score_data["total_questions"],
            correct_answers=score_data["correct_answers"],
            score_percentage=score_data["score_percentage"],
            answers=answer_results,
            applied_knowledge=AppliedKnowledgeData(**dict(applied)) if applied else AppliedKnowledgeData(),
            feedback=FeedbackData(**dict(feedback)) if feedback else FeedbackData(hizo_sugerencia="No", aprobo="Sí"),
            completed_at=evaluation.get("completed_at")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo resultados: {str(e)}")

# Endpoints adicionales útiles

@router.get("/evaluations/{evaluation_id}")
async def get_evaluation_basic(evaluation_id: int):
    """Obtener información básica de una evaluación"""
    try:
        query = """
            SELECT e.*, p.codigo, p.nombre as procedure_name
            FROM evaluations e
            JOIN procedures p ON e.procedure_id = p.id
            WHERE e.id = :evaluation_id
        """
        evaluation = await fetch_one(query, {"evaluation_id": evaluation_id})
        
        if not evaluation:
            raise HTTPException(status_code=404, detail=f"Evaluación {evaluation_id} no encontrada")
        
        return dict(evaluation)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo evaluación: {str(e)}")

@router.get("/stats/procedures")
async def get_procedure_stats():
    """Obtener estadísticas básicas de procedimientos"""
    try:
        query = """
            SELECT 
                p.codigo,
                p.nombre,
                COUNT(e.id) as total_evaluations,
                AVG(
                    (SELECT COUNT(*) FROM answers a WHERE a.evaluation_id = e.id AND a.is_correct = true) * 100.0 / 
                    (SELECT COUNT(*) FROM answers a WHERE a.evaluation_id = e.id)
                ) as average_score
            FROM procedures p
            LEFT JOIN evaluations e ON p.id = e.procedure_id
            GROUP BY p.id, p.codigo, p.nombre
            ORDER BY total_evaluations DESC
        """
        
        stats = await fetch_all(query)
        return [dict(stat) for stat in stats]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo estadísticas: {str(e)}")