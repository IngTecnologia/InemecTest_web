"""
Gestor de sincronización para preguntas generadas
Maneja la sincronización entre generated_questions.json y Excel
"""

import json
import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
import pandas as pd

from .models import QuestionBatch, QuestionInProcess
from .utils import extract_procedure_code_and_version, create_tracking_key

class QuestionSyncManager:
    """
    Gestor de sincronización para preguntas generadas
    Maneja JSON master + Excel + tracking
    """
    
    def __init__(self):
        self.generated_questions_file = Path("backend/data/generated_questions.json")
        self.excel_file = Path("backend/data/procedimientos_y_preguntas.xlsx")
        self.tracking_file = Path("backend/data/question_generation_tracking.json")
        
        # Asegurar que el directorio existe
        self.generated_questions_file.parent.mkdir(parents=True, exist_ok=True)
        
        print(f"🔄 QuestionSyncManager inicializado:")
        print(f"   - JSON master: {self.generated_questions_file}")
        print(f"   - Excel: {self.excel_file}")
        print(f"   - Tracking: {self.tracking_file}")
    
    def load_generated_questions(self) -> Dict[str, Any]:
        """Cargar preguntas generadas desde JSON master"""
        if not self.generated_questions_file.exists():
            print(f"📝 Creando archivo JSON master: {self.generated_questions_file}")
            initial_data = {
                "metadata": {
                    "created_at": datetime.now().isoformat(),
                    "last_updated": datetime.now().isoformat(),
                    "total_procedures": 0,
                    "total_questions": 0,
                    "version": "2.0.0"
                },
                "procedures": {},
                "questions_by_procedure": {}
            }
            self.save_generated_questions(initial_data)
            return initial_data
        
        try:
            with open(self.generated_questions_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"❌ Error cargando JSON master: {e}")
            return self.load_generated_questions()  # Recrear si hay error
    
    def save_generated_questions(self, data: Dict[str, Any]):
        """Guardar preguntas en JSON master"""
        try:
            # Actualizar metadata
            data["metadata"]["last_updated"] = datetime.now().isoformat()
            data["metadata"]["total_procedures"] = len(data.get("procedures", {}))
            data["metadata"]["total_questions"] = sum(
                len(questions) for questions in data.get("questions_by_procedure", {}).values()
            )
            
            with open(self.generated_questions_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"💾 JSON master actualizado: {data['metadata']['total_questions']} preguntas")
            
        except Exception as e:
            print(f"❌ Error guardando JSON master: {e}")
            raise
    
    def add_batch_to_json(self, batch: QuestionBatch) -> bool:
        """
        Agregar un lote de preguntas al JSON master
        
        Args:
            batch: Lote de preguntas completado
            
        Returns:
            bool: True si se agregó exitosamente
        """
        try:
            data = self.load_generated_questions()
            
            # Datos del procedimiento
            procedure_key = f"{batch.procedure_codigo}_v{batch.procedure_version}"
            
            # Agregar información del procedimiento
            data["procedures"][procedure_key] = {
                "codigo": batch.procedure_codigo,
                "version": batch.procedure_version,
                "nombre": batch.procedure_name,
                "batch_id": batch.batch_id,
                "created_at": batch.created_at,
                "completed_at": batch.updated_at,
                "status": batch.status.value,
                "total_questions": len(batch.questions),
                "validation_score": batch.validation_score
            }
            
            # Agregar preguntas
            questions_data = []
            for question in batch.questions:
                question_data = {
                    "id": question.id,
                    "codigo_procedimiento": question.procedure_codigo,
                    "version_proc": int(question.procedure_version),
                    "version_preg": question.version_preg,
                    "prompt": question.prompt,
                    "puntaje_ia": question.puntaje_ia,
                    "puntaje_e1": 0,
                    "puntaje_e2": 0,
                    "puntaje_e3": 0,
                    "puntaje_e4": 0,
                    "comentario_e1": "",
                    "comentario_e2": "",
                    "comentario_e3": "",
                    "comentario_e4": "",
                    "pregunta": question.pregunta,
                    "opciones": question.opciones,
                    "historial_revision": question.historial_revision,
                    "status": question.status.value,
                    "created_at": question.created_at,
                    "updated_at": question.updated_at,
                    "validations": [
                        {
                            "validator_type": v.validator_type.value,
                            "score": v.score,
                            "comment": v.comment,
                            "timestamp": v.timestamp
                        }
                        for v in question.validations
                    ]
                }
                questions_data.append(question_data)
            
            data["questions_by_procedure"][procedure_key] = questions_data
            
            # Guardar archivo actualizado
            self.save_generated_questions(data)
            
            print(f"✅ Lote agregado al JSON master: {procedure_key} ({len(questions_data)} preguntas)")
            return True
            
        except Exception as e:
            print(f"❌ Error agregando lote al JSON master: {e}")
            return False
    
    async def sync_to_excel(self, batch: QuestionBatch) -> bool:
        """
        Sincronizar un lote de preguntas al archivo Excel
        
        Args:
            batch: Lote de preguntas a sincronizar
            
        Returns:
            bool: True si se sincronizó exitosamente
        """
        try:
            from ..excel_handler import ExcelHandler
            
            # Usar el ExcelHandler existente para mantener consistencia
            excel_handler = ExcelHandler()
            
            # Verificar si el procedimiento ya existe en Excel
            procedures = await excel_handler.get_all_procedures()
            procedure_exists = any(p["codigo"] == batch.procedure_codigo for p in procedures)
            
            # Si el procedimiento no existe, agregarlo
            if not procedure_exists:
                await self._add_procedure_to_excel(batch)
            
            # Agregar preguntas al Excel
            await self._add_questions_to_excel(batch)
            
            print(f"✅ Lote sincronizado a Excel: {batch.procedure_codigo}")
            return True
            
        except Exception as e:
            print(f"❌ Error sincronizando a Excel: {e}")
            return False
    
    async def _add_procedure_to_excel(self, batch: QuestionBatch):
        """Agregar procedimiento a Excel si no existe"""
        try:
            # Leer Excel existente o crear uno nuevo
            if self.excel_file.exists():
                df_procedures = pd.read_excel(self.excel_file, sheet_name="Procedimientos")
            else:
                df_procedures = pd.DataFrame(columns=["Codigo", "Nombre", "Alcance", "Objetivo"])
            
            # Agregar nuevo procedimiento
            new_procedure = {
                "Codigo": batch.procedure_codigo,
                "Nombre": batch.procedure_name,
                "Alcance": f"Procedimiento {batch.procedure_codigo} versión {batch.procedure_version}",
                "Objetivo": "Generado automáticamente por InemecTest"
            }
            
            df_procedures = pd.concat([df_procedures, pd.DataFrame([new_procedure])], ignore_index=True)
            
            # Guardar de vuelta al Excel
            with pd.ExcelWriter(self.excel_file, mode='a' if self.excel_file.exists() else 'w', 
                              if_sheet_exists='replace' if self.excel_file.exists() else None) as writer:
                df_procedures.to_excel(writer, sheet_name="Procedimientos", index=False)
            
            print(f"✅ Procedimiento agregado a Excel: {batch.procedure_codigo}")
            
        except Exception as e:
            print(f"❌ Error agregando procedimiento a Excel: {e}")
            raise
    
    async def _add_questions_to_excel(self, batch: QuestionBatch):
        """Agregar preguntas a Excel"""
        try:
            # Leer Excel existente o crear uno nuevo
            if self.excel_file.exists():
                try:
                    df_questions = pd.read_excel(self.excel_file, sheet_name="Preguntas")
                except ValueError:
                    # Si la hoja no existe, crear DataFrame vacío
                    df_questions = pd.DataFrame(columns=[
                        "Procedure_Codigo", "Question_Text", "Option_A", "Option_B", "Option_C", "Option_D"
                    ])
            else:
                df_questions = pd.DataFrame(columns=[
                    "Procedure_Codigo", "Question_Text", "Option_A", "Option_B", "Option_C", "Option_D"
                ])
            
            # Agregar nuevas preguntas
            new_questions = []
            for question in batch.questions:
                new_question = {
                    "Procedure_Codigo": question.procedure_codigo,
                    "Question_Text": question.pregunta,
                    "Option_A": question.opciones[0] if len(question.opciones) > 0 else "",
                    "Option_B": question.opciones[1] if len(question.opciones) > 1 else "",
                    "Option_C": question.opciones[2] if len(question.opciones) > 2 else "",
                    "Option_D": question.opciones[3] if len(question.opciones) > 3 else ""
                }
                new_questions.append(new_question)
            
            df_questions = pd.concat([df_questions, pd.DataFrame(new_questions)], ignore_index=True)
            
            # Guardar de vuelta al Excel
            with pd.ExcelWriter(self.excel_file, mode='a' if self.excel_file.exists() else 'w', 
                              if_sheet_exists='replace' if self.excel_file.exists() else None) as writer:
                df_questions.to_excel(writer, sheet_name="Preguntas", index=False)
            
            print(f"✅ {len(new_questions)} preguntas agregadas a Excel")
            
        except Exception as e:
            print(f"❌ Error agregando preguntas a Excel: {e}")
            raise
    
    def update_tracking(self, batch: QuestionBatch) -> bool:
        """
        Actualizar archivo de tracking
        
        Args:
            batch: Lote completado
            
        Returns:
            bool: True si se actualizó exitosamente
        """
        try:
            # Cargar tracking existente
            if self.tracking_file.exists():
                with open(self.tracking_file, 'r', encoding='utf-8') as f:
                    tracking_data = json.load(f)
            else:
                tracking_data = {
                    "generated_questions": {},
                    "last_scan": None,
                    "scan_history": []
                }
            
            # Crear clave de tracking
            tracking_key = create_tracking_key(batch.procedure_codigo, int(batch.procedure_version))
            
            # Actualizar tracking
            tracking_data["generated_questions"][tracking_key] = {
                "codigo": batch.procedure_codigo,
                "version": batch.procedure_version,
                "fecha_generacion": batch.updated_at,
                "batch_id": batch.batch_id,
                "preguntas_count": len(batch.questions),
                "status": "completed",
                "validation_score": batch.validation_score
            }
            
            # Guardar tracking actualizado
            with open(self.tracking_file, 'w', encoding='utf-8') as f:
                json.dump(tracking_data, f, indent=2, ensure_ascii=False)
            
            print(f"✅ Tracking actualizado: {tracking_key}")
            return True
            
        except Exception as e:
            print(f"❌ Error actualizando tracking: {e}")
            return False
    
    async def sync_completed_batch(self, batch: QuestionBatch) -> Dict[str, bool]:
        """
        Sincronizar un lote completado a todos los destinos
        
        Args:
            batch: Lote de preguntas completado
            
        Returns:
            Dict[str, bool]: Estado de cada sincronización
        """
        results = {
            "json_master": False,
            "excel": False,
            "tracking": False
        }
        
        print(f"🔄 Iniciando sincronización completa para: {batch.procedure_codigo} v{batch.procedure_version}")
        
        # 1. Sincronizar a JSON master
        results["json_master"] = self.add_batch_to_json(batch)
        
        # 2. Sincronizar a Excel
        results["excel"] = await self.sync_to_excel(batch)
        
        # 3. Actualizar tracking
        results["tracking"] = self.update_tracking(batch)
        
        # Resumen
        successful = sum(results.values())
        total = len(results)
        
        print(f"📊 Sincronización completada: {successful}/{total} exitosas")
        for dest, success in results.items():
            status = "✅" if success else "❌"
            print(f"   {status} {dest}")
        
        return results
    
    def get_sync_status(self) -> Dict[str, Any]:
        """Obtener estado de sincronización"""
        json_data = self.load_generated_questions()
        
        return {
            "json_master": {
                "exists": self.generated_questions_file.exists(),
                "procedures": json_data["metadata"]["total_procedures"],
                "questions": json_data["metadata"]["total_questions"],
                "last_updated": json_data["metadata"]["last_updated"]
            },
            "excel": {
                "exists": self.excel_file.exists(),
                "size_mb": round(self.excel_file.stat().st_size / 1024 / 1024, 2) if self.excel_file.exists() else 0
            },
            "tracking": {
                "exists": self.tracking_file.exists(),
                "generated_count": len(self.load_tracking_data().get("generated_questions", {}))
            }
        }
    
    def load_tracking_data(self) -> Dict[str, Any]:
        """Cargar datos de tracking"""
        if self.tracking_file.exists():
            try:
                with open(self.tracking_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️ Error cargando tracking: {e}")
        
        return {
            "generated_questions": {},
            "last_scan": None,
            "scan_history": []
        }

# =============================================================================
# FUNCIONES DE UTILIDAD
# =============================================================================

def create_sync_manager() -> QuestionSyncManager:
    """Crear instancia del gestor de sincronización"""
    return QuestionSyncManager()

async def sync_batch_complete(batch: QuestionBatch) -> bool:
    """
    Función de conveniencia para sincronizar un lote completado
    
    Args:
        batch: Lote de preguntas completado
        
    Returns:
        bool: True si todas las sincronizaciones fueron exitosas
    """
    sync_manager = create_sync_manager()
    results = await sync_manager.sync_completed_batch(batch)
    return all(results.values())

# =============================================================================
# TESTING
# =============================================================================

async def test_sync_manager():
    """Test del gestor de sincronización"""
    print("🧪 Testing QuestionSyncManager...")
    
    sync_manager = create_sync_manager()
    
    # Mostrar estado actual
    status = sync_manager.get_sync_status()
    print(f"📊 Estado actual de sincronización:")
    for dest, info in status.items():
        print(f"   {dest}: {info}")
    
    print("✅ Test completado")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_sync_manager())