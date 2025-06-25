/**
 * Componente simplificado para gestión de evaluaciones presentadas
 */

import React, { useState, useEffect } from 'react'
import useAdminAuth from '../../hooks/useAdminAuth'

const EvaluationsManagerSimple = () => {
  const { getAuthHeaders } = useAdminAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError('')
      
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
      setError('Error de conexión: ' + error.message)
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>📊 Gestión de Evaluaciones</h2>
        <p>Cargando estadísticas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>📊 Gestión de Evaluaciones</h2>
        <div style={{ 
          background: '#fee', 
          border: '1px solid #fcc', 
          color: '#c33', 
          padding: '1rem', 
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
        <button onClick={loadStats} style={{
          padding: '0.5rem 1rem',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>📊 Gestión de Evaluaciones</h2>
      
      {stats ? (
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
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Total Evaluaciones</h3>
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
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Tasa de Aprobación</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                {stats.approval_rate}%
              </div>
            </div>
            
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Aprobados</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
                {stats.approved_count}
              </div>
            </div>
            
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Reprobados</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
                {stats.failed_count}
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
                  padding: '0.5rem',
                  background: '#f8f9fa',
                  borderRadius: '4px'
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
              <div>
                {stats.recent_evaluations.slice(0, 5).map((evaluation, index) => (
                  <div key={index} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr 1fr auto',
                    gap: '1rem',
                    padding: '0.5rem',
                    borderBottom: '1px solid #e1e5e9',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: '500' }}>{evaluation.cedula}</span>
                    <span>{evaluation.nombre}</span>
                    <span>{evaluation.procedure_codigo}</span>
                    <span style={{ 
                      color: evaluation.aprobo === 'Sí' ? '#059669' : '#dc2626',
                      fontWeight: 'bold'
                    }}>
                      {evaluation.aprobo === 'Sí' ? '✅' : '❌'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px' }}>
            <p style={{ margin: 0, color: '#059669' }}>
              🚧 <strong>En desarrollo:</strong> Próximamente se agregarán funciones de búsqueda por cédula, 
              filtros avanzados y reportes detallados de evaluaciones individuales.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>No hay estadísticas disponibles</p>
          <button onClick={loadStats} style={{
            padding: '0.5rem 1rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Cargar Estadísticas
          </button>
        </div>
      )}
    </div>
  )
}

export default EvaluationsManagerSimple