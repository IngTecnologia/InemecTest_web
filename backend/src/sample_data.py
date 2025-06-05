"""
Datos de ejemplo para testing
Este archivo se reemplazará cuando tengas la hoja de cálculo real
"""

from .database import execute, execute_many

# Datos de ejemplo de procedimientos
SAMPLE_PROCEDURES = [
    {
        "codigo": "OP-001",
        "nombre": "Arranque de Bomba Centrífuga",
        "alcance": "Aplica para todas las bombas centrífugas del campo Cusiana",
        "objetivo": "Establecer el procedimiento seguro para el arranque de bombas centrífugas"
    },
    {
        "codigo": "OP-002", 
        "nombre": "Mantenimiento Preventivo de Válvulas",
        "alcance": "Aplica para válvulas de control y seguridad en Cupiagua",
        "objetivo": "Garantizar el funcionamiento óptimo de las válvulas del sistema"
    },
    {
        "codigo": "OP-003",
        "nombre": "Inspección de Líneas de Proceso",
        "alcance": "Aplica para todas las líneas de proceso en Floreña",
        "objetivo": "Identificar y prevenir fallas en las líneas de proceso"
    },
    {
        "codigo": "TR-001",
        "nombre": "Procedimiento de Emergencia General",
        "alcance": "Aplica transversalmente en todos los campos",
        "objetivo": "Establecer protocolo de respuesta ante emergencias operacionales"
    },
    {
        "codigo": "TR-002",
        "nombre": "Uso de Equipos de Protección Personal",
        "alcance": "Aplica transversalmente para todo el personal",
        "objetivo": "Garantizar el uso correcto de EPP en todas las operaciones"
    }
]

# Preguntas de ejemplo por procedimiento
SAMPLE_QUESTIONS = {
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
        },
        {
            "question_text": "¿Cuál es la secuencia correcta para el arranque?",
            "option_a": "Abrir succión, verificar cebado, arrancar motor, abrir descarga gradualmente",
            "option_b": "Arrancar motor, abrir válvulas",
            "option_c": "Abrir descarga, arrancar motor",
            "option_d": "Arrancar motor sin verificaciones"
        },
        {
            "question_text": "¿Qué parámetros se deben monitorear durante el arranque?",
            "option_a": "Presión, vibración, temperatura y corriente del motor",
            "option_b": "Solo la presión de descarga",
            "option_c": "Únicamente la vibración",
            "option_d": "No es necesario monitorear nada"
        },
        {
            "question_text": "¿Qué hacer si se detecta vibración excesiva durante el arranque?",
            "option_a": "Parar inmediatamente la bomba y verificar alineación",
            "option_b": "Continuar operando y reportar después",
            "option_c": "Aumentar la velocidad para estabilizar",
            "option_d": "Ignorar la vibración"
        }
    ],
    "OP-002": [
        {
            "question_text": "¿Con qué frecuencia se debe realizar mantenimiento preventivo a válvulas críticas?",
            "option_a": "Según cronograma establecido en el plan de mantenimiento",
            "option_b": "Solo cuando fallen",
            "option_c": "Una vez al año sin excepción",
            "option_d": "No requieren mantenimiento"
        },
        {
            "question_text": "¿Qué herramientas son esenciales para el mantenimiento de válvulas?",
            "option_a": "Llaves específicas, lubricantes, medidores de torque",
            "option_b": "Solo llaves comunes",
            "option_c": "Únicamente lubricantes",
            "option_d": "No se requieren herramientas especiales"
        },
        {
            "question_text": "¿Qué se debe verificar en una válvula de control antes del mantenimiento?",
            "option_a": "Estado del actuador, estanqueidad y calibración",
            "option_b": "Solo el estado físico externo",
            "option_c": "Únicamente la calibración",
            "option_d": "No es necesario verificar nada"
        },
        {
            "question_text": "¿Cuál es el procedimiento para aislar una válvula antes del mantenimiento?",
            "option_a": "Seguir procedimiento LOTO y verificar despresurización",
            "option_b": "Solo cerrar la válvula",
            "option_c": "Desconectar eléctricamente",
            "option_d": "No es necesario aislar"
        },
        {
            "question_text": "¿Qué documentación se debe completar después del mantenimiento?",
            "option_a": "Registro de mantenimiento con observaciones y pruebas realizadas",
            "option_b": "Solo firma de conformidad",
            "option_c": "Únicamente fecha de intervención",
            "option_d": "No se requiere documentación"
        }
    ],
    "OP-003": [
        {
            "question_text": "¿Qué aspectos se deben inspeccionar en las líneas de proceso?",
            "option_a": "Corrosión, fugas, soportería y aislamiento térmico",
            "option_b": "Solo las fugas visibles",
            "option_c": "Únicamente la corrosión",
            "option_d": "No requiere inspección detallada"
        },
        {
            "question_text": "¿Con qué frecuencia se deben realizar inspecciones de rutina?",
            "option_a": "Según cronograma establecido y después de eventos críticos",
            "option_b": "Solo cuando hay reportes de problemas",
            "option_c": "Una vez al mes sin excepción",
            "option_d": "No hay frecuencia establecida"
        },
        {
            "question_text": "¿Qué equipos de medición se requieren para la inspección?",
            "option_a": "Detector de gases, medidor de espesores, cámara termográfica",
            "option_b": "Solo inspección visual",
            "option_c": "Únicamente detector de gases",
            "option_d": "No se requieren equipos especiales"
        },
        {
            "question_text": "¿Cómo se debe documentar una fuga menor encontrada durante la inspección?",
            "option_a": "Registrar ubicación, severidad y generar orden de trabajo",
            "option_b": "Solo reportar verbalmente",
            "option_c": "Marcar en campo únicamente",
            "option_d": "No es necesario documentar fugas menores"
        },
        {
            "question_text": "¿Qué acción tomar si se encuentra corrosión severa en una línea crítica?",
            "option_a": "Notificar inmediatamente y evaluar necesidad de paro de emergencia",
            "option_b": "Completar la inspección y reportar al final",
            "option_c": "Programar reparación para el próximo paro",
            "option_d": "Continuar operación normal"
        }
    ],
    "TR-001": [
        {
            "question_text": "¿Cuál es la primera acción en caso de emergencia operacional?",
            "option_a": "Activar alarma general y notificar al centro de control",
            "option_b": "Evaluar detalladamente la situación",
            "option_c": "Contactar al supervisor directo",
            "option_d": "Continuar con las operaciones normales"
        },
        {
            "question_text": "¿Quién tiene autoridad para ordenar una parada de emergencia?",
            "option_a": "Cualquier persona que identifique riesgo inminente",
            "option_b": "Solo el supervisor de turno",
            "option_c": "Únicamente el gerente de operaciones",
            "option_d": "Solo el personal de seguridad"
        },
        {
            "question_text": "¿Cuál es el punto de encuentro en caso de evacuación?",
            "option_a": "Punto de encuentro designado señalizado en planta",
            "option_b": "La oficina administrativa más cercana",
            "option_c": "El estacionamiento principal",
            "option_d": "Cualquier lugar fuera de la planta"
        },
        {
            "question_text": "¿Qué información debe incluir el reporte inicial de emergencia?",
            "option_a": "Tipo de emergencia, ubicación, personas involucradas y acciones tomadas",
            "option_b": "Solo el tipo de emergencia",
            "option_c": "Únicamente la ubicación",
            "option_d": "Solo las acciones tomadas"
        },
        {
            "question_text": "¿Cuándo se considera controlada una emergencia?",
            "option_a": "Cuando el coordinador de emergencias lo declare formalmente",
            "option_b": "Cuando pare la alarma",
            "option_c": "Cuando termine el evento inicial",
            "option_d": "Cuando el personal regrese a sus puestos"
        }
    ],
    "TR-002": [
        {
            "question_text": "¿Cuáles son los EPP básicos obligatorios en todas las áreas operativas?",
            "option_a": "Casco, gafas de seguridad, guantes y calzado de seguridad",
            "option_b": "Solo casco y guantes",
            "option_c": "Únicamente calzado de seguridad",
            "option_d": "Depende del área específica"
        },
        {
            "question_text": "¿Cuándo se debe usar protección respiratoria?",
            "option_a": "En espacios confinados y áreas con riesgo de exposición a gases",
            "option_b": "Solo en espacios confinados",
            "option_c": "Únicamente cuando hay olor a gas",
            "option_d": "No es obligatorio en ningún caso"
        },
        {
            "question_text": "¿Qué hacer si un EPP está dañado?",
            "option_a": "Retirar de servicio inmediatamente y solicitar reemplazo",
            "option_b": "Usarlo hasta el final del turno",
            "option_c": "Repararlo temporalmente",
            "option_d": "Continuar usándolo si el daño es menor"
        },
        {
            "question_text": "¿Con qué frecuencia se debe inspeccionar el EPP?",
            "option_a": "Antes de cada uso y periódicamente según fabricante",
            "option_b": "Solo al final del turno",
            "option_c": "Una vez por semana",
            "option_d": "Solo cuando parece dañado"
        },
        {
            "question_text": "¿Quién es responsable del correcto uso del EPP?",
            "option_a": "Cada trabajador es responsable de su propio EPP",
            "option_b": "Solo el supervisor",
            "option_c": "Únicamente el departamento de seguridad",
            "option_d": "La empresa en general"
        }
    ]
}

async def insert_sample_data():
    """Insertar datos de ejemplo en la base de datos"""
    
    try:
        print("🔄 Insertando datos de ejemplo...")
        
        # Insertar procedimientos
        procedure_query = """
            INSERT INTO procedures (codigo, nombre, alcance, objetivo)
            VALUES (:codigo, :nombre, :alcance, :objetivo)
            ON CONFLICT (codigo) DO NOTHING
            RETURNING id
        """
        
        procedure_ids = {}
        for proc_data in SAMPLE_PROCEDURES:
            result = await execute(procedure_query, proc_data)
            # Obtener ID del procedimiento insertado o existente
            get_id_query = "SELECT id FROM procedures WHERE codigo = :codigo"
            proc_result = await fetch_one(get_id_query, {"codigo": proc_data["codigo"]})
            procedure_ids[proc_data["codigo"]] = proc_result["id"]
        
        # Insertar preguntas
        question_query = """
            INSERT INTO questions 
            (procedure_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
            VALUES (:procedure_id, :question_text, :option_a, :option_b, :option_c, :option_d, :correct_answer)
            ON CONFLICT DO NOTHING
        """
        
        for codigo, questions in SAMPLE_QUESTIONS.items():
            if codigo in procedure_ids:
                procedure_id = procedure_ids[codigo]
                
                for question_data in questions:
                    question_with_id = {
                        "procedure_id": procedure_id,
                        "correct_answer": "A",  # La primera opción siempre es correcta en nuestros ejemplos
                        **question_data
                    }
                    await execute(question_query, question_with_id)
        
        print("✅ Datos de ejemplo insertados correctamente")
        
    except Exception as e:
        print(f"❌ Error insertando datos de ejemplo: {e}")
        raise e

async def clear_sample_data():
    """Limpiar datos de ejemplo (útil para testing)"""
    try:
        print("🔄 Limpiando datos de ejemplo...")
        
        # Eliminar en orden correcto (respetando foreign keys)
        await execute("DELETE FROM feedback")
        await execute("DELETE FROM applied_knowledge") 
        await execute("DELETE FROM answers")
        await execute("DELETE FROM evaluations")
        await execute("DELETE FROM questions")
        await execute("DELETE FROM procedures")
        
        print("✅ Datos de ejemplo eliminados")
        
    except Exception as e:
        print(f"❌ Error eliminando datos de ejemplo: {e}")
        raise e

# Función para verificar si hay datos
async def check_data_exists():
    """Verificar si ya existen datos en la base de datos"""
    try:
        from .database import fetch_one
        
        proc_count = await fetch_one("SELECT COUNT(*) as count FROM procedures")
        question_count = await fetch_one("SELECT COUNT(*) as count FROM questions")
        
        return {
            "procedures": proc_count["count"],
            "questions": question_count["count"]
        }
    except Exception as e:
        print(f"Error verificando datos existentes: {e}")
        return {"procedures": 0, "questions": 0}