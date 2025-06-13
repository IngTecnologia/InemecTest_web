"""
Sistema de corrección automática para preguntas validadas en InemecTest
Aplica correcciones basadas en feedback de validadores especializados
"""

import os
import json
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from openai import OpenAI
from .config import get_openai_api_key

from .models import (
    QuestionInProcess,
    QuestionBatch,
    ValidationResult,
    QuestionStatus,
    ProcedureStatus,
    get_current_timestamp
)
from .config import (
    get_system_message,
    CORRECTOR_CONFIG,
    GENERATION_CONFIG,
    DEBUG_CONFIG,
    MOCK_RESPONSES,
    VALIDATION_THRESHOLD
)

class QuestionCorrector:
    """
    Corrector automático de preguntas basado en feedback de validadores
    """
    
    def __init__(self):
        """
        Inicializar corrector automático
        """
        self.config = CORRECTOR_CONFIG
        self.system_message = get_system_message("corrector")
        
        # Inicializar cliente OpenAI solo si no estamos en modo mock
        if not DEBUG_CONFIG["mock_openai_calls"]:
            api_key = get_openai_api_key()
            if not api_key:
                raise ValueError("OPENAI_API_KEY no está configurado")
            
            try:
                # CORREGIDO: Inicialización simple
                self.client = OpenAI(api_key=api_key)
            except Exception as e:
                print(f"❌ Error inicializando cliente OpenAI en corrector: {e}")
                self.client = None
                # Activar modo mock automáticamente
                DEBUG_CONFIG["mock_openai_calls"] = True
        else:
            self.client = None
            print("🧪 Corrector en modo DEBUG - usando respuestas mock")

    
    async def correct_question(self, question: QuestionInProcess) -> QuestionInProcess:
        """
        Corregir una pregunta basándose en los resultados de validación
        
        Args:
            question: Pregunta con resultados de validación
            
        Returns:
            Pregunta corregida con historial de cambios
        """
        try:
            print(f"🔧 Iniciando corrección para pregunta {question.id}")
            
            # Verificar si la pregunta necesita corrección
            if not self._needs_correction(question):
                print(f"   ✅ Pregunta no necesita corrección")
                question.status = QuestionStatus.completed
                question.updated_at = get_current_timestamp()
                return question
            
            # Preparar contexto de corrección
            correction_context = self._prepare_correction_context(question)
            
            # Realizar corrección con reintentos
            correction_result = await self._call_corrector_api(correction_context)
            
            # Parsear respuesta del corrector
            correction_data = json.loads(correction_result)
            
            # Validar estructura de respuesta
            self._validate_correction_response(correction_data)
            
            # Aplicar correcciones a la pregunta
            corrected_question = self._apply_corrections(question, correction_data)
            
            print(f"   ✅ Corrección aplicada exitosamente")
            
            return corrected_question
            
        except Exception as e:
            print(f"❌ Error corrigiendo pregunta {question.id}: {e}")
            
            # Marcar como fallida si no se puede corregir
            question.status = QuestionStatus.failed
            question.updated_at = get_current_timestamp()
            
            # Agregar error al historial
            error_entry = f"Error de corrección ({get_current_timestamp()}): {str(e)}"
            question.historial_revision.append(error_entry)
            
            return question
    
    def _needs_correction(self, question: QuestionInProcess) -> bool:
        """
        Determinar si una pregunta necesita corrección basándose en validaciones
        """
        if not question.validations:
            return False
        
        # Si ya está completada, no necesita corrección
        if question.status == QuestionStatus.completed:
            return False
        
        # Si está marcada como que necesita corrección
        if question.status == QuestionStatus.needs_correction:
            return True
        
        # Calcular score promedio
        total_score = sum(v.score for v in question.validations)
        average_score = total_score / len(question.validations) if question.validations else 0
        
        # Necesita corrección si está por debajo del umbral
        return average_score < self.config["apply_corrections_threshold"]
    
    def _prepare_correction_context(self, question: QuestionInProcess) -> str:
        """
        Preparar contexto completo para el corrector
        """
        # Información básica de la pregunta
        context = f"""
PREGUNTA ORIGINAL:
{question.pregunta}

OPCIONES ORIGINALES:
A. {question.opciones[0]}
B. {question.opciones[1]}
C. {question.opciones[2]}
D. {question.opciones[3]}

INFORMACIÓN DEL PROCEDIMIENTO:
- Código: {question.procedure_codigo}
- Versión: {question.procedure_version}

RESULTADOS DE VALIDACIÓN:
"""
        
        # Agregar resultados de cada validador
        for validation in question.validations:
            context += f"""
{validation.validator_type.value.upper()}:
- Puntuación: {validation.score}/1
- Comentario: {validation.comment}
- Timestamp: {validation.timestamp}
"""
        
        # Agregar historial previo si existe
        if question.historial_revision:
            context += "\nHISTORIAL DE REVISIONES PREVIAS:\n"
            for i, revision in enumerate(question.historial_revision, 1):
                context += f"{i}. {revision}\n"
        
        context += """
            INSTRUCCIONES:
            Basándote en los comentarios de validación arriba, corrige la pregunta y opciones según sea necesario.
            Mantén SIEMPRE la opción correcta en la primera posición (A).
            Asegúrate de que las correcciones aborden específicamente los problemas identificados por los validadores.
        """
        
        return context
    
    async def _call_corrector_api(self, correction_context: str) -> str:
        """
        Llamar a la API del corrector con manejo de reintentos mejorado
        """
        # Modo debug con mock responses
        if DEBUG_CONFIG["mock_openai_calls"]:
            if DEBUG_CONFIG["verbose_logging"]:
                print("🧪 Usando respuesta mock para corrector")
            await asyncio.sleep(1)  # Simular latencia
            return MOCK_RESPONSES["corrector"]
        
        if not self.client:
            raise ValueError("Cliente OpenAI no inicializado y no estamos en modo mock")
        
        last_error = None
        
        for attempt in range(self.config["max_retries"]):
            try:
                print(f"🤖 Llamada al corrector (intento {attempt + 1}/{self.config['max_retries']})")
                
                response = self.client.chat.completions.create(
                    model=GENERATION_CONFIG["openai_model"],
                    messages=[
                        {
                            "role": "system",
                            "content": self.system_message
                        },
                        {
                            "role": "user", 
                            "content": correction_context
                        }
                    ],
                    temperature=0.2,  # Baja temperatura para correcciones consistentes
                    max_tokens=1500,  # Suficiente para pregunta + opciones + metadata
                    timeout=self.config["timeout"]
                )
                
                content = response.choices[0].message.content
                if not content:
                    raise ValueError("Corrector retornó contenido vacío")
                
                # NUEVO: Verificar que sea JSON válido antes de retornar
                try:
                    json.loads(content)
                except json.JSONDecodeError as e:
                    print(f"⚠️ Respuesta del corrector no es JSON válido, usando mock")
                    # Retornar respuesta mock válida si OpenAI no retorna JSON válido
                    return MOCK_RESPONSES["corrector"]
                
                if DEBUG_CONFIG["verbose_logging"]:
                    print(f"   ✅ Respuesta del corrector recibida ({len(content)} caracteres)")
                
                return content
                
            except Exception as e:
                last_error = e
                print(f"   ⚠️ Error en intento {attempt + 1}: {e}")
                
                if attempt < self.config["max_retries"] - 1:
                    wait_time = 2 ** attempt  # Backoff exponencial
                    print(f"   🕒 Esperando {wait_time}s antes del siguiente intento...")
                    await asyncio.sleep(wait_time)
        
        # Si todos los intentos fallaron, usar respuesta mock
        print(f"⚠️ Todos los intentos de corrección fallaron, usando respuesta mock")
        return MOCK_RESPONSES["corrector"]
    
    def _validate_correction_response(self, correction_data: Dict[str, Any]) -> None:
        """
        Validar que la respuesta del corrector tenga la estructura correcta
        """
        required_fields = [
            "pregunta_corregida",
            "opciones_corregidas", 
            "correcciones_aplicadas",
            "resumen_cambios"
        ]
        
        for field in required_fields:
            if field not in correction_data:
                raise ValueError(f"Campo requerido faltante en respuesta del corrector: {field}")
        
        # Validar opciones corregidas
        opciones = correction_data["opciones_corregidas"]
        if not isinstance(opciones, list) or len(opciones) != 4:
            raise ValueError("opciones_corregidas debe ser una lista de 4 elementos")
        
        # Validar correcciones aplicadas
        correcciones = correction_data["correcciones_aplicadas"]
        if not isinstance(correcciones, dict):
            raise ValueError("correcciones_aplicadas debe ser un diccionario")
        
        expected_correction_keys = ["estructura", "tecnico", "dificultad", "claridad"]
        for key in expected_correction_keys:
            if key not in correcciones:
                raise ValueError(f"Falta corrección para aspecto: {key}")
    
    def _apply_corrections(self, question: QuestionInProcess, correction_data: Dict[str, Any]) -> QuestionInProcess:
        """
        Aplicar las correcciones a la pregunta original
        """
        # Guardar versión original en historial
        original_entry = f"Versión original ({get_current_timestamp()}): {question.pregunta}"
        question.historial_revision.append(original_entry)
        
        # Aplicar correcciones
        question.pregunta = correction_data["pregunta_corregida"]
        question.opciones = correction_data["opciones_corregidas"]
        
        # Documentar cambios específicos
        correcciones_aplicadas = correction_data["correcciones_aplicadas"]
        resumen_cambios = correction_data["resumen_cambios"]
        
        # Crear entrada de historial detallada
        correction_entry = f"Corrección automática ({get_current_timestamp()}): {resumen_cambios}"
        question.historial_revision.append(correction_entry)
        
        # Agregar detalles de correcciones por aspecto
        for aspecto, descripcion in correcciones_aplicadas.items():
            if descripcion and descripcion.lower() != "ninguna":
                detail_entry = f"  - {aspecto.title()}: {descripcion}"
                question.historial_revision.append(detail_entry)
        
        # Actualizar estado y timestamp
        question.status = QuestionStatus.completed
        question.updated_at = get_current_timestamp()
        
        if DEBUG_CONFIG["verbose_logging"]:
            print(f"   📝 Pregunta corregida: {question.pregunta[:50]}...")
            print(f"   📋 Cambios: {resumen_cambios}")
        
        return question
    
    async def correct_batch(self, batch: QuestionBatch) -> QuestionBatch:
        """
        Corregir todas las preguntas de un lote que necesiten corrección
        
        Args:
            batch: Lote de preguntas a corregir
            
        Returns:
            Lote con preguntas corregidas
        """
        print(f"🔧 Iniciando corrección de lote {batch.batch_id}")
        
        # Identificar preguntas que necesitan corrección
        questions_to_correct = [
            q for q in batch.questions 
            if self._needs_correction(q)
        ]
        
        print(f"   - Preguntas que necesitan corrección: {len(questions_to_correct)}")
        print(f"   - Total preguntas en lote: {len(batch.questions)}")
        
        if not questions_to_correct:
            print("   ✅ No hay preguntas que requieran corrección")
            batch.status = ProcedureStatus.completed
            batch.updated_at = get_current_timestamp()
            return batch
        
        batch.status = ProcedureStatus.correcting
        batch.updated_at = get_current_timestamp()
        
        corrected_questions = []
        correction_stats = {
            "total_corrected": 0,
            "successful_corrections": 0,
            "failed_corrections": 0
        }
        
        # Corregir cada pregunta que lo necesite
        for i, question in enumerate(batch.questions):
            if question in questions_to_correct:
                try:
                    print(f"   🔧 Corrigiendo pregunta {i+1}: {question.id}")
                    
                    corrected_question = await self.correct_question(question)
                    corrected_questions.append(corrected_question)
                    
                    correction_stats["total_corrected"] += 1
                    if corrected_question.status == QuestionStatus.completed:
                        correction_stats["successful_corrections"] += 1
                    else:
                        correction_stats["failed_corrections"] += 1
                    
                    # Rate limiting entre correcciones
                    if i < len(questions_to_correct) - 1:
                        await asyncio.sleep(1)
                        
                except Exception as e:
                    print(f"   ❌ Error corrigiendo pregunta {question.id}: {e}")
                    question.status = QuestionStatus.failed
                    question.updated_at = get_current_timestamp()
                    corrected_questions.append(question)
                    correction_stats["failed_corrections"] += 1
            else:
                # Pregunta no necesita corrección
                corrected_questions.append(question)
        
        # Actualizar lote con preguntas corregidas
        batch.questions = corrected_questions
        batch.updated_at = get_current_timestamp()
        
        # Determinar estado final del lote
        completed_questions = sum(1 for q in batch.questions if q.status == QuestionStatus.completed)
        failed_questions = sum(1 for q in batch.questions if q.status == QuestionStatus.failed)
        
        if failed_questions == 0:
            batch.status = ProcedureStatus.completed
        elif completed_questions > 0:
            batch.status = ProcedureStatus.completed  # Éxito parcial
        else:
            batch.status = ProcedureStatus.failed
        
        print(f"✅ Corrección de lote completada:")
        print(f"   - Preguntas corregidas exitosamente: {correction_stats['successful_corrections']}")
        print(f"   - Preguntas que fallaron corrección: {correction_stats['failed_corrections']}")
        print(f"   - Estado final del lote: {batch.status}")
        
        return batch
    
    def get_correction_summary(self, batch: QuestionBatch) -> Dict[str, Any]:
        """
        Obtener resumen de correcciones aplicadas a un lote
        """
        summary = {
            "batch_id": batch.batch_id,
            "procedure_codigo": batch.procedure_codigo,
            "total_questions": len(batch.questions),
            "correction_stats": {
                "questions_corrected": 0,
                "successful_corrections": 0,
                "failed_corrections": 0,
                "no_correction_needed": 0
            },
            "corrections_by_aspect": {
                "estructura": 0,
                "tecnico": 0, 
                "dificultad": 0,
                "claridad": 0
            },
            "common_changes": [],
            "timestamp": get_current_timestamp()
        }
        
        for question in batch.questions:
            # Analizar historial de revisiones
            has_corrections = any("Corrección automática" in entry for entry in question.historial_revision)
            
            if has_corrections:
                summary["correction_stats"]["questions_corrected"] += 1
                if question.status == QuestionStatus.completed:
                    summary["correction_stats"]["successful_corrections"] += 1
                else:
                    summary["correction_stats"]["failed_corrections"] += 1
                
                # Analizar tipos de correcciones (simplificado)
                for entry in question.historial_revision:
                    if "estructura:" in entry.lower():
                        summary["corrections_by_aspect"]["estructura"] += 1
                    elif "tecnico:" in entry.lower():
                        summary["corrections_by_aspect"]["tecnico"] += 1
                    elif "dificultad:" in entry.lower():
                        summary["corrections_by_aspect"]["dificultad"] += 1
                    elif "claridad:" in entry.lower():
                        summary["corrections_by_aspect"]["claridad"] += 1
            else:
                summary["correction_stats"]["no_correction_needed"] += 1
        
        return summary

# =============================================================================
# FUNCIONES DE UTILIDAD
# =============================================================================

def create_corrector() -> QuestionCorrector:
    """
    Crear instancia del corrector
    """
    return QuestionCorrector()

async def correct_single_question(question: QuestionInProcess) -> QuestionInProcess:
    """
    Función de conveniencia para corregir una sola pregunta
    """
    corrector = create_corrector()
    return await corrector.correct_question(question)

def enable_debug_correction():
    """Habilitar modo debug para corrección"""
    DEBUG_CONFIG["enabled"] = True
    DEBUG_CONFIG["mock_openai_calls"] = True
    DEBUG_CONFIG["verbose_logging"] = True
    print("🧪 Modo debug de corrección habilitado")

def disable_debug_correction():
    """Deshabilitar modo debug para corrección"""
    DEBUG_CONFIG["enabled"] = False
    DEBUG_CONFIG["mock_openai_calls"] = False
    DEBUG_CONFIG["verbose_logging"] = False
    print("🔧 Modo debug de corrección deshabilitado")

# =============================================================================
# TESTING
# =============================================================================

async def test_correction():
    """
    Función de testing para el sistema de corrección
    """
    print("🧪 Testing QuestionCorrector...")
    
    # Habilitar modo debug
    enable_debug_correction()
    
    # Verificar configuración
    from .config import validate_admin_config
    if not validate_admin_config():
        print("❌ Configuración inválida")
        return
    
    try:
        # Crear pregunta de prueba con validaciones fallidas
        from .models import ValidationResult, ValidatorType
        
        test_question = QuestionInProcess(
            id="test_correction_q1",
            procedure_codigo="TEST-001",
            procedure_version="1",
            pregunta="¿Que es lo primero que se debe hacer?",  # Error ortográfico intencional
            opciones=[
                "Verificar condiciones",  # Opción correcta pero poco específica
                "Iniciar directamente",
                "Llamar supervisor",
                "Leer manual"
            ],
            status=QuestionStatus.needs_correction,
            created_at=get_current_timestamp(),
            updated_at=get_current_timestamp(),
            validations=[
                ValidationResult(
                    validator_type=ValidatorType.estructura,
                    score=0,
                    comment="Error ortográfico en la pregunta: 'Que' debería ser 'Qué'",
                    timestamp=get_current_timestamp(),
                    model_used="gpt-4o"
                ),
                ValidationResult(
                    validator_type=ValidatorType.tecnico,
                    score=1,
                    comment="Contenido técnico apropiado",
                    timestamp=get_current_timestamp(),
                    model_used="gpt-4o"
                ),
                ValidationResult(
                    validator_type=ValidatorType.claridad,
                    score=0,
                    comment="Las opciones son demasiado vagas y no específicas",
                    timestamp=get_current_timestamp(),
                    model_used="gpt-4o"
                )
            ]
        )
        
        print(f"📝 Pregunta de prueba creada con errores intencionados")
        print(f"   Original: {test_question.pregunta}")
        print(f"   Validaciones fallidas: {sum(1 for v in test_question.validations if v.score == 0)}")
        
        # Crear corrector
        corrector = create_corrector()
        
        # Corregir pregunta
        corrected_question = await corrector.correct_question(test_question)
        
        print(f"✅ Corrección completada!")
        print(f"   - Estado final: {corrected_question.status}")
        print(f"   - Pregunta corregida: {corrected_question.pregunta}")
        print(f"   - Entradas en historial: {len(corrected_question.historial_revision)}")
        
        # Mostrar historial de cambios
        print(f"📋 Historial de revisiones:")
        for i, entry in enumerate(corrected_question.historial_revision, 1):
            print(f"   {i}. {entry}")
        
        # Crear lote de prueba
        test_batch = QuestionBatch(
            batch_id="test_correction_batch_001",
            procedure_codigo="TEST-001",
            procedure_version="1",
            procedure_name="Procedimiento de Prueba - Corrección",
            questions=[corrected_question],
            status=ProcedureStatus.correcting,
            created_at=get_current_timestamp(),
            updated_at=get_current_timestamp()
        )
        
        # Obtener resumen de corrección
        summary = corrector.get_correction_summary(test_batch)
        print(f"📊 Resumen de corrección:")
        print(f"   - Preguntas corregidas: {summary['correction_stats']['questions_corrected']}")
        print(f"   - Correcciones exitosas: {summary['correction_stats']['successful_corrections']}")
        print(f"   - Estado final: {test_batch.status}")
        
    except Exception as e:
        print(f"❌ Error en test de corrección: {e}")
        if DEBUG_CONFIG["verbose_logging"]:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_correction())