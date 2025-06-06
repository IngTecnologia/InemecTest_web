"""
Manejador de archivos Excel para InemecTest
Versión completa y funcional basada en Excel
"""

import pandas as pd
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment

from .config import (
    get_data_file_path, 
    get_results_file_path,
    DATA_SHEETS,
    RESULTS_SHEETS,
    PROCEDURES_COLUMNS,
    QUESTIONS_COLUMNS,
    EVALUATIONS_COLUMNS,
    ANSWERS_COLUMNS,
    APPLIED_KNOWLEDGE_COLUMNS,
    FEEDBACK_COLUMNS,
    VALID_CAMPOS,
    VALID_OPTIONS,
    VALID_SI_NO,
    ensure_data_directory
)

class ExcelHandler:
    """Clase para manejar todas las operaciones con Excel"""
    
    def __init__(self):
        ensure_data_directory()
        self.data_file = get_data_file_path()
        self.results_file = get_results_file_path()
        print(f"📁 Excel Handler inicializado:")
        print(f"   - Archivo de datos: {self.data_file}")
        print(f"   - Archivo de resultados: {self.results_file}")
    
    # =================================================================
    # LECTURA DE DATOS (Procedimientos y Preguntas)
    # =================================================================
    
    async def get_all_procedures(self) -> List[Dict[str, Any]]:
        """Obtener todos los procedimientos desde Excel"""
        try:
            if not self.data_file.exists():
                print(f"⚠️ Archivo de datos no encontrado: {self.data_file}")
                return []
            
            # Leer hoja de procedimientos
            df = pd.read_excel(self.data_file, sheet_name=DATA_SHEETS["procedures"]["name"])
            
            procedures = []
            for index, row in df.iterrows():
                # Saltar filas completamente vacías
                if pd.isna(row.iloc[0]) or str(row.iloc[0]).strip() == "":
                    continue
                
                try:
                    procedure = {
                        "codigo": str(row.iloc[self._get_col_index(PROCEDURES_COLUMNS["codigo"])]).strip(),
                        "nombre": str(row.iloc[self._get_col_index(PROCEDURES_COLUMNS["nombre"])]).strip(),
                        "alcance": str(row.iloc[self._get_col_index(PROCEDURES_COLUMNS["alcance"])]).strip(),
                        "objetivo": str(row.iloc[self._get_col_index(PROCEDURES_COLUMNS["objetivo"])]).strip()
                    }
                    
                    # Validar que el código no esté vacío
                    if procedure["codigo"] and procedure["codigo"] != "nan":
                        procedures.append(procedure)
                        
                except Exception as e:
                    print(f"⚠️ Error procesando fila {index + 2}: {e}")
                    continue
            
            print(f"✅ Cargados {len(procedures)} procedimientos")
            return procedures
            
        except Exception as e:
            print(f"❌ Error leyendo procedimientos: {e}")
            return []
    
    async def get_procedure_by_code(self, codigo: str) -> Optional[Dict[str, Any]]:
        """Obtener un procedimiento específico por código"""
        procedures = await self.get_all_procedures()
        
        for proc in procedures:
            if proc["codigo"].upper() == codigo.upper():
                return proc
        
        return None
    
    async def get_questions_by_procedure(self, procedure_codigo: str) -> List[Dict[str, Any]]:
        """Obtener preguntas de un procedimiento específico"""
        try:
            if not self.data_file.exists():
                print(f"⚠️ Archivo de datos no encontrado: {self.data_file}")
                return []
            
            # Leer hoja de preguntas
            df = pd.read_excel(self.data_file, sheet_name=DATA_SHEETS["questions"]["name"])
            
            questions = []
            question_id = 1
            
            for index, row in df.iterrows():
                # Saltar filas vacías
                if pd.isna(row.iloc[0]) or str(row.iloc[0]).strip() == "":
                    continue
                
                try:
                    row_procedure_codigo = str(row.iloc[self._get_col_index(QUESTIONS_COLUMNS["procedure_codigo"])]).strip()
                    
                    if row_procedure_codigo.upper() == procedure_codigo.upper():
                        question = {
                            "id": question_id,
                            "procedure_codigo": row_procedure_codigo,
                            "question_text": str(row.iloc[self._get_col_index(QUESTIONS_COLUMNS["question_text"])]).strip(),
                            "option_a": str(row.iloc[self._get_col_index(QUESTIONS_COLUMNS["option_a"])]).strip(),
                            "option_b": str(row.iloc[self._get_col_index(QUESTIONS_COLUMNS["option_b"])]).strip(),
                            "option_c": str(row.iloc[self._get_col_index(QUESTIONS_COLUMNS["option_c"])]).strip(),
                            "option_d": str(row.iloc[self._get_col_index(QUESTIONS_COLUMNS["option_d"])]).strip(),
                            "correct_answer": str(row.iloc[self._get_col_index(QUESTIONS_COLUMNS["correct_answer"])]).strip().upper()
                        }
                        
                        # Validar que la pregunta esté completa
                        if (question["question_text"] and question["question_text"] != "nan" and
                            question["correct_answer"] in VALID_OPTIONS):
                            questions.append(question)
                            question_id += 1
                            
                except Exception as e:
                    print(f"⚠️ Error procesando pregunta en fila {index + 2}: {e}")
                    continue
            
            print(f"✅ Cargadas {len(questions)} preguntas para {procedure_codigo}")
            return questions
            
        except Exception as e:
            print(f"❌ Error leyendo preguntas para {procedure_codigo}: {e}")
            return []
    
    # =================================================================
    # ESCRITURA DE RESULTADOS
    # =================================================================
    
    async def save_evaluation_result(self, evaluation_data: Dict[str, Any]) -> str:
        """Guardar resultado completo de evaluación en Excel"""
        try:
            # Generar ID único para la evaluación
            evaluation_id = str(uuid.uuid4())[:8].upper()
            
            # Preparar todas las hojas de datos
            evaluation_row = await self._prepare_evaluation_row(evaluation_id, evaluation_data)
            answers_rows = await self._prepare_answers_rows(evaluation_id, evaluation_data)
            applied_row = await self._prepare_applied_knowledge_row(evaluation_id, evaluation_data)
            feedback_row = await self._prepare_feedback_row(evaluation_id, evaluation_data)
            
            # Escribir a Excel
            await self._write_to_results_excel(
                evaluation_row=evaluation_row,
                answers_rows=answers_rows,
                applied_row=applied_row,
                feedback_row=feedback_row
            )
            
            print(f"✅ Evaluación guardada con ID: {evaluation_id}")
            return evaluation_id
            
        except Exception as e:
            print(f"❌ Error guardando evaluación: {e}")
            raise e
    
    async def _prepare_evaluation_row(self, evaluation_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Preparar fila principal de evaluación"""
        now = datetime.now()
        score_data = data.get("score_data", {})
        
        return {
            "evaluation_id": evaluation_id,
            "nombre": data["user_data"]["nombre"],
            "cargo": data["user_data"]["cargo"],
            "campo": data["user_data"]["campo"],
            "procedure_codigo": data["procedure_codigo"],
            "procedure_nombre": data.get("procedure_nombre", ""),
            "total_questions": score_data.get("total_questions", 0),
            "correct_answers": score_data.get("correct_answers", 0),
            "score_percentage": score_data.get("score_percentage", 0),
            "aprobo": data["feedback"]["aprobo"],
            "started_at": now.strftime("%Y-%m-%d %H:%M:%S"),
            "completed_at": now.strftime("%Y-%m-%d %H:%M:%S")
        }
    
    async def _prepare_answers_rows(self, evaluation_id: str, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Preparar filas de respuestas detalladas"""
        rows = []
        
        for i, answer in enumerate(data["knowledge_answers"], 1):
            row = {
                "evaluation_id": evaluation_id,
                "question_id": answer.get("question_id", i),
                "question_text": answer.get("question_text", ""),
                "selected_option": answer["selected_option"],
                "selected_text": answer.get("selected_text", ""),
                "correct_option": answer.get("correct_option", ""),
                "correct_text": answer.get("correct_text", ""),
                "is_correct": "Sí" if answer.get("is_correct", False) else "No"
            }
            rows.append(row)
        
        return rows
    
    async def _prepare_applied_knowledge_row(self, evaluation_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Preparar fila de conocimiento aplicado"""
        applied = data["applied_knowledge"]
        
        return {
            "evaluation_id": evaluation_id,
            "describio_procedimiento": "Sí" if applied["describio_procedimiento"] else "No",
            "identifico_riesgos": "Sí" if applied["identifico_riesgos"] else "No",
            "identifico_epp": "Sí" if applied["identifico_epp"] else "No",
            "describio_incidentes": "Sí" if applied["describio_incidentes"] else "No"
        }
    
    async def _prepare_feedback_row(self, evaluation_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Preparar fila de feedback"""
        feedback = data["feedback"]
        
        return {
            "evaluation_id": evaluation_id,
            "hizo_sugerencia": feedback["hizo_sugerencia"],
            "cual_sugerencia": feedback.get("cual_sugerencia", ""),
            "requiere_entrenamiento": feedback.get("requiere_entrenamiento", "")
        }
    
    async def _write_to_results_excel(self, **data_rows):
        """Escribir todos los datos al archivo de resultados Excel"""
        try:
            # Crear archivo si no existe
            if not self.results_file.exists():
                await self._create_results_file()
            
            # Cargar workbook existente
            wb = load_workbook(self.results_file)
            
            # Escribir en cada hoja
            await self._append_to_sheet(wb, RESULTS_SHEETS["evaluations"]["name"], 
                                      data_rows["evaluation_row"], EVALUATIONS_COLUMNS)
            
            for answer_row in data_rows["answers_rows"]:
                await self._append_to_sheet(wb, RESULTS_SHEETS["answers"]["name"], 
                                          answer_row, ANSWERS_COLUMNS)
            
            await self._append_to_sheet(wb, RESULTS_SHEETS["applied_knowledge"]["name"], 
                                      data_rows["applied_row"], APPLIED_KNOWLEDGE_COLUMNS)
            
            await self._append_to_sheet(wb, RESULTS_SHEETS["feedback"]["name"], 
                                      data_rows["feedback_row"], FEEDBACK_COLUMNS)
            
            # Guardar archivo
            wb.save(self.results_file)
            wb.close()
            
        except Exception as e:
            print(f"❌ Error escribiendo resultados: {e}")
            raise e
    
    async def _create_results_file(self):
        """Crear archivo de resultados con headers"""
        wb = Workbook()
        
        # Eliminar hoja por defecto
        wb.remove(wb.active)
        
        # Crear hojas con headers
        sheets_config = [
            (RESULTS_SHEETS["evaluations"]["name"], EVALUATIONS_COLUMNS),
            (RESULTS_SHEETS["answers"]["name"], ANSWERS_COLUMNS),
            (RESULTS_SHEETS["applied_knowledge"]["name"], APPLIED_KNOWLEDGE_COLUMNS),
            (RESULTS_SHEETS["feedback"]["name"], FEEDBACK_COLUMNS)
        ]
        
        for sheet_name, columns_config in sheets_config:
            ws = wb.create_sheet(title=sheet_name)
            
            # Escribir headers
            for field_name, column_letter in columns_config.items():
                col_index = self._get_col_index(column_letter)
                header_text = field_name.replace("_", " ").title()
                ws.cell(row=1, column=col_index + 1, value=header_text)
                
                # Estilo para headers
                cell = ws.cell(row=1, column=col_index + 1)
                cell.font = Font(bold=True)
                cell.fill = PatternFill(start_color="CCCCCC", end_color="CCCCCC", fill_type="solid")
                cell.alignment = Alignment(horizontal="center")
        
        wb.save(self.results_file)
        wb.close()
        print(f"✅ Archivo de resultados creado: {self.results_file}")
    
    async def _append_to_sheet(self, wb, sheet_name: str, data: Dict[str, Any], columns_config: Dict[str, str]):
        """Agregar fila de datos a una hoja específica"""
        ws = wb[sheet_name]
        
        # Encontrar próxima fila vacía
        next_row = ws.max_row + 1
        
        # Escribir datos en las columnas correspondientes
        for field_name, column_letter in columns_config.items():
            if field_name in data:
                col_index = self._get_col_index(column_letter)
                ws.cell(row=next_row, column=col_index + 1, value=data[field_name])
    
    # =================================================================
    # FUNCIONES DE CONSULTA DE RESULTADOS
    # =================================================================
    
    async def get_evaluation_results(self, evaluation_id: str) -> Optional[Dict[str, Any]]:
        """Obtener resultados completos de una evaluación"""
        try:
            if not self.results_file.exists():
                return None
            
            # Leer todas las hojas
            evaluation_df = pd.read_excel(self.results_file, sheet_name=RESULTS_SHEETS["evaluations"]["name"])
            answers_df = pd.read_excel(self.results_file, sheet_name=RESULTS_SHEETS["answers"]["name"])
            applied_df = pd.read_excel(self.results_file, sheet_name=RESULTS_SHEETS["applied_knowledge"]["name"])
            feedback_df = pd.read_excel(self.results_file, sheet_name=RESULTS_SHEETS["feedback"]["name"])
            
            # Filtrar por evaluation_id
            evaluation_row = evaluation_df[evaluation_df['Evaluation Id'] == evaluation_id]
            if evaluation_row.empty:
                return None
            
            answers_rows = answers_df[answers_df['Evaluation Id'] == evaluation_id]
            applied_row = applied_df[applied_df['Evaluation Id'] == evaluation_id]
            feedback_row = feedback_df[feedback_df['Evaluation Id'] == evaluation_id]
            
            # Construir resultado
            result = {
                "evaluation": evaluation_row.iloc[0].to_dict() if not evaluation_row.empty else {},
                "answers": [row.to_dict() for _, row in answers_rows.iterrows()],
                "applied": applied_row.iloc[0].to_dict() if not applied_row.empty else {},
                "feedback": feedback_row.iloc[0].to_dict() if not feedback_row.empty else {}
            }
            
            return result
            
        except Exception as e:
            print(f"❌ Error obteniendo resultados para {evaluation_id}: {e}")
            return None
    
    async def get_all_evaluations(self) -> List[Dict[str, Any]]:
        """Obtener lista de todas las evaluaciones"""
        try:
            if not self.results_file.exists():
                return []
            
            df = pd.read_excel(self.results_file, sheet_name=RESULTS_SHEETS["evaluations"]["name"])
            return [row.to_dict() for _, row in df.iterrows()]
            
        except Exception as e:
            print(f"❌ Error obteniendo evaluaciones: {e}")
            return []
    
    async def get_procedure_statistics(self) -> List[Dict[str, Any]]:
        """Obtener estadísticas por procedimiento"""
        try:
            if not self.results_file.exists():
                return []
            
            df = pd.read_excel(self.results_file, sheet_name=RESULTS_SHEETS["evaluations"]["name"])
            
            # Agrupar por procedimiento
            stats = []
            if not df.empty:
                for codigo in df['Procedure Codigo'].unique():
                    proc_data = df[df['Procedure Codigo'] == codigo]
                    
                    stat = {
                        "procedure_codigo": codigo,
                        "procedure_name": proc_data['Procedure Nombre'].iloc[0] if not proc_data.empty else "",
                        "total_evaluations": len(proc_data),
                        "average_score": round(proc_data['Score Percentage'].mean(), 2),
                        "approval_rate": round((proc_data['Aprobo'] == 'Sí').sum() / len(proc_data) * 100, 2)
                    }
                    stats.append(stat)
            
            return sorted(stats, key=lambda x: x['total_evaluations'], reverse=True)
            
        except Exception as e:
            print(f"❌ Error obteniendo estadísticas: {e}")
            return []
    
    # =================================================================
    # FUNCIONES AUXILIARES
    # =================================================================
    
    def _get_col_index(self, column_letter: str) -> int:
        """Convertir letra de columna a índice (A=0, B=1, etc.)"""
        return ord(column_letter.upper()) - ord('A')
    
    async def validate_data_file(self) -> Dict[str, Any]:
        """Validar archivo de datos y retornar información"""
        result = {
            "exists": False,
            "valid": False,
            "procedures_count": 0,
            "questions_count": 0,
            "errors": []
        }
        
        try:
            if not self.data_file.exists():
                result["errors"].append(f"Archivo no encontrado: {self.data_file}")
                return result
            
            result["exists"] = True
            
            # Verificar hojas
            excel_file = pd.ExcelFile(self.data_file)
            required_sheets = [DATA_SHEETS["procedures"]["name"], DATA_SHEETS["questions"]["name"]]
            
            for sheet in required_sheets:
                if sheet not in excel_file.sheet_names:
                    result["errors"].append(f"Hoja faltante: {sheet}")
            
            if result["errors"]:
                return result
            
            # Contar registros válidos
            procedures_df = pd.read_excel(self.data_file, sheet_name=DATA_SHEETS["procedures"]["name"])
            questions_df = pd.read_excel(self.data_file, sheet_name=DATA_SHEETS["questions"]["name"])
            
            # Contar solo filas con datos válidos
            valid_procedures = 0
            for _, row in procedures_df.iterrows():
                if not pd.isna(row.iloc[0]) and str(row.iloc[0]).strip() != "":
                    valid_procedures += 1
            
            valid_questions = 0
            for _, row in questions_df.iterrows():
                if not pd.isna(row.iloc[0]) and str(row.iloc[0]).strip() != "":
                    valid_questions += 1
            
            result["procedures_count"] = valid_procedures
            result["questions_count"] = valid_questions
            result["valid"] = valid_procedures > 0 and valid_questions > 0
            
        except Exception as e:
            result["errors"].append(f"Error validando archivo: {str(e)}")
        
        return result