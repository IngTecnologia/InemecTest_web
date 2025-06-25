/**
 * Componente para gestión de evaluaciones presentadas
 */

import React, { useState, useEffect } from 'react'
import useAdminAuth from '../../hooks/useAdminAuth'

const EvaluationsManager = () => {
  const { getAuthHeaders } = useAdminAuth()
  const [stats, setStats] = useState(null)
  const [evaluations, setEvaluations] = useState([])
  const [selectedEvaluation, setSelectedEvaluation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Filtros de búsqueda
  const [filters, setFilters] = useState({
    cedula: '',
    campo: '',
    procedure_codigo: ''
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/admin/evaluations/stats', {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const result = await response.json()
        setStats(result.data)
      } else {
        setError('Error cargando estadísticas')
      }
    } catch (error) {
      setError('Error de conexión')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchEvaluations = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      
      if (filters.cedula) queryParams.append('cedula', filters.cedula)
      if (filters.campo) queryParams.append('campo', filters.campo)
      if (filters.procedure_codigo) queryParams.append('procedure_codigo', filters.procedure_codigo)
      
      const response = await fetch(`/api/v1/admin/evaluations/search?${queryParams}`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const result = await response.json()
        setEvaluations(result.data.evaluations)
        setError('')
      } else {
        setError('Error buscando evaluaciones')
      }
    } catch (error) {
      setError('Error de conexión')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEvaluationReport = async (evaluationId) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/admin/evaluations/${evaluationId}/report`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const result = await response.json()
        setSelectedEvaluation(result.data)
        setActiveTab('report')
      } else {
        setError('Error cargando reporte')
      }
    } catch (error) {
      setError('Error de conexión')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setFilters({ cedula: '', campo: '', procedure_codigo: '' })
    setEvaluations([])
  }

  const renderDashboard = () => (
    <div className="evaluations-dashboard">
      <h2>📊 Dashboard de Evaluaciones</h2>
      
      {loading && <div className="loading">Cargando estadísticas...</div>}
      
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total de Evaluaciones</h3>
            <div className="stat-number">{stats.total_evaluations}</div>
          </div>
          
          <div className="stat-card">
            <h3>Tasa de Aprobación</h3>
            <div className="stat-number">{stats.approval_rate}%</div>
            <div className="stat-detail">
              {stats.approved_count} aprobados / {stats.failed_count} reprobados
            </div>
          </div>
          
          <div className="stat-card full-width">
            <h3>Evaluaciones por Campo</h3>
            <div className="campo-stats">
              {Object.entries(stats.by_campo).map(([campo, count]) => (
                <div key={campo} className="campo-item">
                  <span className="campo-name">{campo}:</span>
                  <span className="campo-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="stat-card full-width">
            <h3>Evaluaciones Recientes</h3>
            <div className="recent-evaluations">
              {stats.recent_evaluations.slice(0, 5).map((eval_, index) => (
                <div key={index} className="recent-item">
                  <span className="cedula">{eval_.cedula}</span>
                  <span className="name">{eval_.nombre}</span>
                  <span className="procedure">{eval_.procedure_codigo}</span>
                  <span className={`status ${eval_.aprobo === 'Sí' ? 'approved' : 'failed'}`}>
                    {eval_.aprobo === 'Sí' ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderSearch = () => (
    <div className="evaluations-search">
      <h2>🔍 Buscar Evaluaciones</h2>
      
      <div className="search-filters">
        <div className="filter-group">
          <label>Cédula:</label>
          <input
            type="text"
            value={filters.cedula}
            onChange={(e) => setFilters({...filters, cedula: e.target.value})}
            placeholder="Número de cédula"
          />
        </div>
        
        <div className="filter-group">
          <label>Campo:</label>
          <select
            value={filters.campo}
            onChange={(e) => setFilters({...filters, campo: e.target.value})}
          >
            <option value="">Todos los campos</option>
            <option value="Cusiana">Cusiana</option>
            <option value="Cupiagua">Cupiagua</option>
            <option value="Floreña">Floreña</option>
            <option value="Transversal">Transversal</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Código de Procedimiento:</label>
          <input
            type="text"
            value={filters.procedure_codigo}
            onChange={(e) => setFilters({...filters, procedure_codigo: e.target.value})}
            placeholder="ej: OP-001"
          />
        </div>
        
        <div className="filter-actions">
          <button onClick={searchEvaluations} disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
          <button onClick={clearFilters}>Limpiar</button>
        </div>
      </div>
      
      {evaluations.length > 0 && (
        <div className="search-results">
          <h3>Resultados ({evaluations.length})</h3>
          <div className="evaluations-table">
            <div className="table-header">
              <span>Cédula</span>
              <span>Nombre</span>
              <span>Campo</span>
              <span>Procedimiento</span>
              <span>Resultado</span>
              <span>Fecha</span>
              <span>Acciones</span>
            </div>
            {evaluations.map((evaluation, index) => (
              <div key={index} className="table-row">
                <span>{evaluation.cedula}</span>
                <span>{evaluation.nombre}</span>
                <span>{evaluation.campo}</span>
                <span>{evaluation.procedure_codigo}</span>
                <span className={`result ${evaluation.aprobo === 'Sí' ? 'approved' : 'failed'}`}>
                  {evaluation.aprobo === 'Sí' ? 'Aprobado' : 'Reprobado'}
                </span>
                <span>{new Date(evaluation.completed_at).toLocaleDateString()}</span>
                <span>
                  <button 
                    onClick={() => loadEvaluationReport(evaluation.evaluation_id)}
                    className="btn-small"
                  >
                    Ver Reporte
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderReport = () => {
    if (!selectedEvaluation) return <div>No hay reporte seleccionado</div>

    const { evaluation, answers, applied_knowledge, feedback } = selectedEvaluation

    return (
      <div className="evaluation-report">
        <div className="report-header">
          <h2>📋 Reporte Completo de Evaluación</h2>
          <button 
            onClick={() => setActiveTab('search')}
            className="btn-back"
          >
            ← Volver a Búsqueda
          </button>
        </div>

        <div className="report-section">
          <h3>Datos del Evaluado</h3>
          <div className="data-grid">
            <div><strong>Cédula:</strong> {evaluation.cedula}</div>
            <div><strong>Nombre:</strong> {evaluation.nombre}</div>
            <div><strong>Cargo:</strong> {evaluation.cargo}</div>
            <div><strong>Campo:</strong> {evaluation.campo}</div>
            <div><strong>Procedimiento:</strong> {evaluation.procedure_codigo} - {evaluation.procedure_nombre}</div>
            <div><strong>Fecha:</strong> {new Date(evaluation.completed_at).toLocaleString()}</div>
          </div>
        </div>

        <div className="report-section">
          <h3>Resultados</h3>
          <div className="results-summary">
            <div className="result-item">
              <span>Preguntas Correctas:</span>
              <span>{evaluation.correct_answers} / {evaluation.total_questions}</span>
            </div>
            <div className="result-item">
              <span>Porcentaje:</span>
              <span>{evaluation.score_percentage}%</span>
            </div>
            <div className="result-item">
              <span>Estado:</span>
              <span className={evaluation.aprobo === 'Sí' ? 'approved' : 'failed'}>
                {evaluation.aprobo === 'Sí' ? 'APROBADO' : 'REPROBADO'}
              </span>
            </div>
          </div>
        </div>

        <div className="report-section">
          <h3>Preguntas y Respuestas</h3>
          <div className="questions-report">
            {answers.map((answer, index) => (
              <div key={index} className={`question-block ${answer.is_correct === 'Sí' ? 'correct' : 'incorrect'}`}>
                <div className="question-header">
                  <span className="question-number">Pregunta {answer.question_id}</span>
                  <span className={`result-indicator ${answer.is_correct === 'Sí' ? 'correct' : 'incorrect'}`}>
                    {answer.is_correct === 'Sí' ? '✅ Correcta' : '❌ Incorrecta'}
                  </span>
                </div>
                <div className="question-text">{answer.question_text}</div>
                <div className="options-grid">
                  <div className={`option ${answer.selected_option === 'A' ? 'selected' : ''}`}>
                    <strong>A)</strong> {answer.option_a_text}
                  </div>
                  <div className={`option ${answer.selected_option === 'B' ? 'selected' : ''}`}>
                    <strong>B)</strong> {answer.option_b_text}
                  </div>
                  <div className={`option ${answer.selected_option === 'C' ? 'selected' : ''}`}>
                    <strong>C)</strong> {answer.option_c_text}
                  </div>
                  <div className={`option ${answer.selected_option === 'D' ? 'selected' : ''}`}>
                    <strong>D)</strong> {answer.option_d_text}
                  </div>
                </div>
                {answer.is_correct === 'No' && (
                  <div className="correct-answer">
                    <strong>Respuesta correcta:</strong> {answer.correct_option_displayed}) {answer.correct_text}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {applied_knowledge && (
          <div className="report-section">
            <h3>Conocimiento Aplicado</h3>
            <div className="applied-knowledge">
              <div className="knowledge-item">
                <span>Describió el procedimiento:</span>
                <span className={applied_knowledge.describio_procedimiento === 'Sí' ? 'yes' : 'no'}>
                  {applied_knowledge.describio_procedimiento}
                </span>
              </div>
              <div className="knowledge-item">
                <span>Identificó riesgos:</span>
                <span className={applied_knowledge.identifico_riesgos === 'Sí' ? 'yes' : 'no'}>
                  {applied_knowledge.identifico_riesgos}
                </span>
              </div>
              <div className="knowledge-item">
                <span>Identificó EPP:</span>
                <span className={applied_knowledge.identifico_epp === 'Sí' ? 'yes' : 'no'}>
                  {applied_knowledge.identifico_epp}
                </span>
              </div>
              <div className="knowledge-item">
                <span>Describió incidentes:</span>
                <span className={applied_knowledge.describio_incidentes === 'Sí' ? 'yes' : 'no'}>
                  {applied_knowledge.describio_incidentes}
                </span>
              </div>
            </div>
          </div>
        )}

        {feedback && (
          <div className="report-section">
            <h3>Feedback y Observaciones</h3>
            <div className="feedback-section">
              <div className="feedback-item">
                <strong>¿Hizo sugerencia?</strong> {feedback.hizo_sugerencia}
              </div>
              {feedback.cual_sugerencia && (
                <div className="feedback-item">
                  <strong>Sugerencia:</strong> {feedback.cual_sugerencia}
                </div>
              )}
              {feedback.requiere_entrenamiento && (
                <div className="feedback-item">
                  <strong>Requiere entrenamiento en:</strong> {feedback.requiere_entrenamiento}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="evaluations-manager">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="tabs">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'search' ? 'active' : ''}
          onClick={() => setActiveTab('search')}
        >
          Buscar Evaluaciones
        </button>
        {selectedEvaluation && (
          <button 
            className={activeTab === 'report' ? 'active' : ''}
            onClick={() => setActiveTab('report')}
          >
            Reporte Completo
          </button>
        )}
      </div>

      <div className="tab-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'search' && renderSearch()}
        {activeTab === 'report' && renderReport()}
      </div>
    </div>
  )
}

export default EvaluationsManager