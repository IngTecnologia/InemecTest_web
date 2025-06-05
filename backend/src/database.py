import os
import asyncpg
from databases import Database
from dotenv import load_dotenv

load_dotenv()

# URL de conexión a PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/inemectest")

# Instancia global de la base de datos
database = Database(DATABASE_URL)

async def get_database():
    """Obtener instancia de la base de datos"""
    return database

async def init_db():
    """Inicializar conexión a la base de datos"""
    try:
        await database.connect()
        print(f"✅ Conectado a PostgreSQL: {DATABASE_URL}")
    except Exception as e:
        print(f"❌ Error conectando a PostgreSQL: {e}")
        raise e

async def close_db():
    """Cerrar conexión a la base de datos"""
    await database.disconnect()

# Funciones auxiliares para queries
async def fetch_one(query: str, values: dict = None):
    """Ejecutar query y obtener un registro"""
    try:
        return await database.fetch_one(query, values)
    except Exception as e:
        print(f"Error en fetch_one: {e}")
        raise e

async def fetch_all(query: str, values: dict = None):
    """Ejecutar query y obtener todos los registros"""
    try:
        return await database.fetch_all(query, values)
    except Exception as e:
        print(f"Error en fetch_all: {e}")
        raise e

async def execute(query: str, values: dict = None):
    """Ejecutar query (INSERT, UPDATE, DELETE)"""
    try:
        return await database.execute(query, values)
    except Exception as e:
        print(f"Error en execute: {e}")
        raise e

async def execute_many(query: str, values: list):
    """Ejecutar query múltiple (batch operations)"""
    try:
        return await database.execute_many(query, values)
    except Exception as e:
        print(f"Error en execute_many: {e}")
        raise e

# Funciones específicas del negocio
async def get_procedures():
    """Obtener todos los procedimientos"""
    query = """
        SELECT id, codigo, nombre, alcance, objetivo 
        FROM procedures 
        ORDER BY codigo
    """
    return await fetch_all(query)

async def get_procedure_by_codigo(codigo: str):
    """Obtener procedimiento por código"""
    query = """
        SELECT id, codigo, nombre, alcance, objetivo 
        FROM procedures 
        WHERE codigo = :codigo
    """
    return await fetch_one(query, {"codigo": codigo})

async def get_questions_by_procedure(procedure_id: int):
    """Obtener preguntas de un procedimiento"""
    query = """
        SELECT id, question_text, option_a, option_b, option_c, option_d, correct_answer
        FROM questions 
        WHERE procedure_id = :procedure_id
        ORDER BY id
    """
    return await fetch_all(query, {"procedure_id": procedure_id})

async def save_evaluation(evaluation_data: dict):
    """Guardar evaluación completa"""
    query = """
        INSERT INTO evaluations (nombre, cargo, campo, procedure_id, status)
        VALUES (:nombre, :cargo, :campo, :procedure_id, :status)
        RETURNING id
    """
    result = await fetch_one(query, evaluation_data)
    return result["id"]

async def save_knowledge_answers(evaluation_id: int, answers: list):
    """Guardar respuestas de conocimiento"""
    query = """
        INSERT INTO answers (evaluation_id, question_id, selected_option, is_correct)
        VALUES (:evaluation_id, :question_id, :selected_option, :is_correct)
    """
    
    answer_data = []
    for answer in answers:
        answer_data.append({
            "evaluation_id": evaluation_id,
            "question_id": answer["question_id"],
            "selected_option": answer["selected_option"],
            "is_correct": answer["is_correct"]
        })
    
    return await execute_many(query, answer_data)

async def save_applied_knowledge(evaluation_id: int, applied_data: dict):
    """Guardar evaluación de conocimiento aplicado"""
    query = """
        INSERT INTO applied_knowledge 
        (evaluation_id, describio_procedimiento, identifico_riesgos, identifico_epp, describio_incidentes)
        VALUES (:evaluation_id, :describio_procedimiento, :identifico_riesgos, :identifico_epp, :describio_incidentes)
    """
    
    data = {
        "evaluation_id": evaluation_id,
        **applied_data
    }
    
    return await execute(query, data)

async def save_feedback(evaluation_id: int, feedback_data: dict):
    """Guardar feedback final"""
    query = """
        INSERT INTO feedback 
        (evaluation_id, hizo_sugerencia, cual_sugerencia, aprobo, requiere_entrenamiento)
        VALUES (:evaluation_id, :hizo_sugerencia, :cual_sugerencia, :aprobo, :requiere_entrenamiento)
    """
    
    data = {
        "evaluation_id": evaluation_id,
        **feedback_data
    }
    
    return await execute(query, data)

async def complete_evaluation(evaluation_id: int):
    """Marcar evaluación como completada"""
    query = """
        UPDATE evaluations 
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE id = :evaluation_id
    """
    return await execute(query, {"evaluation_id": evaluation_id})

async def get_evaluation_results(evaluation_id: int):
    """Obtener resultados completos de una evaluación"""
    
    # Datos básicos de la evaluación
    eval_query = """
        SELECT e.*, p.codigo, p.nombre as procedure_name
        FROM evaluations e
        JOIN procedures p ON e.procedure_id = p.id
        WHERE e.id = :evaluation_id
    """
    evaluation = await fetch_one(eval_query, {"evaluation_id": evaluation_id})
    
    # Respuestas con preguntas
    answers_query = """
        SELECT a.*, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer
        FROM answers a
        JOIN questions q ON a.question_id = q.id
        WHERE a.evaluation_id = :evaluation_id
        ORDER BY q.id
    """
    answers = await fetch_all(answers_query, {"evaluation_id": evaluation_id})
    
    # Conocimiento aplicado
    applied_query = """
        SELECT * FROM applied_knowledge WHERE evaluation_id = :evaluation_id
    """
    applied = await fetch_one(applied_query, {"evaluation_id": evaluation_id})
    
    # Feedback
    feedback_query = """
        SELECT * FROM feedback WHERE evaluation_id = :evaluation_id
    """
    feedback = await fetch_one(feedback_query, {"evaluation_id": evaluation_id})
    
    return {
        "evaluation": evaluation,
        "answers": answers,
        "applied": applied,
        "feedback": feedback
    }