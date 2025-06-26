import React, { useState, useEffect } from 'react'

const EvaluationForm = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState(null)
  const [sessionId, setSessionId] = useState(null)
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
  // NUEVO: Guardar orden exacto de opciones mostradas
  const [questionsDisplayOrder, setQuestionsDisplayOrder] = useState({})
  
  const [formData, setFormData] = useState({
    // Datos del usuario
    cedula: '',
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
  const API_BASE_URL = '/api/v1'

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
      setSessionId(data.session_id)
      
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
      const displayOrder = {}
      processedQuestions.forEach(q => {
        mappings[q.id] = q.optionMapping
        // Guardar el orden exacto como se muestra al usuario
        displayOrder[q.id] = {
          question_text: q.question,
          option_a_text: q.options[0],
          option_b_text: q.options[1],
          option_c_text: q.options[2],
          option_d_text: q.options[3]
        }
      })
      setOptionMappings(mappings)
      setQuestionsDisplayOrder(displayOrder)
      
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
      
      if (!sessionId) {
        throw new Error('ID de sesión no encontrado. Por favor, recargue las preguntas.')
      }
      
      // Preparar datos para envío
      const evaluationData = {
        user_data: {
          cedula: formData.cedula,
          nombre: formData.nombre,
          cargo: formData.cargo,
          campo: formData.campo
        },
        procedure_codigo: formData.procedure_codigo,
        session_id: sessionId,
        knowledge_answers: Object.entries(formData.answers).map(([questionId, selectedPosition]) => {
          const displayOrder = questionsDisplayOrder[questionId]
          const answer = {
            question_id: parseInt(questionId),
            selected_option: selectedPosition // Posición visual seleccionada (A, B, C, D)
          }
          
          // Siempre incluir display_order si existe, incluso si está incompleto
          if (displayOrder) {
            answer.display_order = {
              question_text: displayOrder.question_text || null,
              option_a_text: displayOrder.option_a_text || null,
              option_b_text: displayOrder.option_b_text || null,
              option_c_text: displayOrder.option_c_text || null,
              option_d_text: displayOrder.option_d_text || null
            }
          }
          
          return answer
        }),
        applied_knowledge: formData.applied,
        feedback: formData.feedback
      }

      console.log('Datos de evaluación a enviar:', evaluationData)

      const response = await fetch(`${API_BASE_URL}/evaluations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evaluationData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error completo del servidor:', errorData)
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Get the actual results from the backend
      const resultsResponse = await fetch(`${API_BASE_URL}/evaluations/${result.evaluation_id}/results`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      let scoreData = {
        score_percentage: 0,
        total_questions: questions.length,
        correct_answers: 0
      }
      
      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json()
        scoreData = {
          score_percentage: resultsData.evaluation?.score_percentage || 0,
          total_questions: resultsData.evaluation?.total_questions || questions.length,
          correct_answers: resultsData.evaluation?.correct_answers || 0
        }
      } else {
        // Fallback: estimate score based on total questions
        scoreData.total_questions = questions.length
      }
      
      // Guardar resultado y mostrar página de éxito
      setEvaluationResult({
        evaluation_id: result.evaluation_id,
        score_percentage: scoreData.score_percentage,
        total_questions: scoreData.total_questions,
        correct_answers: scoreData.correct_answers,
        aprobo_conocimiento: scoreData.score_percentage >= 80 ? 'Sí' : 'No',
        aprobo_aplicado: formData.feedback.aprobo || 'No',
        user_data: {
          cedula: formData.cedula,
          nombre: formData.nombre,
          procedure_codigo: formData.procedure_codigo,
          procedure_nombre: selectedProcedure?.nombre || ''
        }
      })
      setIsCompleted(true)
      setFormData({
        cedula: '',
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
      setQuestionsDisplayOrder({})
      setSessionId(null)
      
    } catch (error) {
      console.error('Error enviando evaluación:', error)
      setError(`Error enviando evaluación: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const renderSuccessPage = () => (
    <div className="form-container" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '12px',
        marginBottom: '2rem'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem' }}>¡Evaluación Completada!</h1>
        <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
          Tu evaluación ha sido enviada exitosamente
        </p>
      </div>

      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ color: '#333', marginBottom: '1.5rem' }}>Detalles de tu Evaluación</h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: '#f8f9fa',
            padding: '1rem',
            borderRadius: '8px',
            textAlign: 'left'
          }}>
            <strong style={{ color: '#333' }}>Participante:</strong>
            <div style={{ marginTop: '0.5rem' }}>
              <div>{evaluationResult?.user_data.nombre}</div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Cédula: {evaluationResult?.user_data.cedula}</div>
            </div>
          </div>
          
          <div style={{
            background: '#f8f9fa',
            padding: '1rem',
            borderRadius: '8px',
            textAlign: 'left'
          }}>
            <strong style={{ color: '#333' }}>Procedimiento:</strong>
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.9rem' }}>{evaluationResult?.user_data.procedure_codigo}</div>
              <div style={{ color: '#666', fontSize: '0.8rem' }}>{evaluationResult?.user_data.procedure_nombre}</div>
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: '#e3f2fd',
            padding: '1.5rem',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1976d2', fontSize: '1rem' }}>Calificación Obtenida</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>
              {evaluationResult?.score_percentage}%
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>
              {evaluationResult?.correct_answers}/{evaluationResult?.total_questions} preguntas correctas
            </div>
          </div>

          <div style={{
            background: evaluationResult?.aprobo_conocimiento === 'Sí' ? '#e8f5e8' : '#ffebee',
            padding: '1.5rem',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ 
              margin: '0 0 0.5rem 0', 
              color: evaluationResult?.aprobo_conocimiento === 'Sí' ? '#2e7d32' : '#c62828',
              fontSize: '1rem' 
            }}>
              Evaluación de Conocimiento
            </h3>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold',
              color: evaluationResult?.aprobo_conocimiento === 'Sí' ? '#2e7d32' : '#c62828'
            }}>
              {evaluationResult?.aprobo_conocimiento === 'Sí' ? '✅ APROBÓ' : '❌ NO APROBÓ'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>
              {evaluationResult?.aprobo_conocimiento === 'Sí' ? '≥80% requerido' : '<80% obtenido'}
            </div>
          </div>

          <div style={{
            background: evaluationResult?.aprobo_aplicado === 'Sí' ? '#e8f5e8' : '#ffebee',
            padding: '1.5rem',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ 
              margin: '0 0 0.5rem 0', 
              color: evaluationResult?.aprobo_aplicado === 'Sí' ? '#2e7d32' : '#c62828',
              fontSize: '1rem' 
            }}>
              Conocimiento Aplicado
            </h3>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold',
              color: evaluationResult?.aprobo_aplicado === 'Sí' ? '#2e7d32' : '#c62828'
            }}>
              {evaluationResult?.aprobo_aplicado === 'Sí' ? '✅ APROBÓ' : '❌ NO APROBÓ'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>
              Evaluación del supervisor
            </div>
          </div>
        </div>

        <div style={{
          background: '#f0f4f8',
          padding: '1rem',
          borderRadius: '8px',
          border: '2px dashed #667eea'
        }}>
          <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '0.5rem' }}>
            📄 ID de Evaluación: {evaluationResult?.evaluation_id}
          </div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>
            Los resultados han sido guardados en el sistema
          </div>
        </div>
      </div>

      <button 
        className="btn" 
        onClick={() => {
          setIsCompleted(false)
          setEvaluationResult(null)
          setCurrentStep(1)
          setSessionId(null)
        }}
        style={{ 
          padding: '1rem 2rem',
          fontSize: '1.1rem',
          background: '#667eea'
        }}
      >
        Realizar Nueva Evaluación
      </button>
    </div>
  )

  const renderUserData = () => (
    <div className="form-container">
      <h2 className="section-title">Datos del Usuario</h2>
      
      {error && (
        <div style={{color: 'red', marginBottom: '1rem', padding: '0.5rem', background: '#ffe6e6', borderRadius: '4px'}}>
          {error}
        </div>
      )}
      
      <div className="form-group">
        <label>Cédula:</label>
        <input
          type="text"
          value={formData.cedula}
          onChange={(e) => handleInputChange('cedula', e.target.value)}
          placeholder="Ingrese su número de cédula"
        />
      </div>

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
        disabled={!formData.cedula || !formData.nombre || !formData.cargo || !formData.campo || !formData.procedure_codigo || loading}
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

  // Mostrar página de éxito si está completado
  if (isCompleted && evaluationResult) {
    return renderSuccessPage()
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