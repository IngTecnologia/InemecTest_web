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
      const response = await fetch('/api/v1/admin/evaluations/statistics', {
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
        setEvaluations(result.data.evaluations || [])
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

  const downloadReportPDF = async (evaluationId) => {
    try {
      setLoading(true)
      
      // Usar html2pdf para generar PDF del reporte
      const { default: html2pdf } = await import('html2pdf.js')
      
      const element = document.getElementById(`report-${evaluationId}`)
      if (!element) {
        setError('No se puede generar el PDF: elemento no encontrado')
        return
      }

      const options = {
        margin: 1,
        filename: `reporte_evaluacion_${evaluationId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      }

      await html2pdf().set(options).from(element).save()
      
    } catch (error) {
      setError('Error generando PDF: ' + error.message)
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
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

  const renderSearch = () => {
    // Cargar todas las evaluaciones al acceder al tab
    React.useEffect(() => {
      if (activeTab === 'search' && evaluations.length === 0) {
        loadAllEvaluations()
      }
    }, [activeTab])

    const loadAllEvaluations = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/v1/admin/evaluations/search', {
          headers: getAuthHeaders()
        })
        
        if (response.ok) {
          const result = await response.json()
          setEvaluations(result.data.evaluations || [])
        } else {
          setError('Error cargando evaluaciones')
        }
      } catch (error) {
        setError('Error de conexión')
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    return (
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
        
        {loading && <div className="loading">Cargando evaluaciones...</div>}
        
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
  }

  const renderReport = () => {
    if (!selectedEvaluation) return <div>No hay reporte seleccionado</div>

    const { evaluation, answers, applied_knowledge, feedback } = selectedEvaluation

    return (
      <div className="admin-evaluation-report">
        {/* Header con acciones */}
        <div className="report-actions">
          <button 
            onClick={() => setActiveTab('search')}
            className="btn-back"
          >
            ← Volver a Búsqueda
          </button>
          <button 
            onClick={() => downloadReportPDF(evaluation.evaluation_id)}
            className="btn-download"
          >
            📄 Descargar PDF
          </button>
        </div>

        {/* Contenedor del reporte formal */}
        <div className="formal-report-container" id={`report-${evaluation.evaluation_id}`}>
          {/* Encabezado oficial */}
          <div className="official-header">
            <div className="header-content">
              <div className="logo-section">
                <img src="/Logo-Inemec.jpg" alt="Logo INEMEC" className="company-logo" />
              </div>
              <div className="title-section">
                <h1>REPORTE OFICIAL DE EVALUACIÓN</h1>
                <h2>Sistema DICACOCU 360°</h2>
                <p className="report-date">Fecha de generación: {new Date().toLocaleDateString('es-ES')}</p>
              </div>
            </div>
            <div className="report-id">
              <strong>ID de Evaluación: {evaluation.evaluation_id}</strong>
            </div>
          </div>

          {/* Sección 1: Datos del Evaluado */}
          <div className="report-section">
            <h3 className="section-title">1. INFORMACIÓN DEL EVALUADO</h3>
            <div className="info-table">
              <div className="info-row">
                <div className="info-label">Cédula:</div>
                <div className="info-value">{evaluation.cedula}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Nombre completo:</div>
                <div className="info-value">{evaluation.nombre}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Cargo:</div>
                <div className="info-value">{evaluation.cargo}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Campo operativo:</div>
                <div className="info-value">{evaluation.campo}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Procedimiento evaluado:</div>
                <div className="info-value">{evaluation.procedure_codigo} - {evaluation.procedure_nombre}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Fecha de evaluación:</div>
                <div className="info-value">{new Date(evaluation.completed_at).toLocaleString('es-ES')}</div>
              </div>
            </div>
          </div>

          {/* Sección 2: Resultados Generales */}
          <div className="report-section">
            <h3 className="section-title">2. RESULTADOS GENERALES</h3>
            <div className="results-summary">
              <div className="result-item">
                <span className="result-label">Preguntas totales:</span>
                <span className="result-value">{evaluation.total_questions}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Respuestas correctas:</span>
                <span className="result-value">{evaluation.correct_answers}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Porcentaje obtenido:</span>
                <span className="result-value">{evaluation.score_percentage}%</span>
              </div>
              <div className="result-item">
                <span className="result-label">Evaluación de conocimiento:</span>
                <span className={`result-value ${evaluation.aprobo_conocimiento === 'Sí' ? 'approved' : 'failed'}`}>
                  {evaluation.aprobo_conocimiento === 'Sí' ? 'APROBADO' : 'NO APROBADO'}
                </span>
              </div>
              <div className="result-item">
                <span className="result-label">Conocimiento aplicado:</span>
                <span className={`result-value ${evaluation.aprobo === 'Sí' ? 'approved' : 'failed'}`}>
                  {evaluation.aprobo === 'Sí' ? 'APROBADO' : 'NO APROBADO'}
                </span>
              </div>
            </div>
          </div>

          {/* Sección 3: Preguntas y Respuestas Detalladas */}
          <div className="report-section">
            <h3 className="section-title">3. PREGUNTAS Y RESPUESTAS DETALLADAS</h3>
            <div className="questions-formal">
              {answers.map((answer, index) => (
                <div key={index} className="question-formal">
                  <div className="question-header-formal">
                    <span className="question-number-formal">Pregunta {answer.question_id}</span>
                    <span className={`status-badge ${answer.is_correct === 'Sí' ? 'correct' : 'incorrect'}`}>
                      {answer.is_correct === 'Sí' ? 'CORRECTA' : 'INCORRECTA'}
                    </span>
                  </div>
                  
                  <div className="question-content-formal">
                    <div className="question-text-formal">
                      <strong>Pregunta:</strong> {answer.question_text}
                    </div>
                    
                    <div className="options-formal">
                      <div className={`option-formal ${answer.selected_option === 'A' ? 'selected' : ''} ${answer.correct_option === 'A' ? 'correct' : ''}`}>
                        <span className="option-letter">A)</span>
                        <span className="option-text">{answer.option_a_text || 'Opción A'}</span>
                        {answer.selected_option === 'A' && <span className="marker selected-marker">← SELECCIONADA</span>}
                        {answer.correct_option === 'A' && <span className="marker correct-marker">← CORRECTA</span>}
                      </div>
                      
                      <div className={`option-formal ${answer.selected_option === 'B' ? 'selected' : ''} ${answer.correct_option === 'B' ? 'correct' : ''}`}>
                        <span className="option-letter">B)</span>
                        <span className="option-text">{answer.option_b_text || 'Opción B'}</span>
                        {answer.selected_option === 'B' && <span className="marker selected-marker">← SELECCIONADA</span>}
                        {answer.correct_option === 'B' && <span className="marker correct-marker">← CORRECTA</span>}
                      </div>
                      
                      <div className={`option-formal ${answer.selected_option === 'C' ? 'selected' : ''} ${answer.correct_option === 'C' ? 'correct' : ''}`}>
                        <span className="option-letter">C)</span>
                        <span className="option-text">{answer.option_c_text || 'Opción C'}</span>
                        {answer.selected_option === 'C' && <span className="marker selected-marker">← SELECCIONADA</span>}
                        {answer.correct_option === 'C' && <span className="marker correct-marker">← CORRECTA</span>}
                      </div>
                      
                      <div className={`option-formal ${answer.selected_option === 'D' ? 'selected' : ''} ${answer.correct_option === 'D' ? 'correct' : ''}`}>
                        <span className="option-letter">D)</span>
                        <span className="option-text">{answer.option_d_text || 'Opción D'}</span>
                        {answer.selected_option === 'D' && <span className="marker selected-marker">← SELECCIONADA</span>}
                        {answer.correct_option === 'D' && <span className="marker correct-marker">← CORRECTA</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sección 4: Evaluación de Conocimiento Aplicado */}
          {applied_knowledge && (
            <div className="report-section">
              <h3 className="section-title">4. EVALUACIÓN DE CONOCIMIENTO APLICADO</h3>
              <div className="applied-knowledge-formal">
                <div className="criteria-evaluation">
                  <div className="criterion-item">
                    <span className="criterion-label">Describió el procedimiento:</span>
                    <span className={`criterion-value ${applied_knowledge.describio_procedimiento === 'Sí' ? 'approved' : 'failed'}`}>
                      {applied_knowledge.describio_procedimiento}
                    </span>
                  </div>
                  <div className="criterion-item">
                    <span className="criterion-label">Identificó riesgos operacionales:</span>
                    <span className={`criterion-value ${applied_knowledge.identifico_riesgos === 'Sí' ? 'approved' : 'failed'}`}>
                      {applied_knowledge.identifico_riesgos}
                    </span>
                  </div>
                  <div className="criterion-item">
                    <span className="criterion-label">Identificó EPP requerido:</span>
                    <span className={`criterion-value ${applied_knowledge.identifico_epp === 'Sí' ? 'approved' : 'failed'}`}>
                      {applied_knowledge.identifico_epp}
                    </span>
                  </div>
                  <div className="criterion-item">
                    <span className="criterion-label">Describió manejo de incidentes:</span>
                    <span className={`criterion-value ${applied_knowledge.describio_incidentes === 'Sí' ? 'approved' : 'failed'}`}>
                      {applied_knowledge.describio_incidentes}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sección 5: Feedback y Observaciones */}
          {feedback && (
            <div className="report-section">
              <h3 className="section-title">5. FEEDBACK Y OBSERVACIONES</h3>
              <div className="feedback-formal">
                <div className="feedback-item-formal">
                  <span className="feedback-label">¿Realizó sugerencias?</span>
                  <span className="feedback-value">{feedback.hizo_sugerencia}</span>
                </div>
                {feedback.cual_sugerencia && (
                  <div className="feedback-item-formal">
                    <span className="feedback-label">Sugerencia proporcionada:</span>
                    <span className="feedback-value">{feedback.cual_sugerencia}</span>
                  </div>
                )}
                {feedback.requiere_entrenamiento && (
                  <div className="feedback-item-formal">
                    <span className="feedback-label">Requiere entrenamiento en:</span>
                    <span className="feedback-value">{feedback.requiere_entrenamiento}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sección 6: Conclusiones */}
          <div className="report-section">
            <h3 className="section-title">6. CONCLUSIONES</h3>
            <div className="conclusions-formal">
              <div className="conclusion-item">
                <span className="conclusion-label">Estado final de la evaluación:</span>
                <span className={`conclusion-value ${evaluation.aprobo === 'Sí' ? 'approved' : 'failed'}`}>
                  {evaluation.aprobo === 'Sí' ? 'APROBADO' : 'NO APROBADO'}
                </span>
              </div>
              <div className="conclusion-item">
                <span className="conclusion-label">Fecha de evaluación:</span>
                <span className="conclusion-value">{new Date(evaluation.completed_at).toLocaleString('es-ES')}</span>
              </div>
              <div className="conclusion-item">
                <span className="conclusion-label">Evaluador supervisado por:</span>
                <span className="conclusion-value">Sistema DICACOCU 360°</span>
              </div>
            </div>
          </div>

          {/* Footer oficial */}
          <div className="report-footer">
            <p>Este reporte fue generado automáticamente por el Sistema DICACOCU 360° de INEMEC.</p>
            <p>Documento confidencial para uso interno exclusivamente.</p>
          </div>
        </div>
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

      {/* Estilos CSS para el reporte formal */}
      <style>{`
        .formal-report-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 2rem;
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
        }

        .official-header {
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 3px solid #c62828;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 1rem;
        }

        .company-logo {
          max-width: 120px;
          height: auto;
        }

        .title-section h1 {
          color: #c62828;
          font-size: 1.8rem;
          margin: 0;
          font-weight: bold;
        }

        .title-section h2 {
          color: #666;
          font-size: 1.2rem;
          margin: 0.5rem 0;
        }

        .report-date {
          font-size: 0.9rem;
          color: #888;
          margin: 0;
        }

        .report-id {
          background: #f8f9fa;
          padding: 0.5rem;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .report-section {
          margin-bottom: 2rem;
          page-break-inside: avoid;
        }

        .section-title {
          background: linear-gradient(135deg, #c62828 0%, #8d1e1e 100%);
          color: white;
          padding: 0.75rem 1rem;
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          font-weight: bold;
        }

        .info-table {
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        }

        .info-row {
          display: flex;
          border-bottom: 1px solid #eee;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          background: #f8f9fa;
          padding: 0.75rem;
          font-weight: bold;
          width: 200px;
          border-right: 1px solid #eee;
        }

        .info-value {
          padding: 0.75rem;
          flex: 1;
        }

        .results-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 4px;
          border-left: 4px solid #c62828;
        }

        .result-label {
          font-weight: bold;
          color: #333;
        }

        .result-value {
          font-weight: bold;
        }

        .result-value.approved {
          color: #2e7d32;
        }

        .result-value.failed {
          color: #c62828;
        }

        .questions-formal {
          space-y: 1rem;
        }

        .question-formal {
          border: 1px solid #ddd;
          border-radius: 8px;
          margin-bottom: 1rem;
          overflow: hidden;
        }

        .question-header-formal {
          background: #f8f9fa;
          padding: 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #ddd;
        }

        .question-number-formal {
          font-weight: bold;
          color: #333;
        }

        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .status-badge.correct {
          background: #e8f5e8;
          color: #2e7d32;
        }

        .status-badge.incorrect {
          background: #ffebee;
          color: #c62828;
        }

        .question-content-formal {
          padding: 1rem;
        }

        .question-text-formal {
          margin-bottom: 1rem;
          font-weight: 500;
        }

        .options-formal {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .option-formal {
          display: flex;
          align-items: center;
          padding: 0.5rem;
          border-radius: 4px;
          position: relative;
        }

        .option-formal.selected {
          background: #e3f2fd;
          border-left: 4px solid #1976d2;
        }

        .option-formal.correct {
          background: #e8f5e8;
          border-left: 4px solid #2e7d32;
        }

        .option-letter {
          font-weight: bold;
          margin-right: 0.5rem;
          width: 25px;
        }

        .option-text {
          flex: 1;
        }

        .marker {
          font-size: 0.8rem;
          font-weight: bold;
          margin-left: 0.5rem;
        }

        .selected-marker {
          color: #1976d2;
        }

        .correct-marker {
          color: #2e7d32;
        }

        .applied-knowledge-formal,
        .feedback-formal {
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        }

        .criterion-item,
        .feedback-item-formal {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border-bottom: 1px solid #eee;
        }

        .criterion-item:last-child,
        .feedback-item-formal:last-child {
          border-bottom: none;
        }

        .criterion-label,
        .feedback-label {
          font-weight: bold;
          color: #333;
        }

        .criterion-value,
        .feedback-value {
          font-weight: bold;
        }

        .criterion-value.approved {
          color: #2e7d32;
        }

        .criterion-value.failed {
          color: #c62828;
        }

        .conclusions-formal {
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        }

        .conclusion-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border-bottom: 1px solid #eee;
        }

        .conclusion-item:last-child {
          border-bottom: none;
        }

        .conclusion-label {
          font-weight: bold;
          color: #333;
        }

        .conclusion-value {
          font-weight: bold;
        }

        .conclusion-value.approved {
          color: #2e7d32;
        }

        .conclusion-value.failed {
          color: #c62828;
        }

        .report-footer {
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 2px solid #c62828;
          text-align: center;
          color: #666;
          font-size: 0.9rem;
        }

        .report-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .btn-back {
          background: #6c757d;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-back:hover {
          background: #5a6268;
        }

        .btn-download {
          background: #c62828;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-download:hover {
          background: #8d1e1e;
        }

        @media print {
          .report-actions {
            display: none;
          }
          
          .formal-report-container {
            max-width: none;
            margin: 0;
            padding: 1rem;
          }
        }

        /* Estilos para la tabla de evaluaciones */
        .evaluations-table {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-top: 1rem;
        }

        .table-header {
          display: grid;
          grid-template-columns: 120px 1fr 150px 150px 100px 100px 120px;
          gap: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          font-weight: bold;
          border-bottom: 2px solid #dee2e6;
        }

        .table-row {
          display: grid;
          grid-template-columns: 120px 1fr 150px 150px 100px 100px 120px;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid #dee2e6;
          align-items: center;
        }

        .table-row:hover {
          background: #f8f9fa;
        }

        .result.approved {
          color: #28a745;
          font-weight: bold;
        }

        .result.failed {
          color: #dc3545;
          font-weight: bold;
        }

        .btn-small {
          padding: 0.5rem 1rem;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .btn-small:hover {
          background: #0056b3;
        }

        .search-filters {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .filter-group {
          margin-bottom: 1rem;
        }

        .filter-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .filter-group input, .filter-group select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        .filter-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .filter-actions button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .filter-actions button:first-child {
          background: #007bff;
          color: white;
        }

        .filter-actions button:first-child:hover {
          background: #0056b3;
        }

        .filter-actions button:last-child {
          background: #6c757d;
          color: white;
        }

        .filter-actions button:last-child:hover {
          background: #545b62;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          border: 1px solid #f5c6cb;
        }
      `}</style>
    </div>
  )
}

export default EvaluationsManager