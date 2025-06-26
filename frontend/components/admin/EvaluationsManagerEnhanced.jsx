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
  const [activeTab, setActiveTab] = useState('dashboard')
  const [evaluations, setEvaluations] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadStats()
  }, [])

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

  const renderDashboard = () => (
    <div style={{ padding: '1rem' }}>
      <h2>📊 Dashboard de Evaluaciones</h2>
      
      {loading && <div style={{ textAlign: 'center', padding: '1rem' }}>Cargando estadísticas...</div>}
      
      {stats && (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
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
                {stats.total_evaluations}
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
                {stats.conocimiento?.approval_rate || stats.approval_rate}%
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                {stats.conocimiento?.approved_count || stats.approved_count} aprobados
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
                {stats.aplicado?.approval_rate || 0}%
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                {stats.aplicado?.approved_count || 0} aprobados
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
                {stats.conocimiento?.failed_count || stats.failed_count}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                en conocimiento
              </div>
            </div>
          </div>

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
              <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>Evaluaciones Recientes</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr 1fr auto auto auto auto',
                gap: '1rem',
                alignItems: 'center',
                fontWeight: '600',
                fontSize: '0.85rem',
                color: '#666',
                padding: '0.5rem',
                borderBottom: '2px solid #e1e5e9',
                marginBottom: '0.5rem'
              }}>
                <span>Cédula</span>
                <span>Nombre</span>
                <span>Procedimiento</span>
                <span>Score</span>
                <span>Conocimiento</span>
                <span>Aplicado</span>
                <span>Fecha</span>
              </div>
              {stats.recent_evaluations.slice(0, 8).map((evaluation, index) => (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr 1fr auto auto auto auto',
                  gap: '1rem',
                  padding: '0.75rem',
                  borderBottom: '1px solid #e1e5e9',
                  alignItems: 'center',
                  fontSize: '0.9rem'
                }}>
                  <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>{evaluation.cedula}</span>
                  <span>{evaluation.nombre}</span>
                  <span style={{ color: '#666' }}>{evaluation.procedure_codigo}</span>
                  <span style={{ fontWeight: 'bold', color: '#667eea' }}>
                    {evaluation.score_percentage}%
                  </span>
                  <span style={{ 
                    color: evaluation.aprobo_conocimiento === 'Sí' ? '#059669' : '#dc2626',
                    fontWeight: 'bold',
                    fontSize: '0.8rem'
                  }}>
                    {evaluation.aprobo_conocimiento === 'Sí' ? '✅' : '❌'}
                  </span>
                  <span style={{ 
                    color: evaluation.aprobo_aplicado === 'Sí' ? '#059669' : '#dc2626',
                    fontWeight: 'bold',
                    fontSize: '0.8rem'
                  }}>
                    {evaluation.aprobo_aplicado === 'Sí' ? '✅' : '❌'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>
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