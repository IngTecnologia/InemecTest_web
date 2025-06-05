"""
Cargador de datos desde Excel para InemecTest
Este archivo carga procedimientos y preguntas desde archivo Excel
"""

import pandas as pd
import os
from typing import Dict, List
from .database import execute, fetch_one, fetch_all
from .config import (
    EXCEL_CONFIG, 
    SAMPLE_DATA_CONFIG,
    get_excel_file_path,
    get_procedures_column_mapping,
    get_questions_column_mapping
)

async def load_data_from_excel():
    """Cargar datos desde archivo Excel usando configuración"""
    
    try:
        print("📊 Cargando datos desde Excel...")
        
        # Obtener ruta del archivo desde configuración
        excel_file = get_excel_file_path()
        
        # Verificar que existe el archivo
        if not excel_file.exists():
            print(f"⚠️ Archivo Excel no encontrado: {excel_file}")
            print("📝 Usando datos de ejemplo en su lugar...")
            await insert_sample_data()
            return
        
        # Leer archivo Excel
        print(f"📖 Leyendo archivo: {excel_file}")
        
        # Cargar procedimientos
        procedures_sheet = EXCEL_CONFIG["sheets"]["procedures"]
        procedures_df = pd.read_excel(excel_file, sheet_name=procedures_sheet)
        print(f"📋 Procedimientos encontrados: {len(procedures_df)}")
        
        # Cargar preguntas  
        questions_sheet = EXCEL_CONFIG["sheets"]["questions"]
        questions_df = pd.read_excel(excel_file, sheet_name=questions_sheet)
        print(f"❓ Preguntas encontradas: {len(questions_df)}")
        
        # Insertar procedimientos
        await insert_procedures_from_df(procedures_df)
        
        # Insertar preguntas
        await insert_questions_from_df(questions_df)
        
        print("✅ Datos cargados exitosamente desde Excel")
        
    except Exception as e:
        print(f"❌ Error cargando desde Excel: {e}")
        print("📝 Usando datos de ejemplo en su lugar...")
        await insert_sample_data()

async def insert_procedures_from_df(df: pd.DataFrame):
    """Insertar procedimientos desde DataFrame usando configuración"""
    
    # Obtener mapeo de columnas desde configuración
    column_mapping = get_procedures_column_mapping()
    
    procedure_query = """
        INSERT INTO procedures (codigo, nombre, alcance, objetivo)
        VALUES (:codigo, :nombre, :alcance, :objetivo)
        ON CONFLICT (codigo) DO NOTHING
    """
    
    for _, row in df.iterrows():
        try:
            # Mapear datos de la fila
            proc_data = {}
            for excel_col, db_col in column_mapping.items():
                proc_data[db_col] = str(row[excel_col]) if pd.notna(row[excel_col]) else ""
            
            await execute(procedure_query, proc_data)
            print(f"✅ Procedimiento insertado: {proc_data['codigo']}")
            
        except Exception as e:
            print(f"❌ Error insertando procedimiento fila {_ + 2}: {e}")

async def insert_questions_from_df(df: pd.DataFrame):
    """Insertar preguntas desde DataFrame usando configuración"""
    
    # Obtener mapeo de columnas desde configuración
    column_mapping = get_questions_column_mapping()
    
    # Obtener IDs de procedimientos
    procedure_ids = await get_procedure_ids()
    
    question_query = """
        INSERT INTO questions 
        (procedure_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
        VALUES (:procedure_id, :question_text, :option_a, :option_b, :option_c, :option_d, :correct_answer)
    """
    
    for _, row in df.iterrows():
        try:
            # Mapear datos de la fila
            question_data = {}
            for excel_col, db_col in column_mapping.items():
                question_data[db_col] = str(row[excel_col]) if pd.notna(row[excel_col]) else ""
            
            # Obtener ID del procedimiento
            procedure_codigo = question_data['procedure_codigo']
            if procedure_codigo not in procedure_ids:
                print(f"⚠️ Procedimiento no encontrado: {procedure_codigo}")
                continue
            
            # Preparar datos para insertar
            insert_data = {
                'procedure_id': procedure_ids[procedure_codigo],
                'question_text': question_data['question_text'],
                'option_a': question_data['option_a'],
                'option_b': question_data['option_b'], 
                'option_c': question_data['option_c'],
                'option_d': question_data['option_d'],
                'correct_answer': EXCEL_CONFIG["correct_answer"]  # Desde configuración
            }
            
            await execute(question_query, insert_data)
            print(f"✅ Pregunta insertada para: {procedure_codigo}")
            
        except Exception as e:
            print(f"❌ Error insertando pregunta fila {_ + 2}: {e}")

async def get_procedure_ids() -> Dict[str, int]:
    """Obtener mapping de códigos de procedimiento a IDs"""
    
    query = "SELECT id, codigo FROM procedures"
    procedures = await fetch_all(query)
    
    return {proc['codigo']: proc['id'] for proc in procedures}

async def check_data_exists():
    """Verificar si ya existen datos en la base de datos"""
    try:
        proc_count = await fetch_one("SELECT COUNT(*) as count FROM procedures")
        question_count = await fetch_one("SELECT COUNT(*) as count FROM questions")
        
        return {
            "procedures": proc_count["count"],
            "questions": question_count["count"]
        }
    except Exception as e:
        print(f"Error verificando datos existentes: {e}")
        return {"procedures": 0, "questions": 0}

async def insert_sample_data():
    """Insertar datos de ejemplo cuando no hay Excel (usando configuración)"""
    
    try:
        print("🔄 Insertando datos de ejemplo...")
        
        # Obtener datos de ejemplo desde configuración
        sample_procedures = SAMPLE_DATA_CONFIG["sample_procedures"]
        
        # Insertar procedimientos
        procedure_query = """
            INSERT INTO procedures (codigo, nombre, alcance, objetivo)
            VALUES (:codigo, :nombre, :alcance, :objetivo)
            ON CONFLICT (codigo) DO NOTHING
        """
        
        for proc_data in sample_procedures:
            await execute(procedure_query, proc_data)
        
        # Obtener IDs de procedimientos
        procedure_ids = await get_procedure_ids()
        
        # Preguntas de ejemplo (simplificadas)
        sample_questions = {
            "OP-001": [
                {
                    "question_text": "¿Cuál es el primer paso antes de arrancar una bomba centrífuga?",
                    "option_a": "Verificar que las válvulas de succión estén abiertas",
                    "option_b": "Encender el motor directamente",
                    "option_c": "Revisar el nivel de aceite del motor",
                    "option_d": "Contactar al supervisor"
                },
                {
                    "question_text": "¿Qué se debe verificar en el sistema de lubricación antes del arranque?",
                    "option_a": "Nivel y calidad del aceite lubricante",
                    "option_b": "Solo la temperatura del aceite",
                    "option_c": "Únicamente la presión de aceite",
                    "option_d": "No es necesario verificar nada"
                }
            ],
            "OP-002": [
                {
                    "question_text": "¿Con qué frecuencia se debe realizar mantenimiento preventivo a válvulas críticas?",
                    "option_a": "Según cronograma establecido en el plan de mantenimiento",
                    "option_b": "Solo cuando fallen",
                    "option_c": "Una vez al año sin excepción",
                    "option_d": "No requieren mantenimiento"
                }
            ]
        }
        
        # Insertar preguntas
        question_query = """
            INSERT INTO questions 
            (procedure_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
            VALUES (:procedure_id, :question_text, :option_a, :option_b, :option_c, :option_d, :correct_answer)
        """
        
        for codigo, questions in sample_questions.items():
            if codigo in procedure_ids:
                procedure_id = procedure_ids[codigo]
                
                for question_data in questions:
                    question_with_id = {
                        "procedure_id": procedure_id,
                        "correct_answer": EXCEL_CONFIG["correct_answer"],  # Desde configuración
                        **question_data
                    }
                    await execute(question_query, question_with_id)
        
        print("✅ Datos de ejemplo insertados correctamente")
        
    except Exception as e:
        print(f"❌ Error insertando datos de ejemplo: {e}")
        raise e