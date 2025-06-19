import React, { useState, useEffect } from 'react'

const EvaluationForm = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [procedures, setProcedures] = useState([])
  const [filteredProcedures, setFilteredProcedures] = useState([])
  const [selectedProcedure, setSelectedProcedure] = useState(null)
  const [questions, setQuestions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  
  // Nuevos estados para filtros
  const [selectedDisciplina, setSelectedDisciplina] = useState('')
  const [selectedCampoOperativo, setSelectedCampoOperativo] = useState('')
  const [availableDisciplinas, setAvailableDisciplinas] = useState([])
  const [availableCamposOperativos, setAvailableCamposOperativos] = useState([])
  
  // NUEVO: Mapeo de opciones randomizadas a originales
  const [optionMappings, setOptionMappings] = useState({})
  
  const [formData, setFormData] = useState({
    // Datos del usuario
    nombre: '',
    cargo: '',
    campo: '',
    
    // Procedimiento seleccionado
    procedure_codigo: '',
    
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

  // Configuración de la API
  const API_BASE_URL = 'http://localhost:8000/api/v1'

  // Cargar procedimientos al iniciar
  useEffect(() => {
    loadProcedures()
  }, [])

  // Extraer disciplinas y campos únicos cuando cambian los procedimientos
  useEffect(() => {
    if (procedures.length > 0) {
      // Extraer disciplinas únicas
      const disciplinas = [...new Set(
        procedures
          .filter(proc => proc.datos_completos?.disciplina)
          .map(proc => proc.datos_completos.disciplina)
      )].sort()
      
      // Extraer campos operativos únicos
      const campos = [...new Set(
        procedures
          .filter(proc => proc.datos_completos?.campo)
          .map(proc => proc.datos_completos.campo)
      )].sort()
      
      setAvailableDisciplinas(disciplinas)
      setAvailableCamposOperativos(campos)
    }
  }, [procedures])

  // Filtrar procedimientos basado en búsqueda y filtros
  useEffect(() => {
    let filtered = procedures
    
    // Filtrar por disciplina si está seleccionada
    if (selectedDisciplina) {
      filtered = filtered.filter(proc => 
        proc.datos_completos?.disciplina === selectedDisciplina
      )
    }
    
    // Filtrar por campo operativo si está seleccionado
    if (selectedCampoOperativo) {
      filtered = filtered.filter(proc => 
        proc.datos_completos?.campo === selectedCampoOperativo
      )
    }
    
    // Filtrar por término de búsqueda si existe
    if (searchTerm) {
      filtered = filtered.filter(proc => 
        proc.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proc.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredProcedures(filtered)
  }, [searchTerm, procedures, selectedDisciplina, selectedCampoOperativo])

  const loadProcedures = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/procedures`)
      
      if (!response.ok) {
        throw new Error('Error cargando procedimientos')
      }
      
      const data = await response.json()
      setProcedures(data.procedures || [])
      setFilteredProcedures(data.procedures || [])
      
    } catch (error) {
      console.error('Error cargando procedimientos:', error)
      setError('Error cargando procedimientos. Verifique que el servidor esté funcionando.')
    } finally {
      setLoading(false)
    }
  }

  const loadQuestions = async (procedureCode) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/procedures/${procedureCode}/questions`)
      
      if (!response.ok) {
        throw new Error('Error cargando preguntas')
      }
      
      const data = await response.json()
      setSelectedProcedure(data.procedure)
      
      // IMPORTANTE: Procesar las preguntas y crear mapeo de opciones
      const processedQuestions = data.questions.map(question => {
        // Las opciones vienen randomizadas del backend
        // Necesitamos saber cuál es la opción correcta (siempre A en el original)
        // Creamos un mapeo para cada pregunta
        const mapping = {}
        question.options.forEach((option, index) => {
          const letterPosition = String.fromCharCode(65 + index) // A, B, C, D
          mapping[letterPosition] = option
        })
        
        return {
          ...question,
          optionMapping: mapping
        }
      })
      
      setQuestions(processedQuestions)
      
      // Guardar los mapeos para usar al enviar respuestas
      const mappings = {}
      processedQuestions.forEach(q => {
        mappings[q.id] = q.optionMapping
      })
      setOptionMappings(mappings)
      
    } catch (error) {
      console.error('Error cargando preguntas:', error)
      setError('Error cargando preguntas para este procedimiento.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleProcedureSelect = async (procedure) => {
    setSearchTerm(`${procedure.codigo} - ${procedure.nombre}`)
    setShowDropdown(false)
    handleInputChange('procedure_codigo', procedure.codigo)
    
    if (procedure.codigo) {
      await loadQuestions(procedure.codigo)
    }
  }

  const handleAnswerChange = (questionId, selectedPosition) => {
    // selectedPosition es A, B, C o D basado en la posición visual
    setFormData(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: selectedPosition
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
    setError('')
  }

  const prevStep = () => {
    setCurrentStep(prev => prev - 1)
    setError('')
  }

  const submitForm = async () => {
    try {
      setLoading(true)
      
      // Preparar datos para envío
      const evaluationData = {
        user_data: {
          nombre: formData.nombre,
          cargo: formData.cargo,
          campo: formData.campo
        },
        procedure_codigo: formData.procedure_codigo,
        knowledge_answers: Object.entries(formData.answers).map(([questionId, selectedPosition]) => ({
          question_id: parseInt(questionId),
          selected_option: selectedPosition // Enviamos la posición visual (A, B, C, D)
        })),
        applied_knowledge: formData.applied,
        feedback: formData.feedback
      }

      const response = await fetch(`${API_BASE_URL}/evaluations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evaluationData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Error enviando evaluación')
      }

      const result = await response.json()
      
      alert(`¡Evaluación completada exitosamente!\n\nID de evaluación: ${result.evaluation_id}\n\nLos resultados han sido guardados en Excel.`)
      
      // Reiniciar formulario
      setCurrentStep(1)
      setFormData({
        nombre: '',
        cargo: '',
        campo: '',
        procedure_codigo: '',
        answers: {},
        applied: {
          describio_procedimiento: false,
          identifico_riesgos: false,
          identifico_epp: false,
          describio_incidentes: false
        },
        feedback: {
          hizo_sugerencia: '',
          cual_sugerencia: '',
          aprobo: '',
          requiere_entrenamiento: ''
        }
      })
      setSelectedProcedure(null)
      setQuestions([])
      setSearchTerm('')
      setOptionMappings({})
      
    } catch (error) {
      console.error('Error enviando evaluación:', error)
      setError(`Error enviando evaluación: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const renderUserData = () => (
    <div className="form-container">
      <h2 className="section-title">Datos del Usuario</h2>
      
      {error && (
        <div style={{color: 'red', marginBottom: '1rem', padding: '0.5rem', background: '#ffe6e6', borderRadius: '4px'}}>
          {error}
        </div>
      )}
      
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

      {/* Filtros para selección de procedimiento */}
      <div className="form-group">
        <label>Filtrar por Disciplina (opcional):</label>
        <select 
          value={selectedDisciplina} 
          onChange={(e) => setSelectedDisciplina(e.target.value)}
        >
          <option value="">Todas las disciplinas</option>
          {availableDisciplinas.map(disciplina => (
            <option key={disciplina} value={disciplina}>{disciplina}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Filtrar por Campo Operativo (opcional):</label>
        <select 
          value={selectedCampoOperativo} 
          onChange={(e) => setSelectedCampoOperativo(e.target.value)}
        >
          <option value="">Todos los campos operativos</option>
          {availableCamposOperativos.map(campo => (
            <option key={campo} value={campo}>{campo}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Procedimiento:</label>
        <div style={{position: 'relative'}}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Buscar por código o nombre..."
            disabled={loading}
            style={{width: '100%'}}
          />
          
          {showDropdown && filteredProcedures.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              maxHeight: '250px',
              overflowY: 'auto',
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginTop: '2px',
              zIndex: 1000,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {filteredProcedures.map((proc) => (
                <div
                  key={proc.codigo}
                  onClick={() => handleProcedureSelect(proc)}
                  style={{
                    padding: '0.75rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee',
                    ':hover': {
                      background: '#f5f5f5'
                    }
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                  onMouseLeave={(e) => e.target.style.background = 'white'}
                >
                  <div><strong>{proc.codigo}</strong> - {proc.nombre}</div>
                  {proc.datos_completos?.disciplina && (
                    <div style={{fontSize: '0.8rem', color: '#666', marginTop: '0.25rem'}}>
                      Disciplina: {proc.datos_completos.disciplina}
                      {proc.datos_completos?.campo && ` | Campo: ${proc.datos_completos.campo}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {showDropdown && filteredProcedures.length === 0 && searchTerm && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginTop: '2px',
              padding: '0.75rem',
              color: '#666',
              textAlign: 'center'
            }}>
              No se encontraron procedimientos que coincidan con los filtros aplicados.
            </div>
          )}
        </div>
        
        {/* Indicadores de filtros activos */}
        {(selectedDisciplina || selectedCampoOperativo) && (
          <div style={{
            marginTop: '0.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            <span style={{fontSize: '0.8rem', color: '#666'}}>Filtros activos:</span>
            {selectedDisciplina && (
              <div style={{
                background: '#667eea',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                Disciplina: {selectedDisciplina}
                <button
                  onClick={() => setSelectedDisciplina('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    padding: '0',
                    marginLeft: '0.25rem'
                  }}
                  title="Limpiar filtro de disciplina"
                >
                  ×
                </button>
              </div>
            )}
            {selectedCampoOperativo && (
              <div style={{
                background: '#f59e0b',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                Campo: {selectedCampoOperativo}
                <button
                  onClick={() => setSelectedCampoOperativo('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    padding: '0',
                    marginLeft: '0.25rem'
                  }}
                  title="Limpiar filtro de campo"
                >
                  ×
                </button>
              </div>
            )}
            <button
              onClick={() => {
                setSelectedDisciplina('')
                setSelectedCampoOperativo('')
              }}
              style={{
                background: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
              title="Limpiar todos los filtros"
            >
              Limpiar todos
            </button>
          </div>
        )}
        
        {loading && <p style={{color: '#667eea', fontSize: '0.9rem'}}>Cargando...</p>}
      </div>

      <button 
        className="btn" 
        onClick={nextStep}
        disabled={!formData.nombre || !formData.cargo || !formData.campo || !formData.procedure_codigo || loading}
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
        proceso de comunicación del procedimiento{' '}
        <strong>({selectedProcedure?.codigo} - {selectedProcedure?.nombre})</strong>.
      </p>
      
      {selectedProcedure?.alcance && (
        <div style={{marginTop: '1rem'}}>
          <h3 style={{fontSize: '1.1rem', marginBottom: '0.5rem'}}>2. Desarrollo:</h3>
          <p style={{fontStyle: 'italic', color: '#666'}}>{selectedProcedure.alcance}</p>
        </div>
      )}
      
      <button className="btn" onClick={nextStep} style={{marginTop: '1.5rem'}}>
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

      {loading ? (
        <p style={{textAlign: 'center', color: '#667eea'}}>Cargando preguntas...</p>
      ) : questions.length === 0 ? (
        <p style={{textAlign: 'center', color: '#ff6b6b'}}>
          No se encontraron preguntas para este procedimiento.
        </p>
      ) : (
        questions.map((question, index) => (
          <div key={question.id} className="question-container">
            <div className="question-text">
              {index + 1}. {question.question_text}
            </div>
            
            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="option">
                <label>
                  <input
                    type="radio"
                    name={`question_${question.id}`}
                    value={String.fromCharCode(65 + optionIndex)}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    checked={formData.answers[question.id] === String.fromCharCode(65 + optionIndex)}
                  />
                  {String.fromCharCode(65 + optionIndex)}. {option}
                </label>
              </div>
            ))}
          </div>
        ))
      )}

      {error && (
        <div style={{color: 'red', marginBottom: '1rem', padding: '0.5rem', background: '#ffe6e6', borderRadius: '4px'}}>
          {error}
        </div>
      )}

      <div style={{display: 'flex', gap: '1rem'}}>
        <button className="btn" onClick={prevStep} style={{background: '#6c757d'}}>
          Anterior
        </button>
        <button 
          className="btn" 
          onClick={nextStep}
          disabled={Object.keys(formData.answers).length < questions.length || questions.length === 0}
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
        procedimiento ({selectedProcedure?.codigo} - {selectedProcedure?.nombre}) y siga las indicaciones descritas a continuación:
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

      {error && (
        <div style={{color: 'red', marginBottom: '1rem', padding: '0.5rem', background: '#ffe6e6', borderRadius: '4px'}}>
          {error}
        </div>
      )}

      <div style={{display: 'flex', gap: '1rem'}}>
        <button className="btn" onClick={prevStep} style={{background: '#6c757d'}}>
          Anterior
        </button>
        <button 
          className="btn" 
          onClick={submitForm}
          disabled={!formData.feedback.hizo_sugerencia || !formData.feedback.aprobo || loading}
        >
          {loading ? 'Enviando...' : 'Completar Evaluación'}
        </button>
      </div>
    </div>
  )

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.form-group')) {
        setShowDropdown(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  if (loading && currentStep === 1) {
    return (
      <div className="form-container">
        <div className="loading">Cargando sistema...</div>
      </div>
    )
  }

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