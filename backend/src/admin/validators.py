"""
Sistema de validadores para preguntas generadas en InemecTest
Validación automática usando múltiples expertos especializados
"""

import os
import json
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from openai import OpenAI

from .models import (
    ValidationResult,
    ValidatorType,
    QuestionInProcess,
    QuestionBatch,
    QuestionStatus,
    get_current_timestamp
)
from .config import (
    get_system_message,
    get_validator_config,
    get_enabled_validators,
    VALIDATORS_CONFIG,
    VALIDATION_THRESHOLD,
    DEBUG_CONFIG,
    MOCK_RESPONSES,
    GENERATION_CONFIG
)

class QuestionValidator:
    """
    Validador individual para un aspecto específico de las preguntas
    """
    
    def __init__(self, validator_type: ValidatorType):
        """
        Inicializar validador específico
        
        Args:
            validator_type: Tipo de validador (estructura, tecnico, dificultad, claridad)
        """
        self.validator_type = validator_type
        self.config = get_validator_config(validator_type.value)
        self.system_message = get_system_message(f"validator_{validator_type.value}")
        
        # Inicializar cliente OpenAI solo si no estamos en modo mock
        if not DEBUG_CONFIG["mock_openai_calls"]:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY no está configurado")
            self.client = OpenAI(api_key=api_key)
        else:
            self.client = None
        
        print(f"🔍 Validador {validator_type.value} inicializado")
        if DEBUG_CONFIG["verbose_logging"]:
            print(f"   - Peso: {self.config['weight']}")
            print(f"   - Crítico: {self.config['critical']}")
            print(f"   - Timeout: {self.config['timeout']}s")
    
    async def validate_question(self, question: QuestionInProcess) -> ValidationResult:
        """
        Validar una pregunta específica
        
        Args:
            question: Pregunta a validar
            
        Returns:
            ValidationResult con puntuación y comentarios
        """
        try:
            print(f"🔍 Validando pregunta {question.id} con validador {self.validator_type.value}")
            
            # Preparar prompt para el validador
            question_prompt = self._prepare_question_prompt(question)
            
            # Realizar validación
            validation_response = await self._call_validator_api(question_prompt)
            
            # Parsear respuesta
            validation_data = json.loads(validation_response)
            
            # Validar estructura de respuesta
            self._validate_response_structure(validation_data)
            
            # Crear resultado
            result = ValidationResult(
                validator_type=self.validator_type,
                score=validation_data["score"],
                comment=validation_data["comment"],
                timestamp=get_current_timestamp(),
                model_used=GENERATION_CONFIG["openai_model"]
            )
            
            if DEBUG_CONFIG["verbose_logging"]:
                print(f"   ✅ Validación completada: Score={result.score}, Comment='{result.comment[:50]}...'")
            
            return result
            
        except Exception as e:
            print(f"❌ Error en validador {self.validator_type.value}: {e}")
            
            # Crear resultado de error
            error_result = ValidationResult(
                validator_type=self.validator_type,
                score=0,
                comment=f"Error en validación: {str(e)}",
                timestamp=get_current_timestamp(),
                model_used="error"
            )
            
            # Si es un validador crítico, re-lanzar el error
            if self.config["critical"]:
                raise
            
            return error_result
    
    def _prepare_question_prompt(self, question: QuestionInProcess) -> str:
        """
        Preparar el prompt con la pregunta para enviar al validador
        """
        prompt = f"""
Pregunta a validar:
{question.pregunta}

Opciones:
A. {question.opciones[0]}
B. {question.opciones[1]}
C. {question.opciones[2]}
D. {question.opciones[3]}

Información del procedimiento:
- Código: {question.procedure_codigo}
- Versión: {question.procedure_version}

Por favor evalúa esta pregunta según tus criterios especializados.
"""
        return prompt
    
    async def _call_validator_api(self, question_prompt: str) -> str:
        """
        Llamar a la API del validador con manejo de errores
        """
        # Modo debug con mock responses
        if DEBUG_CONFIG["mock_openai_calls"]:
            if DEBUG_CONFIG["verbose_logging"]:
                print(f"🧪 Usando respuesta mock para validador {self.validator_type.value}")
            await asyncio.sleep(0.5)  # Simular latencia
            return MOCK_RESPONSES["validator"]
        
        if not self.client:
            raise ValueError("Cliente OpenAI no inicializado y no estamos en modo mock")
        
        try:
            response = self.client.chat.completions.create(
                model=GENERATION_CONFIG["openai_model"],
                messages=[
                    {
                        "role": "system", 
                        "content": self.system_message
                    },
                    {
                        "role": "user",
                        "content": question_prompt
                    }
                ],
                temperature=0.1,  # Baja temperatura para validación consistente
                max_tokens=500,   # Respuestas cortas
                timeout=self.config["timeout"]
            )
            
            content = response.choices[0].message.content
            if not content:
                raise ValueError(f"Validador {self.validator_type.value} retornó contenido vacío")
            
            return content
            
        except Exception as e:
            raise Exception(f"Error llamando validador {self.validator_type.value}: {str(e)}")
    
    def _validate_response_structure(self, validation_data: Dict[str, Any]) -> None:
        """
        Validar que la respuesta del validador tenga la estructura correcta
        """
        required_fields = ["score", "comment"]
        
        for field in required_fields:
            if field not in validation_data:
                raise ValueError(f"Campo requerido faltante en respuesta del validador: {field}")
        
        # Validar score
        score = validation_data["score"]
        if not isinstance(score, int) or score not in [0, 1]:
            raise ValueError(f"Score debe ser 0 o 1, recibido: {score}")
        
        # Validar comment
        comment = validation_data["comment"]
        if not isinstance(comment, str) or not comment.strip():
            raise ValueError("Comment debe ser un string no vacío")

class ValidationEngine:
    """
    Motor de validación que orquesta múltiples validadores
    """
    
    def __init__(self):
        """
        Inicializar motor de validación con todos los validadores habilitados
        """
        self.validators = {}
        enabled_validators = get_enabled_validators()
        
        print(f"🔧 Inicializando ValidationEngine...")
        print(f"   - Validadores habilitados: {enabled_validators}")
        
        # Crear instancias de validadores
        for validator_name in enabled_validators:
            try:
                validator_type = ValidatorType(validator_name)
                self.validators[validator_name] = QuestionValidator(validator_type)
            except Exception as e:
                print(f"⚠️ Error inicializando validador {validator_name}: {e}")
                continue
        
        if not self.validators:
            raise ValueError("No se pudo inicializar ningún validador")
        
        print(f"✅ ValidationEngine inicializado con {len(self.validators)} validadores")
    
    async def validate_question(self, question: QuestionInProcess) -> QuestionInProcess:
        """
        Validar una pregunta con todos los validadores habilitados
        
        Args:
            question: Pregunta a validar
            
        Returns:
            Pregunta actualizada con resultados de validación
        """
        print(f"🔍 Iniciando validación completa para pregunta {question.id}")
        
        # Limpiar validaciones previas
        question.validations = []
        question.status = QuestionStatus.validating
        question.updated_at = get_current_timestamp()
        
        validation_results = []
        total_score = 0
        total_weight = 0
        
        # Ejecutar todos los validadores
        for validator_name, validator in self.validators.items():
            try:
                print(f"   🔍 Ejecutando validador: {validator_name}")
                
                result = await validator.validate_question(question)
                validation_results.append(result)
                
                # Calcular score ponderado
                weight = VALIDATORS_CONFIG[validator_name]["weight"]
                total_score += result.score * weight
                total_weight += weight
                
                print(f"   ✅ {validator_name}: Score={result.score}, Weight={weight}")
                
            except Exception as e:
                print(f"   ❌ Error en validador {validator_name}: {e}")
                
                # Si es crítico, detener validación
                if VALIDATORS_CONFIG[validator_name]["critical"]:
                    question.status = QuestionStatus.failed
                    question.updated_at = get_current_timestamp()
                    raise Exception(f"Validador crítico {validator_name} falló: {e}")
        
        # Calcular score promedio ponderado
        average_score = total_score / total_weight if total_weight > 0 else 0
        
        # Actualizar pregunta con resultados
        question.validations = validation_results
        question.updated_at = get_current_timestamp()
        
        # Determinar estado basado en threshold
        if average_score >= VALIDATION_THRESHOLD:
            question.status = QuestionStatus.completed
            print(f"   ✅ Pregunta aprobada: Score promedio = {average_score:.2f}")
        else:
            question.status = QuestionStatus.needs_correction
            print(f"   ⚠️ Pregunta necesita corrección: Score promedio = {average_score:.2f}")
        
        return question
    
    async def validate_batch(self, batch: QuestionBatch) -> QuestionBatch:
        """
        Validar todas las preguntas de un lote
        
        Args:
            batch: Lote de preguntas a validar
            
        Returns:
            Lote actualizado con resultados de validación
        """
        print(f"🔍 Iniciando validación de lote {batch.batch_id}")
        print(f"   - Preguntas a validar: {len(batch.questions)}")
        
        batch.status = ProcedureStatus.validating
        batch.updated_at = get_current_timestamp()
        
        validated_questions = []
        total_validation_score = 0
        
        # Validar cada pregunta
        for i, question in enumerate(batch.questions):
            try:
                print(f"📝 Validando pregunta {i+1}/{len(batch.questions)}")
                
                validated_question = await self.validate_question(question)
                validated_questions.append(validated_question)
                
                # Calcular score de la pregunta
                if validated_question.validations:
                    question_score = self._calculate_question_score(validated_question.validations)
                    total_validation_score += question_score
                
                # Rate limiting opcional entre preguntas
                if DEBUG_CONFIG.get("rate_limit_enabled", True) and i < len(batch.questions) - 1:
                    await asyncio.sleep(1)
                
            except Exception as e:
                print(f"❌ Error validando pregunta {i+1}: {e}")
                # Marcar pregunta como fallida pero continuar
                question.status = QuestionStatus.failed
                question.updated_at = get_current_timestamp()
                validated_questions.append(question)
        
        # Actualizar lote con resultados
        batch.questions = validated_questions
        batch.validation_score = total_validation_score / len(batch.questions) if batch.questions else 0
        batch.updated_at = get_current_timestamp()
        
        # Determinar estado del lote
        completed_questions = sum(1 for q in batch.questions if q.status == QuestionStatus.completed)
        needs_correction = sum(1 for q in batch.questions if q.status == QuestionStatus.needs_correction)
        failed_questions = sum(1 for q in batch.questions if q.status == QuestionStatus.failed)
        
        if failed_questions > 0:
            batch.status = ProcedureStatus.failed
        elif needs_correction > 0:
            batch.status = ProcedureStatus.correcting
        else:
            batch.status = ProcedureStatus.completed
        
        print(f"✅ Validación de lote completada:")
        print(f"   - Preguntas completadas: {completed_questions}")
        print(f"   - Preguntas que necesitan corrección: {needs_correction}")
        print(f"   - Preguntas fallidas: {failed_questions}")
        print(f"   - Score promedio del lote: {batch.validation_score:.2f}")
        
        return batch
    
    def _calculate_question_score(self, validations: List[ValidationResult]) -> float:
        """
        Calcular score ponderado de una pregunta basado en sus validaciones
        """
        total_score = 0
        total_weight = 0
        
        for validation in validations:
            validator_name = validation.validator_type.value
            if validator_name in VALIDATORS_CONFIG:
                weight = VALIDATORS_CONFIG[validator_name]["weight"]
                total_score += validation.score * weight
                total_weight += weight
        
        return total_score / total_weight if total_weight > 0 else 0
    
    def get_validation_summary(self, batch: QuestionBatch) -> Dict[str, Any]:
        """
        Obtener resumen de validación para un lote
        """
        if not batch.questions:
            return {"error": "No hay preguntas en el lote"}
        
        # Estadísticas generales
        total_questions = len(batch.questions)
        completed = sum(1 for q in batch.questions if q.status == QuestionStatus.completed)
        needs_correction = sum(1 for q in batch.questions if q.status == QuestionStatus.needs_correction)
        failed = sum(1 for q in batch.questions if q.status == QuestionStatus.failed)
        
        # Estadísticas por validador
        validator_stats = {}
        for validator_name in self.validators.keys():
            scores = []
            for question in batch.questions:
                for validation in question.validations:
                    if validation.validator_type.value == validator_name:
                        scores.append(validation.score)
            
            if scores:
                validator_stats[validator_name] = {
                    "average_score": sum(scores) / len(scores),
                    "total_evaluations": len(scores),
                    "pass_rate": sum(scores) / len(scores)
                }
        
        # Problemas más comunes
        common_issues = []
        for question in batch.questions:
            for validation in question.validations:
                if validation.score == 0:
                    common_issues.append(f"{validation.validator_type.value}: {validation.comment}")
        
        summary = {
            "batch_id": batch.batch_id,
            "procedure_codigo": batch.procedure_codigo,
            "total_questions": total_questions,
            "validation_results": {
                "completed": completed,
                "needs_correction": needs_correction,
                "failed": failed,
                "success_rate": completed / total_questions if total_questions > 0 else 0
            },
            "overall_score": batch.validation_score,
            "validator_statistics": validator_stats,
            "common_issues": common_issues[:10],  # Top 10 issues
            "timestamp": get_current_timestamp()
        }
        
        return summary

# =============================================================================
# FUNCIONES DE UTILIDAD
# =============================================================================

def create_validation_engine() -> ValidationEngine:
    """
    Crear instancia del motor de validación
    """
    return ValidationEngine()

async def validate_single_question(
    question: QuestionInProcess,
    validator_types: Optional[List[ValidatorType]] = None
) -> QuestionInProcess:
    """
    Función de conveniencia para validar una sola pregunta
    """
    engine = create_validation_engine()
    
    # Si se especifican validadores específicos, filtrar
    if validator_types:
        original_validators = engine.validators
        engine.validators = {
            name: validator for name, validator in original_validators.items()
            if ValidatorType(name) in validator_types
        }
    
    return await engine.validate_question(question)

def enable_debug_validation():
    """Habilitar modo debug para validación"""
    DEBUG_CONFIG["enabled"] = True
    DEBUG_CONFIG["mock_openai_calls"] = True
    DEBUG_CONFIG["verbose_logging"] = True
    print("🧪 Modo debug de validación habilitado")

def disable_debug_validation():
    """Deshabilitar modo debug para validación"""
    DEBUG_CONFIG["enabled"] = False
    DEBUG_CONFIG["mock_openai_calls"] = False
    DEBUG_CONFIG["verbose_logging"] = False
    print("🔧 Modo debug de validación deshabilitado")

# =============================================================================
# TESTING
# =============================================================================

async def test_validation():
    """
    Función de testing para el sistema de validación
    """
    print("🧪 Testing ValidationEngine...")
    
    # Habilitar modo debug
    enable_debug_validation()
    
    # Verificar configuración
    from .config import validate_admin_config
    if not validate_admin_config():
        print("❌ Configuración inválida")
        return
    
    try:
        # Crear pregunta de prueba
        test_question = QuestionInProcess(
            id="test_q1",
            procedure_codigo="TEST-001", 
            procedure_version="1",
            pregunta="¿Cuál es el primer paso en el procedimiento de prueba?",
            opciones=[
                "Verificar condiciones iniciales",
                "Iniciar operación directamente",
                "Contactar supervisor", 
                "Revisar documentación"
            ],
            status=QuestionStatus.generated,
            created_at=get_current_timestamp(),
            updated_at=get_current_timestamp()
        )
        
        print(f"📝 Pregunta de prueba creada: {test_question.pregunta}")
        
        # Crear motor de validación
        engine = create_validation_engine()
        
        # Validar pregunta
        validated_question = await engine.validate_question(test_question)
        
        print(f"✅ Validación completada!")
        print(f"   - Estado: {validated_question.status}")
        print(f"   - Validaciones realizadas: {len(validated_question.validations)}")
        
        # Mostrar resultados de cada validador
        for validation in validated_question.validations:
            print(f"   - {validation.validator_type.value}: Score={validation.score}")
            print(f"     Comentario: {validation.comment}")
        
        # Crear lote de prueba
        test_batch = QuestionBatch(
            batch_id="test_batch_001",
            procedure_codigo="TEST-001",
            procedure_version="1", 
            procedure_name="Procedimiento de Prueba",
            questions=[validated_question],
            status=ProcedureStatus.generating,
            created_at=get_current_timestamp(),
            updated_at=get_current_timestamp()
        )
        
        # Obtener resumen
        summary = engine.get_validation_summary(test_batch)
        print(f"📊 Resumen de validación:")
        print(f"   - Success rate: {summary['validation_results']['success_rate']:.2f}")
        print(f"   - Overall score: {summary['overall_score']:.2f}")
        
    except Exception as e:
        print(f"❌ Error en test de validación: {e}")
        if DEBUG_CONFIG["verbose_logging"]:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_validation())