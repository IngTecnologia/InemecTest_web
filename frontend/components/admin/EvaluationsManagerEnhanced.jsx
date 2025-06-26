/**
 * Componente mejorado para gestión de evaluaciones presentadas
 */

import React, { useState, useEffect } from 'react'
import useAdminAuth from '../../hooks/useAdminAuth'

const EvaluationsManagerEnhanced = () => {
  const { getAuthHeaders } = useAdminAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [filteredStats, setFilteredStats] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [evaluations, setEvaluations] = useState([])
  const [allEvaluations, setAllEvaluations] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
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
  }, [])

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters()
  }, [filters, allEvaluations])

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
        setAllEvaluations(result.data.evaluations || [])
      }
    } catch (error) {
      console.error('Error cargando evaluaciones:', error)
    }
  }

  const applyFilters = () => {
    if (!allEvaluations.length) return

    let filtered = [...allEvaluations]

    // Aplicar filtros
    if (filters.campo) {
      filtered = filtered.filter(eval => 
        eval.campo?.toLowerCase().includes(filters.campo.toLowerCase())
      )
    }
    
    if (filters.disciplina) {
      filtered = filtered.filter(eval => 
        eval.disciplina?.toLowerCase().includes(filters.disciplina.toLowerCase())
      )
    }
    
    if (filters.procedimiento) {
      filtered = filtered.filter(eval => 
        eval.procedure_codigo?.toLowerCase().includes(filters.procedimiento.toLowerCase()) ||
        eval.procedure_nombre?.toLowerCase().includes(filters.procedimiento.toLowerCase())
      )
    }
    
    if (filters.fechaDesde) {
      filtered = filtered.filter(eval => 
        new Date(eval.completed_at) >= new Date(filters.fechaDesde)
      )
    }
    
    if (filters.fechaHasta) {
      filtered = filtered.filter(eval => 
        new Date(eval.completed_at) <= new Date(filters.fechaHasta + 'T23:59:59')
      )
    }
    
    if (filters.aproboConocimiento) {
      filtered = filtered.filter(eval => 
        eval.aprobo_conocimiento === filters.aproboConocimiento
      )
    }
    
    if (filters.aproboAplicado) {
      filtered = filtered.filter(eval => 
        eval.aprobo_aplicado === filters.aproboAplicado
      )
    }

    // Calcular estadísticas filtradas
    calculateFilteredStats(filtered)
  }

  const calculateFilteredStats = (filteredEvaluations) => {
    if (!filteredEvaluations.length) {
      setFilteredStats(null)
      return
    }

    const stats_by_campo = {}
    let approved_conocimiento_count = 0
    let approved_aplicado_count = 0

    filteredEvaluations.forEach(eval => {
      // Procesar campo
      const campo = eval.campo || 'Sin campo'
      stats_by_campo[campo] = (stats_by_campo[campo] || 0) + 1
      
      // Contar aprobados
      if (eval.aprobo_conocimiento === 'Sí') approved_conocimiento_count++
      if (eval.aprobo_aplicado === 'Sí') approved_aplicado_count++
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
    setFilters(prev => ({ ...prev, [key]: value }))
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
          <input
            type="text"
            value={filters.disciplina}
            onChange={(e) => updateFilter('disciplina', e.target.value)}
            placeholder="Ej: Nuevas Tecnologías"
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
            Procedimiento:
          </label>
          <input
            type="text"
            value={filters.procedimiento}
            onChange={(e) => updateFilter('procedimiento', e.target.value)}
            placeholder="Código o nombre"
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
                gridTemplateColumns: '120px 1fr 1fr 80px 80px 80px 100px',
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
              </div>
              {(hasActiveFilters() && filteredStats ? filteredStats.recent_evaluations : stats.recent_evaluations).slice(0, 8).map((evaluation, index) => (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 1fr 80px 80px 80px 100px',
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
                    color: evaluation.aprobo_aplicado === 'Sí' ? '#059669' : '#dc2626',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}>
                    {evaluation.aprobo_aplicado === 'Sí' ? '✅' : '❌'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>
                    {new Date(evaluation.completed_at).toLocaleDateString()}
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
            gridTemplateColumns: 'auto 1fr 1fr auto auto auto',
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
          </div>
          
          {evaluations.map((evaluation, index) => (
            <div key={index} style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr 1fr auto auto auto',
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
            </div>
          ))}
        </div>
      )}
    </div>
  )

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
      </div>

      <div>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'search' && renderSearch()}
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
          <li>Dashboard con estadísticas generales</li>
          <li>Búsqueda de evaluaciones por cédula</li>
          <li>Visualización de resultados y fechas</li>
          <li>Próximamente: Reportes detallados por evaluación</li>
        </ul>
      </div>
    </div>
  )
}

export default EvaluationsManagerEnhanced