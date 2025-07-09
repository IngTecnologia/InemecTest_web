/**
 * Componente mejorado para gestión de evaluaciones presentadas
 */

import React, { useState, useEffect } from 'react'
import useAdminAuth from '../../hooks/useAdminAuth'

const EvaluationsManagerEnhanced = () => {
  const { getAuthHeaders } = useAdminAuth()
  
  // Mapeo entre valores de evaluaciones y procedimientos
  const campoMapping = {
    'Cupiagua': 'Campo Cupiagua',
    'Cusiana': 'Campo Cusiana', 
    'Florena': 'Campo Floreña',
    'Transversal': 'Campo General'
  }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [filteredStats, setFilteredStats] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [evaluations, setEvaluations] = useState([])
  const [allEvaluations, setAllEvaluations] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedEvaluation, setSelectedEvaluation] = useState(null)
  
  // Estados para comboboxes dinámicos
  const [procedures, setProcedures] = useState([])
  const [availableDisciplinas, setAvailableDisciplinas] = useState([])
  const [availableProcedimientos, setAvailableProcedimientos] = useState([])
  
  // Estados para autocomplete
  const [disciplinaSearch, setDisciplinaSearch] = useState('')
  const [procedimientoSearch, setProcedimientoSearch] = useState('')
  const [showDisciplinaSuggestions, setShowDisciplinaSuggestions] = useState(false)
  const [showProcedimientoSuggestions, setShowProcedimientoSuggestions] = useState(false)
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    campo: '',
    disciplina: '',
    procedimiento: '',
    fechaDesde: '',
    fechaHasta: '',
    aproboConocimiento: '',
    aproboAplicado: ''
  })

  useEffect(() => {
    loadStats()
    loadAllEvaluations()
    loadProcedures()
  }, [])

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters()
  }, [filters, allEvaluations])

  // Procesar procedimientos para extraer disciplinas y opciones dinámicas
  useEffect(() => {
    if (procedures.length > 0) {
      // Extraer disciplinas únicas
      const disciplinas = [...new Set(
        procedures
          .filter(proc => proc.datos_completos?.disciplina)
          .map(proc => proc.datos_completos.disciplina)
      )].sort()
      
      setAvailableDisciplinas(disciplinas)
    }
  }, [procedures])

  // Filtrar procedimientos disponibles basado en campo y disciplina seleccionados
  useEffect(() => {
    let filtered = procedures

    // Filtrar por campo si está seleccionado
    if (filters.campo) {
      const mappedCampo = campoMapping[filters.campo] || filters.campo
      filtered = filtered.filter(proc => 
        proc.datos_completos?.campo === mappedCampo
      )
    }

    // Filtrar por disciplina si está seleccionada
    if (filters.disciplina) {
      filtered = filtered.filter(proc => 
        proc.datos_completos?.disciplina === filters.disciplina
      )
    }

    setAvailableProcedimientos(filtered)
  }, [procedures, filters.campo, filters.disciplina])

  // Sincronizar campos de búsqueda con filtros
  useEffect(() => {
    if (!filters.disciplina) {
      setDisciplinaSearch('')
    } else if (disciplinaSearch !== filters.disciplina) {
      setDisciplinaSearch(filters.disciplina)
    }
  }, [filters.disciplina])

  useEffect(() => {
    if (!filters.procedimiento) {
      setProcedimientoSearch('')
    }
  }, [filters.procedimiento])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError('')
      
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
      setError('Error de conexión: ' + error.message)
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchEvaluations = async () => {
    if (!searchTerm.trim()) {
      setError('Por favor ingrese un número de cédula para buscar')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`/api/v1/admin/evaluations/search?cedula=${encodeURIComponent(searchTerm)}&limit=20`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const result = await response.json()
        setEvaluations(result.data.evaluations)
        if (result.data.evaluations.length === 0) {
          setError('No se encontraron evaluaciones para esta cédula')
        }
      } else {
        setError('Error buscando evaluaciones')
      }
    } catch (error) {
      setError('Error de conexión: ' + error.message)
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
    setEvaluations([])
    setError('')
  }

  const loadAllEvaluations = async () => {
    try {
      const response = await fetch('/api/v1/admin/evaluations/search?limit=1000', {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const result = await response.json()
        const evaluations = result.data.evaluations || []
        setAllEvaluations(evaluations)
        // Inicializar evaluations mostradas con todos los datos
        setEvaluations(evaluations)
      }
    } catch (error) {
      console.error('Error cargando evaluaciones:', error)
    }
  }

  const loadProcedures = async () => {
    try {
      const response = await fetch('/api/v1/procedures', {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const result = await response.json()
        setProcedures(result.procedures || [])
      }
    } catch (error) {
      console.error('Error cargando procedimientos:', error)
    }
  }

  const applyFilters = () => {
    if (!allEvaluations.length) return

    let filtered = [...allEvaluations]

    // Aplicar filtros
    if (filters.campo) {
      filtered = filtered.filter(evaluation => 
        evaluation.campo === filters.campo
      )
    }
    
    if (filters.disciplina) {
      filtered = filtered.filter(evaluation => {
        // Buscar el procedimiento correspondiente para obtener la disciplina
        const procedure = procedures.find(proc => proc.codigo === evaluation.procedure_codigo)
        return procedure?.datos_completos?.disciplina === filters.disciplina
      })
    }
    
    if (filters.procedimiento) {
      filtered = filtered.filter(evaluation => 
        evaluation.procedure_codigo === filters.procedimiento
      )
    }
    
    if (filters.fechaDesde) {
      filtered = filtered.filter(evaluation => 
        new Date(evaluation.completed_at) >= new Date(filters.fechaDesde)
      )
    }
    
    if (filters.fechaHasta) {
      filtered = filtered.filter(evaluation => 
        new Date(evaluation.completed_at) <= new Date(filters.fechaHasta + 'T23:59:59')
      )
    }
    
    if (filters.aproboConocimiento) {
      filtered = filtered.filter(evaluation => 
        evaluation.aprobo_conocimiento === filters.aproboConocimiento
      )
    }
    
    if (filters.aproboAplicado) {
      filtered = filtered.filter(evaluation => 
        evaluation.aprobo === filters.aproboAplicado
      )
    }

    // Actualizar evaluaciones mostradas y calcular estadísticas filtradas
    setEvaluations(filtered)
    
    // Solo calcular estadísticas filtradas si hay filtros activos
    if (hasActiveFilters()) {
      calculateFilteredStats(filtered)
    } else {
      setFilteredStats(null)
    }
  }

  const calculateFilteredStats = (filteredEvaluations) => {
    if (!filteredEvaluations.length) {
      setFilteredStats(null)
      return
    }

    const stats_by_campo = {}
    let approved_conocimiento_count = 0
    let approved_aplicado_count = 0

    filteredEvaluations.forEach(evaluation => {
      // Procesar campo
      const campo = evaluation.campo || 'Sin campo'
      stats_by_campo[campo] = (stats_by_campo[campo] || 0) + 1
      
      // Contar aprobados
      if (evaluation.aprobo_conocimiento === 'Sí') approved_conocimiento_count++
      if (evaluation.aprobo === 'Sí') approved_aplicado_count++
    })

    const conocimiento_rate = (approved_conocimiento_count / filteredEvaluations.length) * 100
    const aplicado_rate = (approved_aplicado_count / filteredEvaluations.length) * 100

    setFilteredStats({
      total_evaluations: filteredEvaluations.length,
      by_campo: stats_by_campo,
      conocimiento: {
        approval_rate: Math.round(conocimiento_rate * 100) / 100,
        approved_count: approved_conocimiento_count,
        failed_count: filteredEvaluations.length - approved_conocimiento_count
      },
      aplicado: {
        approval_rate: Math.round(aplicado_rate * 100) / 100,
        approved_count: approved_aplicado_count,
        failed_count: filteredEvaluations.length - approved_aplicado_count
      },
      recent_evaluations: filteredEvaluations
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
        .slice(0, 10)
    })
  }

  const updateFilter = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value }
      
      // Limpiar filtros dependientes
      if (key === 'campo') {
        // Si cambia el campo, limpiar disciplina y procedimiento
        newFilters.disciplina = ''
        newFilters.procedimiento = ''
      } else if (key === 'disciplina') {
        // Si cambia la disciplina, limpiar procedimiento
        newFilters.procedimiento = ''
      }
      
      return newFilters
    })
  }

  const clearFilters = () => {
    setFilters({
      campo: '',
      disciplina: '',
      procedimiento: '',
      fechaDesde: '',
      fechaHasta: '',
      aproboConocimiento: '',
      aproboAplicado: ''
    })
  }

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== '')
  }

  // Funciones para autocomplete
  const handleDisciplinaSearch = (value) => {
    setDisciplinaSearch(value)
    setShowDisciplinaSuggestions(true)
    if (!value.trim()) {
      updateFilter('disciplina', '')
    }
  }

  const selectDisciplina = (disciplina) => {
    setDisciplinaSearch(disciplina)
    updateFilter('disciplina', disciplina)
    setShowDisciplinaSuggestions(false)
  }

  const handleProcedimientoSearch = (value) => {
    setProcedimientoSearch(value)
    setShowProcedimientoSuggestions(true)
    if (!value.trim()) {
      updateFilter('procedimiento', '')
    }
  }

  const selectProcedimiento = (procedimiento) => {
    setProcedimientoSearch(`${procedimiento.codigo} - ${procedimiento.nombre}`)
    updateFilter('procedimiento', procedimiento.codigo)
    setShowProcedimientoSuggestions(false)
  }

  const filterDisciplinaSuggestions = () => {
    if (!disciplinaSearch.trim()) return availableDisciplinas
    return availableDisciplinas.filter(disciplina =>
      disciplina.toLowerCase().includes(disciplinaSearch.toLowerCase())
    )
  }

  const filterProcedimientoSuggestions = () => {
    if (!procedimientoSearch.trim()) return availableProcedimientos.slice(0, 10)
    return availableProcedimientos.filter(proc =>
      proc.codigo.toLowerCase().includes(procedimientoSearch.toLowerCase()) ||
      proc.nombre.toLowerCase().includes(procedimientoSearch.toLowerCase())
    ).slice(0, 10)
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

  const renderFiltersPanel = () => (
    <div style={{
      background: '#f8f9fa',
      padding: '1.5rem',
      borderRadius: '8px',
      marginBottom: '1.5rem',
      border: '1px solid #e1e5e9'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, color: '#333' }}>🔍 Filtros</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={{
              padding: '0.5rem 1rem',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            {showAdvancedFilters ? 'Ocultar avanzados' : 'Filtros avanzados'}
          </button>
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              style={{
                padding: '0.5rem 1rem',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Filtros principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: showAdvancedFilters ? '1rem' : '0'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.9rem' }}>
            Campo:
          </label>
          <select
            value={filters.campo}
            onChange={(e) => updateFilter('campo', e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="">Todos los campos</option>
            <option value="Cupiagua">Cupiagua</option>
            <option value="Cusiana">Cusiana</option>
            <option value="Florena">Floreña</option>
            <option value="Transversal">Transversal</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.9rem' }}>
            Disciplina:
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={disciplinaSearch}
              onChange={(e) => handleDisciplinaSearch(e.target.value)}
              onFocus={() => setShowDisciplinaSuggestions(true)}
              onBlur={() => setTimeout(() => setShowDisciplinaSuggestions(false), 200)}
              placeholder="Buscar disciplina..."
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            {showDisciplinaSuggestions && filterDisciplinaSuggestions().length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid #ddd',
                borderTop: 'none',
                borderRadius: '0 0 4px 4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000
              }}>
                {filterDisciplinaSuggestions().map(disciplina => (
                  <div
                    key={disciplina}
                    onClick={() => selectDisciplina(disciplina)}
                    style={{
                      padding: '0.5rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f0f0f0'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                  >
                    {disciplina}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.9rem' }}>
            Procedimiento:
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={procedimientoSearch}
              onChange={(e) => handleProcedimientoSearch(e.target.value)}
              onFocus={() => setShowProcedimientoSuggestions(true)}
              onBlur={() => setTimeout(() => setShowProcedimientoSuggestions(false), 200)}
              placeholder="Buscar por código o nombre..."
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            {showProcedimientoSuggestions && filterProcedimientoSuggestions().length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid #ddd',
                borderTop: 'none',
                borderRadius: '0 0 4px 4px',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 1000
              }}>
                {filterProcedimientoSuggestions().map(proc => (
                  <div
                    key={proc.codigo}
                    onClick={() => selectProcedimiento(proc)}
                    style={{
                      padding: '0.75rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f0f0f0'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                  >
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{proc.codigo}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                      {proc.nombre.length > 60 ? proc.nombre.substring(0, 60) + '...' : proc.nombre}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.9rem' }}>
            Fecha desde:
          </label>
          <input
            type="date"
            value={filters.fechaDesde}
            onChange={(e) => updateFilter('fechaDesde', e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.9rem' }}>
            Fecha hasta:
          </label>
          <input
            type="date"
            value={filters.fechaHasta}
            onChange={(e) => updateFilter('fechaHasta', e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      {/* Filtros avanzados */}
      {showAdvancedFilters && (
        <div style={{
          borderTop: '1px solid #ddd',
          paddingTop: '1rem'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '0.9rem' }}>Filtros Avanzados</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.9rem' }}>
                Aprobó Conocimiento:
              </label>
              <select
                value={filters.aproboConocimiento}
                onChange={(e) => updateFilter('aproboConocimiento', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">Todos</option>
                <option value="Sí">Sí (≥80%)</option>
                <option value="No">No (&lt;80%)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.9rem' }}>
                Aprobó Aplicado:
              </label>
              <select
                value={filters.aproboAplicado}
                onChange={(e) => updateFilter('aproboAplicado', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">Todos</option>
                <option value="Sí">Sí (Supervisor)</option>
                <option value="No">No (Supervisor)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {hasActiveFilters() && (
        <div style={{
          marginTop: '1rem',
          padding: '0.5rem',
          background: '#e0f2fe',
          borderRadius: '4px',
          fontSize: '0.8rem',
          color: '#0369a1'
        }}>
          ℹ️ Filtros activos: {Object.entries(filters).filter(([_, value]) => value !== '').length}
        </div>
      )}
      
      {hasActiveFilters() && evaluations.length === 0 && (
        <div style={{
          marginTop: '0.5rem',
          padding: '0.75rem',
          background: '#fef3c7',
          borderRadius: '4px',
          fontSize: '0.85rem',
          color: '#92400e',
          border: '1px solid #fbbf24'
        }}>
          ⚠️ No se encontraron evaluaciones que coincidan con los filtros seleccionados
        </div>
      )}
    </div>
  )

  const renderStatsCards = (statsData, title, subtitle = null) => (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, color: '#333' }}>{title}</h3>
        {subtitle && (
          <span style={{ 
            fontSize: '0.8rem', 
            color: '#666', 
            background: '#f1f5f9', 
            padding: '0.25rem 0.5rem', 
            borderRadius: '4px' 
          }}>
            {subtitle}
          </span>
        )}
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#333', fontSize: '0.9rem' }}>Total Evaluaciones</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
            {statsData.total_evaluations}
          </div>
        </div>
        
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#333', fontSize: '0.9rem' }}>Aprobación Conocimiento</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
            {statsData.conocimiento?.approval_rate || statsData.approval_rate}%
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>
            {statsData.conocimiento?.approved_count || statsData.approved_count} aprobados
          </div>
        </div>
        
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#333', fontSize: '0.9rem' }}>Aprobación Aplicado</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
            {statsData.aplicado?.approval_rate || 0}%
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>
            {statsData.aplicado?.approved_count || 0} aprobados
          </div>
        </div>
        
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#333', fontSize: '0.9rem' }}>Total Reprobados</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>
            {statsData.conocimiento?.failed_count || statsData.failed_count}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>
            en conocimiento
          </div>
        </div>
      </div>
    </div>
  )

  const renderDashboard = () => (
    <div style={{ padding: '1rem' }}>
      <h2>📊 Dashboard de Evaluaciones</h2>
      
      {renderFiltersPanel()}
      
      {loading && <div style={{ textAlign: 'center', padding: '1rem' }}>Cargando estadísticas...</div>}
      
      {stats && (
        <div>
          {/* Estadísticas generales */}
          {renderStatsCards(stats, "📈 Estadísticas Generales", "Todas las evaluaciones")}
          
          {/* Estadísticas filtradas */}
          {filteredStats && hasActiveFilters() && (
            renderStatsCards(filteredStats, "🎯 Estadísticas Filtradas", `${filteredStats.total_evaluations} evaluaciones`)
          )}

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>Evaluaciones por Campo</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '0.5rem'
            }}>
              {Object.entries(stats.by_campo).map(([campo, count]) => (
                <div key={campo} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #e1e5e9'
                }}>
                  <span style={{ fontWeight: '500' }}>{campo}:</span>
                  <span style={{ fontWeight: 'bold', color: '#667eea' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {stats.recent_evaluations && stats.recent_evaluations.length > 0 && (
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#333' }}>
                {hasActiveFilters() && filteredStats ? 'Evaluaciones Filtradas' : 'Evaluaciones Recientes'}
              </h3>
              {hasActiveFilters() && filteredStats && (
                <span style={{
                  fontSize: '0.8rem',
                  color: '#666',
                  background: '#e0f2fe',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px'
                }}>
                  {filteredStats.recent_evaluations.length} resultados
                </span>
              )}
            </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr 1fr 80px 80px 80px 100px 120px',
                gap: '1rem',
                alignItems: 'center',
                fontWeight: '600',
                fontSize: '0.85rem',
                color: '#666',
                padding: '0.75rem',
                borderBottom: '2px solid #e1e5e9',
                marginBottom: '0.5rem'
              }}>
                <span>Cédula</span>
                <span>Nombre</span>
                <span>Procedimiento</span>
                <span style={{ textAlign: 'center' }}>Score</span>
                <span style={{ textAlign: 'center' }}>Conocimiento</span>
                <span style={{ textAlign: 'center' }}>Aplicado</span>
                <span style={{ textAlign: 'center' }}>Fecha</span>
                <span style={{ textAlign: 'center' }}>Acciones</span>
              </div>
              
              {(hasActiveFilters() && filteredStats ? filteredStats.recent_evaluations : stats.recent_evaluations).slice(0, 8).map((evaluation, index) => (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 1fr 80px 80px 80px 100px 120px',
                  gap: '1rem',
                  padding: '0.75rem',
                  borderBottom: '1px solid #e1e5e9',
                  alignItems: 'center',
                  fontSize: '0.9rem'
                }}>
                  <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>{evaluation.cedula}</span>
                  <span>{evaluation.nombre}</span>
                  <span style={{ color: '#666' }}>{evaluation.procedure_codigo}</span>
                  <span style={{ fontWeight: 'bold', color: '#667eea', textAlign: 'center' }}>
                    {evaluation.score_percentage}%
                  </span>
                  <span style={{ 
                    color: evaluation.aprobo_conocimiento === 'Sí' ? '#059669' : '#dc2626',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}>
                    {evaluation.aprobo_conocimiento === 'Sí' ? '✅' : '❌'}
                  </span>
                  <span style={{ 
                    color: evaluation.aprobo === 'Sí' ? '#059669' : '#dc2626',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}>
                    {evaluation.aprobo === 'Sí' ? '✅' : '❌'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>
                    {new Date(evaluation.completed_at).toLocaleDateString()}
                  </span>
                  <span style={{ textAlign: 'center' }}>
                    <button 
                      onClick={() => loadEvaluationReport(evaluation.evaluation_id)}
                      style={{
                        padding: '0.4rem 0.6rem',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      Ver Reporte
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderSearch = () => (
    <div style={{ padding: '1rem' }}>
      <h2>🔍 Buscar Evaluaciones por Cédula</h2>
      
      <div style={{
        background: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        border: '1px solid #e1e5e9'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
              Número de Cédula:
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ingrese número de cédula (ej: 12345678)"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              onKeyPress={(e) => e.key === 'Enter' && searchEvaluations()}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
            <button
              onClick={searchEvaluations}
              disabled={loading || !searchTerm.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                background: loading || !searchTerm.trim() ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading || !searchTerm.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '500'
              }}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
            <button
              onClick={clearSearch}
              style={{
                padding: '0.75rem 1rem',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {evaluations.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            background: '#667eea',
            color: 'white',
            padding: '1rem',
            fontWeight: '600'
          }}>
            Resultados encontrados ({evaluations.length})
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr 1fr auto auto auto 120px',
            gap: '1rem',
            alignItems: 'center',
            fontWeight: '600',
            fontSize: '0.85rem',
            color: '#666',
            padding: '1rem',
            borderBottom: '2px solid #e1e5e9',
            background: '#f8f9fa'
          }}>
            <span>Cédula</span>
            <span>Nombre</span>
            <span>Procedimiento</span>
            <span>Score</span>
            <span>Resultado</span>
            <span>Fecha</span>
            <span>Acciones</span>
          </div>
          
          {evaluations.map((evaluation, index) => (
            <div key={index} style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr 1fr auto auto auto 120px',
              gap: '1rem',
              padding: '1rem',
              borderBottom: '1px solid #e1e5e9',
              alignItems: 'center',
              fontSize: '0.9rem'
            }}>
              <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>{evaluation.cedula}</span>
              <span>{evaluation.nombre}</span>
              <span style={{ color: '#666' }}>{evaluation.procedure_codigo}</span>
              <span style={{ fontWeight: '600' }}>{evaluation.score_percentage}%</span>
              <span style={{ 
                color: evaluation.aprobo === 'Sí' ? '#059669' : '#dc2626',
                fontWeight: 'bold'
              }}>
                {evaluation.aprobo === 'Sí' ? '✅ Aprobó' : '❌ Reprobó'}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#666' }}>
                {new Date(evaluation.completed_at).toLocaleDateString()}
              </span>
              <span>
                <button 
                  onClick={() => loadEvaluationReport(evaluation.evaluation_id)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Ver Reporte
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderReport = () => {
    if (!selectedEvaluation) return <div>No hay reporte seleccionado</div>

    const { evaluation, answers, applied_knowledge, feedback } = selectedEvaluation

    return (
      <div style={{ padding: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header con acciones */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <button 
            onClick={() => setActiveTab('search')}
            style={{
              padding: '0.5rem 1rem',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Volver a Búsqueda
          </button>
          <button 
            onClick={() => downloadReportPDF(evaluation.evaluation_id)}
            style={{
              padding: '0.5rem 1rem',
              background: '#c62828',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📄 Descargar PDF
          </button>
        </div>

        {/* Contenedor del reporte formal */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          fontFamily: 'Arial, sans-serif',
          lineHeight: '1.6',
          color: '#333'
        }} id={`report-${evaluation.evaluation_id}`}>
          {/* Encabezado oficial */}
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem',
            paddingBottom: '1rem',
            borderBottom: '3px solid #c62828'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2rem',
              marginBottom: '1rem'
            }}>
              <img src="/Logo-Inemec.jpg" alt="Logo INEMEC" style={{ maxWidth: '120px', height: 'auto' }} />
              <div>
                <h1 style={{ color: '#c62828', fontSize: '1.8rem', margin: '0', fontWeight: 'bold' }}>
                  REPORTE OFICIAL DE EVALUACIÓN
                </h1>
                <h2 style={{ color: '#666', fontSize: '1.2rem', margin: '0.5rem 0' }}>
                  Sistema DICACOCU 360°
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#888', margin: '0' }}>
                  Fecha de generación: {new Date().toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
            <div style={{
              background: '#f8f9fa',
              padding: '0.5rem',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>
              <strong>ID de Evaluación: {evaluation.evaluation_id}</strong>
            </div>
          </div>

          {/* Sección 1: Datos del Evaluado */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              background: 'linear-gradient(135deg, #c62828 0%, #8d1e1e 100%)',
              color: 'white',
              padding: '0.75rem 1rem',
              margin: '0 0 1rem 0',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}>
              1. INFORMACIÓN DEL EVALUADO
            </h3>
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              {[
                { label: 'Cédula:', value: evaluation.cedula },
                { label: 'Nombre completo:', value: evaluation.nombre },
                { label: 'Cargo:', value: evaluation.cargo },
                { label: 'Campo operativo:', value: evaluation.campo },
                { label: 'Procedimiento evaluado:', value: `${evaluation.procedure_codigo} - ${evaluation.procedure_nombre}` },
                { label: 'Fecha de evaluación:', value: new Date(evaluation.completed_at).toLocaleString('es-ES') }
              ].map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  borderBottom: index === 5 ? 'none' : '1px solid #eee'
                }}>
                  <div style={{
                    background: '#f8f9fa',
                    padding: '0.75rem',
                    fontWeight: 'bold',
                    width: '200px',
                    borderRight: '1px solid #eee'
                  }}>
                    {item.label}
                  </div>
                  <div style={{ padding: '0.75rem', flex: 1 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sección 2: Resultados Generales */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              background: 'linear-gradient(135deg, #c62828 0%, #8d1e1e 100%)',
              color: 'white',
              padding: '0.75rem 1rem',
              margin: '0 0 1rem 0',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}>
              2. RESULTADOS GENERALES
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              {[
                { label: 'Preguntas totales:', value: evaluation.total_questions },
                { label: 'Respuestas correctas:', value: evaluation.correct_answers },
                { label: 'Porcentaje obtenido:', value: `${evaluation.score_percentage}%` },
                { label: 'Evaluación de conocimiento:', value: evaluation.aprobo_conocimiento === 'Sí' ? 'APROBADO' : 'NO APROBADO', className: evaluation.aprobo_conocimiento === 'Sí' ? 'approved' : 'failed' },
                { label: 'Conocimiento aplicado:', value: evaluation.aprobo === 'Sí' ? 'APROBADO' : 'NO APROBADO', className: evaluation.aprobo === 'Sí' ? 'approved' : 'failed' }
              ].map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: '#f8f9fa',
                  borderRadius: '4px',
                  borderLeft: '4px solid #c62828'
                }}>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>{item.label}</span>
                  <span style={{ 
                    fontWeight: 'bold',
                    color: item.className === 'approved' ? '#2e7d32' : item.className === 'failed' ? '#c62828' : '#333'
                  }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sección 3: Preguntas y Respuestas */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              background: 'linear-gradient(135deg, #c62828 0%, #8d1e1e 100%)',
              color: 'white',
              padding: '0.75rem 1rem',
              margin: '0 0 1rem 0',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}>
              3. PREGUNTAS Y RESPUESTAS DETALLADAS
            </h3>
            <div>
              {answers && answers.map((answer, index) => (
                <div key={index} style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: '#f8f9fa',
                    padding: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #ddd'
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>
                      Pregunta {answer.question_id}
                    </span>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      background: answer.is_correct === 'Sí' ? '#e8f5e8' : '#ffebee',
                      color: answer.is_correct === 'Sí' ? '#2e7d32' : '#c62828'
                    }}>
                      {answer.is_correct === 'Sí' ? 'CORRECTA' : 'INCORRECTA'}
                    </span>
                  </div>
                  
                  <div style={{ padding: '1rem' }}>
                    <div style={{ marginBottom: '1rem', fontWeight: '500' }}>
                      <strong>Pregunta:</strong> {answer.question_text}
                    </div>
                    
                    <div style={{ marginLeft: '1rem' }}>
                      <div style={{ marginBottom: '0.5rem', fontWeight: '500' }}>
                        <strong>Opciones (en el orden que aparecieron en la prueba):</strong>
                      </div>
                      
                      {/* Mostrar todas las opciones en el orden original */}
                      {[
                        { letter: 'A', text: answer.option_a_text },
                        { letter: 'B', text: answer.option_b_text },
                        { letter: 'C', text: answer.option_c_text },
                        { letter: 'D', text: answer.option_d_text }
                      ].map((option, optionIndex) => {
                        const isSelected = answer.selected_option === option.letter;
                        const isCorrect = answer.correct_option_displayed === option.letter;
                        
                        let backgroundColor = '#f8f9fa';
                        let borderColor = '#ddd';
                        let textColor = '#333';
                        
                        if (isSelected && isCorrect) {
                          backgroundColor = '#e8f5e8';
                          borderColor = '#2e7d32';
                          textColor = '#2e7d32';
                        } else if (isSelected) {
                          backgroundColor = '#e3f2fd';
                          borderColor = '#1976d2';
                          textColor = '#1976d2';
                        } else if (isCorrect) {
                          backgroundColor = '#e8f5e8';
                          borderColor = '#2e7d32';
                          textColor = '#2e7d32';
                        }
                        
                        return (
                          <div key={optionIndex} style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.75rem',
                            marginBottom: '0.5rem',
                            backgroundColor: backgroundColor,
                            border: `1px solid ${borderColor}`,
                            borderRadius: '4px',
                            position: 'relative'
                          }}>
                            <span style={{ 
                              fontWeight: 'bold',
                              marginRight: '0.5rem',
                              minWidth: '25px',
                              color: textColor
                            }}>
                              {option.letter})
                            </span>
                            <span style={{ 
                              flex: 1,
                              color: textColor
                            }}>
                              {option.text}
                            </span>
                            
                            {/* Indicadores */}
                            <div style={{ marginLeft: '1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
                              {isSelected && (
                                <span style={{ 
                                  color: '#1976d2',
                                  marginRight: '0.5rem'
                                }}>
                                  ← SELECCIONADA
                                </span>
                              )}
                              {isCorrect && (
                                <span style={{ 
                                  color: '#2e7d32'
                                }}>
                                  ← CORRECTA
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Resumen de la respuesta */}
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: answer.is_correct === 'Sí' ? '#e8f5e8' : '#ffebee',
                        borderRadius: '4px',
                        border: `1px solid ${answer.is_correct === 'Sí' ? '#2e7d32' : '#c62828'}`
                      }}>
                        <strong>Resultado:</strong> El evaluado seleccionó la opción {answer.selected_option} 
                        {answer.is_correct === 'Sí' ? ' (CORRECTA)' : ' (INCORRECTA)'}
                        {answer.is_correct === 'No' && (
                          <span>, la respuesta correcta era la opción {answer.correct_option_displayed}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sección 4: Conocimiento Aplicado */}
          {applied_knowledge && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                background: 'linear-gradient(135deg, #c62828 0%, #8d1e1e 100%)',
                color: 'white',
                padding: '0.75rem 1rem',
                margin: '0 0 1rem 0',
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}>
                4. EVALUACIÓN DE CONOCIMIENTO APLICADO
              </h3>
              <div style={{
                border: '1px solid #ddd',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                {[
                  { label: 'Describió el procedimiento:', value: applied_knowledge.describio_procedimiento },
                  { label: 'Identificó riesgos operacionales:', value: applied_knowledge.identifico_riesgos },
                  { label: 'Identificó EPP requerido:', value: applied_knowledge.identifico_epp },
                  { label: 'Describió manejo de incidentes:', value: applied_knowledge.describio_incidentes }
                ].map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    borderBottom: index === 3 ? 'none' : '1px solid #eee'
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>{item.label}</span>
                    <span style={{ 
                      fontWeight: 'bold',
                      color: item.value === 'Sí' ? '#2e7d32' : '#c62828'
                    }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sección 5: Feedback */}
          {feedback && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                background: 'linear-gradient(135deg, #c62828 0%, #8d1e1e 100%)',
                color: 'white',
                padding: '0.75rem 1rem',
                margin: '0 0 1rem 0',
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}>
                5. FEEDBACK Y OBSERVACIONES
              </h3>
              <div style={{
                border: '1px solid #ddd',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  borderBottom: '1px solid #eee'
                }}>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>¿Realizó sugerencias?</span>
                  <span style={{ fontWeight: 'bold' }}>{feedback.hizo_sugerencia}</span>
                </div>
                {feedback.cual_sugerencia && (
                  <div style={{
                    padding: '0.75rem',
                    borderBottom: '1px solid #eee'
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>Sugerencia:</span>
                    <div style={{ marginTop: '0.5rem' }}>{feedback.cual_sugerencia}</div>
                  </div>
                )}
                {feedback.requiere_entrenamiento && (
                  <div style={{
                    padding: '0.75rem'
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>Requiere entrenamiento en:</span>
                    <div style={{ marginTop: '0.5rem' }}>{feedback.requiere_entrenamiento}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sección 6: Conclusiones */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              background: 'linear-gradient(135deg, #c62828 0%, #8d1e1e 100%)',
              color: 'white',
              padding: '0.75rem 1rem',
              margin: '0 0 1rem 0',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}>
              6. CONCLUSIONES
            </h3>
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              {[
                { label: 'Estado final de la evaluación:', value: evaluation.aprobo === 'Sí' ? 'APROBADO' : 'NO APROBADO', className: evaluation.aprobo === 'Sí' ? 'approved' : 'failed' },
                { label: 'Fecha de evaluación:', value: new Date(evaluation.completed_at).toLocaleString('es-ES') },
                { label: 'Evaluador supervisado por:', value: 'Sistema DICACOCU 360°' }
              ].map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  borderBottom: index === 2 ? 'none' : '1px solid #eee'
                }}>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>{item.label}</span>
                  <span style={{ 
                    fontWeight: 'bold',
                    color: item.className === 'approved' ? '#2e7d32' : item.className === 'failed' ? '#c62828' : '#333'
                  }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer oficial */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '1rem',
            borderTop: '2px solid #c62828',
            textAlign: 'center',
            color: '#666',
            fontSize: '0.9rem'
          }}>
            <p>Este reporte fue generado automáticamente por el Sistema DICACOCU 360° de INEMEC.</p>
            <p>Documento confidencial para uso interno exclusivamente.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {error && (
        <div style={{
          background: '#fee',
          border: '1px solid #fcc',
          color: '#c33',
          padding: '0.75rem',
          borderRadius: '6px',
          margin: '1rem',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      <div style={{
        display: 'flex',
        borderBottom: '2px solid #e1e5e9',
        margin: '1rem 1rem 0 1rem'
      }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: activeTab === 'dashboard' ? '#f8f9fa' : 'none',
            borderBottom: activeTab === 'dashboard' ? '3px solid #667eea' : '3px solid transparent',
            cursor: 'pointer',
            fontWeight: '500',
            color: activeTab === 'dashboard' ? '#667eea' : '#666'
          }}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => setActiveTab('search')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: activeTab === 'search' ? '#f8f9fa' : 'none',
            borderBottom: activeTab === 'search' ? '3px solid #667eea' : '3px solid transparent',
            cursor: 'pointer',
            fontWeight: '500',
            color: activeTab === 'search' ? '#667eea' : '#666'
          }}
        >
          🔍 Buscar por Cédula
        </button>
        {selectedEvaluation && (
          <button
            onClick={() => setActiveTab('report')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'report' ? '#f8f9fa' : 'none',
              borderBottom: activeTab === 'report' ? '3px solid #667eea' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: '500',
              color: activeTab === 'report' ? '#667eea' : '#666'
            }}
          >
            📄 Reporte Completo
          </button>
        )}
      </div>

      <div>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'search' && renderSearch()}
        {activeTab === 'report' && renderReport()}
      </div>

      <div style={{ 
        margin: '2rem 1rem', 
        padding: '1rem', 
        background: '#f0fdf4', 
        borderRadius: '8px',
        border: '1px solid #bbf7d0'
      }}>
        <p style={{ margin: 0, color: '#059669', fontSize: '0.9rem' }}>
          💡 <strong>Funcionalidades disponibles:</strong>
        </p>
        <ul style={{ margin: '0.5rem 0 0 1rem', color: '#059669', fontSize: '0.85rem' }}>
          <li>Dashboard con estadísticas generales y filtros avanzados</li>
          <li>Búsqueda de evaluaciones por cédula con filtros</li>
          <li>Visualización de resultados y fechas</li>
          <li>✅ Reportes detallados por evaluación con descarga PDF</li>
          <li>Reporte formal profesional con logo corporativo</li>
        </ul>
      </div>
    </div>
  )
}

export default EvaluationsManagerEnhanced