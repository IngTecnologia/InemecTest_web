import React, { useState } from 'react'

const EvaluationForm = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Datos del usuario
    nombre: '',
    cargo: '',
    campo: '',
    
    // Respuestas de conocimiento
    answers: {},
    
    // Conocimiento aplicado
    applied: {
      describio_procedimiento: false,
      identifico_riesgos: false,
      identifico_epp: false,
      describio_incidentes: false
    },
    
    // Feedback
    feedback: {
      hizo_sugerencia: '',
      cual_sugerencia: '',
      aprobo: '',
      requiere_entrenamiento: ''
    }
  })

  // Preguntas de ejemplo (se reemplazarán con datos reales)
  const sampleQuestions = [
    {
      id: 1,
      question: "¿Cuál es el primer paso antes de iniciar cualquier procedimiento operativo?",
      options: [
        "Verificar las condiciones de seguridad",
        "Revisar el manual técnico",
        "Contactar al supervisor",
        "Preparar las herramientas"
      ]
    },
    {
      id: 2,
      question: "¿Qué elementos de protección personal son obligatorios en todas las operaciones?",
      options: [
        "Casco, gafas, guantes y calzado de seguridad",
        "Solo casco y guantes",
        "Depende del procedimiento",
        "Uniforme completo"
      ]
    },
    {
      id: 3,
      question: "En caso de emergencia durante un procedimiento, ¿cuál es la primera acción a tomar?",
      options: [
        "Detener inmediatamente la operación",
        "Completar el procedimiento rápidamente",
        "Llamar al jefe de turno",
        "Documentar el incidente"
      ]
    },
    {
      id: 4,
      question: "¿Con qué frecuencia se deben revisar los P&ID del procedimiento?",
      options: [
        "Antes de cada ejecución del procedimiento",
        "Una vez por semana",
        "Solo cuando hay cambios",
        "Mensualmente"
      ]
    },
    {
      id: 5,
      question: "¿Qué información debe contener obligatoriamente un reporte de incidente?",
      options: [
        "Fecha, hora, descripción detallada y acciones tomadas",
        "Solo la descripción del problema",
        "Únicamente las acciones correctivas",
        "El nombre del responsable"
      ]
    }
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAnswerChange = (questionId, answer) => {
    setFormData(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answer
      }
    }))
  }

  const handleAppliedChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      applied: {
        ...prev.applied,
        [field]: value
      }
    }))
  }

  const handleFeedbackChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      feedback: {
        ...prev.feedback,
        [field]: value
      }
    }))
  }

  const nextStep = () => {
    setCurrentStep(prev => prev + 1)
  }

  const prevStep = () => {
    setCurrentStep(prev => prev - 1)
  }

  const submitForm = () => {
    console.log('Datos del formulario:', formData)
    alert('Evaluación completada exitosamente!\n\n(Los datos se muestran en la consola del navegador)')
  }

  const renderUserData = () => (
    <div className="form-container">
      <h2 className="section-title">Datos del Usuario</h2>
      
      <div className="form-group">
        <label>Nombre:</label>
        <input
          type="text"
          value={formData.nombre}
          onChange={(e) => handleInputChange('nombre', e.target.value)}
          placeholder="Ingrese su nombre completo"
        />
      </div>

      <div className="form-group">
        <label>Cargo:</label>
        <input
          type="text"
          value={formData.cargo}
          onChange={(e) => handleInputChange('cargo', e.target.value)}
          placeholder="Ingrese su cargo"
        />
      </div>

      <div className="form-group">
        <label>Campo:</label>
        <select
          value={formData.campo}
          onChange={(e) => handleInputChange('campo', e.target.value)}
        >
          <option value="">Seleccione un campo</option>
          <option value="Cusiana">Cusiana</option>
          <option value="Cupiagua">Cupiagua</option>
          <option value="Floreña">Floreña</option>
          <option value="Transversal">Transversal</option>
        </select>
      </div>

      <button 
        className="btn" 
        onClick={nextStep}
        disabled={!formData.nombre || !formData.cargo || !formData.campo}
      >
        Continuar a Evaluación de Conocimiento
      </button>
    </div>
  )

  const renderObjective = () => (
    <div className="form-container">
      <h2 className="section-title">1. Objetivo</h2>
      <p>
        Definir el propósito del procedimiento integrando el objetivo, el alcance y el valor agregado 
        que aporta al colaborador. Este documento garantiza que el personal cuente con los 
        conocimientos técnicos necesarios para ejecutar las actividades de manera adecuada, 
        asegurando el cumplimiento de las Guías de Entrenamiento y evaluación, y fortaleciendo el 
        proceso de comunicación del procedimiento <strong>(CODIGO-NOMBRE)</strong>.
      </p>
      <button className="btn" onClick={nextStep}>
        Continuar
      </button>
    </div>
  )

  const renderKnowledgeTest = () => (
    <div className="form-container">
      <h2 className="section-title">2.3. Evaluación de Conocimiento</h2>
      <p style={{marginBottom: '1.5rem', color: '#666'}}>
        Responda las siguientes preguntas, en caso de dudas consulte con su supervisor:
      </p>

      {sampleQuestions.map((question, index) => (
        <div key={question.id} className="question-container">
          <div className="question-text">
            {index + 1}. {question.question}
          </div>
          
          {question.options.map((option, optionIndex) => (
            <div key={optionIndex} className="option">
              <label>
                <input
                  type="radio"
                  name={`question_${question.id}`}
                  value={optionIndex}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                />
                {String.fromCharCode(65 + optionIndex)}. {option}
              </label>
            </div>
          ))}
        </div>
      ))}

      <div style={{display: 'flex', gap: '1rem'}}>
        <button className="btn" onClick={prevStep} style={{background: '#6c757d'}}>
          Anterior
        </button>
        <button 
          className="btn" 
          onClick={nextStep}
          disabled={Object.keys(formData.answers).length < sampleQuestions.length}
        >
          Continuar a Conocimiento Aplicado
        </button>
      </div>
    </div>
  )

  const renderAppliedKnowledge = () => (
    <div className="form-container">
      <h2 className="section-title">2.4. Evaluación de Conocimiento Aplicado</h2>
      <p style={{marginBottom: '1.5rem', color: '#666'}}>
        Ubique en la carpeta OneDrive (Procedimientos CUS-CUP-FLO) con acceso compartido el 
        procedimiento (Código-nombre) y siga las indicaciones descritas a continuación:
      </p>

      <div className="checkbox-group">
        <input
          type="checkbox"
          checked={formData.applied.describio_procedimiento}
          onChange={(e) => handleAppliedChange('describio_procedimiento', e.target.checked)}
        />
        <label>
          Describa de forma verbal e interactúe con el supervisor del área o tutor en que consiste el procedimiento
        </label>
      </div>

      <div className="checkbox-group">
        <input
          type="checkbox"
          checked={formData.applied.identifico_riesgos}
          onChange={(e) => handleAppliedChange('identifico_riesgos', e.target.checked)}
        />
        <label>
          Identifique riesgos de la operación descrita en el procedimiento
        </label>
      </div>

      <div className="checkbox-group">
        <input
          type="checkbox"
          checked={formData.applied.identifico_epp}
          onChange={(e) => handleAppliedChange('identifico_epp', e.target.checked)}
        />
        <label>
          ¿Cuáles EPP deben usar los ejecutantes o el personal que desarrolla la actividad?
        </label>
      </div>

      <div className="checkbox-group">
        <input
          type="checkbox"
          checked={formData.applied.describio_incidentes}
          onChange={(e) => handleAppliedChange('describio_incidentes', e.target.checked)}
        />
        <label>
          En caso de presentarse un incidente operacional durante el desarrollo de la tarea, 
          describa el procedimiento que usted aplicaría para atenderlo
        </label>
      </div>

      <div style={{display: 'flex', gap: '1rem'}}>
        <button className="btn" onClick={prevStep} style={{background: '#6c757d'}}>
          Anterior
        </button>
        <button className="btn" onClick={nextStep}>
          Continuar a Observaciones
        </button>
      </div>
    </div>
  )

  const renderFeedback = () => (
    <div className="form-container">
      <h2 className="section-title">2.5. Observaciones y Verificación</h2>

      <div className="form-group">
        <label>¿Se hizo alguna sugerencia acerca del procedimiento?</label>
        <select
          value={formData.feedback.hizo_sugerencia}
          onChange={(e) => handleFeedbackChange('hizo_sugerencia', e.target.value)}
        >
          <option value="">Seleccione una opción</option>
          <option value="Sí">Sí</option>
          <option value="No">No</option>
        </select>
      </div>

      {formData.feedback.hizo_sugerencia === 'Sí' && (
        <div className="form-group">
          <label>¿Cuál?</label>
          <textarea
            value={formData.feedback.cual_sugerencia}
            onChange={(e) => handleFeedbackChange('cual_sugerencia', e.target.value)}
            placeholder="Describa la sugerencia..."
            rows="3"
          />
        </div>
      )}

      <div className="form-group">
        <label>¿Aprobó?</label>
        <select
          value={formData.feedback.aprobo}
          onChange={(e) => handleFeedbackChange('aprobo', e.target.value)}
        >
          <option value="">Seleccione una opción</option>
          <option value="Sí">Sí</option>
          <option value="No">No</option>
        </select>
      </div>

      <div className="form-group">
        <label>¿En qué se requiere entrenamiento?</label>
        <textarea
          value={formData.feedback.requiere_entrenamiento}
          onChange={(e) => handleFeedbackChange('requiere_entrenamiento', e.target.value)}
          placeholder="Describa los temas que requieren entrenamiento adicional..."
          rows="3"
        />
      </div>

      <div style={{display: 'flex', gap: '1rem'}}>
        <button className="btn" onClick={prevStep} style={{background: '#6c757d'}}>
          Anterior
        </button>
        <button 
          className="btn" 
          onClick={submitForm}
          disabled={!formData.feedback.hizo_sugerencia || !formData.feedback.aprobo}
        >
          Completar Evaluación
        </button>
      </div>
    </div>
  )

  return (
    <>
      {currentStep === 1 && renderUserData()}
      {currentStep === 2 && renderObjective()}
      {currentStep === 3 && renderKnowledgeTest()}
      {currentStep === 4 && renderAppliedKnowledge()}
      {currentStep === 5 && renderFeedback()}
    </>
  )
}

export default EvaluationForm