import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminStatus, useStats, useQueue, useWorkflow } from '../../hooks/useAdminStatus'
import adminApi from '../../src/services/adminApi.js'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { status, loading: statusLoading, error: statusError } = useAdminStatus(true)
  const { stats, loading: statsLoading } = useStats(true, 30000)
  const { queue, loading: queueLoading, scanProcedures } = useQueue()
  const { startWorkflow, loading: workflowLoading } = useWorkflow()
  
  const [notifications, setNotifications] = useState([])
  const [isScanning, setIsScanning] = useState(false)
  const [quickStats, setQuickStats] = useState(null)

  useEffect(() => {
    // Cargar estadísticas rápidas
    loadQuickStats()
  }, [])

  const loadQuickStats = async () => {
    try {
      const summary = await adminApi.getSystemSummary()
      if (summary.success) {
        setQuickStats(summary.data)
      }
    } catch (error) {
      console.error('Error loading quick stats:', error)
    }
  }

  const handleScanProcedures = async () => {
    try {
      setIsScanning(true)
      const startTime = Date.now()
      const result = await scanProcedures()
      const duration = ((Date.now() - startTime) / 1000).toFixed(1)
      
      // Mostrar estadísticas de escaneo optimizado
      const stats = `${result.archivos_encontrados} archivos, ${result.procedimientos_nuevos} nuevos`
      addNotification(`🚀 Escaneo optimizado completado en ${duration}s - ${stats}`, 'success')
    } catch (error) {
      addNotification(`❌ Error en escaneo: ${error.message}`, 'error')
    } finally {
      setIsScanning(false)
    }
  }

  const handleStartWorkflow = async () => {
    try {
      if (!queue || queue.total_pending === 0) {
        addNotification('⚠️ No hay procedimientos en cola para procesar', 'warning')
        return
      }

      const result = await startWorkflow()
      addNotification(`🚀 Workflow iniciado: ${result.batch_id}`, 'success')
      setTimeout(() => navigate('/admin/monitor'), 1000)
    } catch (error) {
      addNotification(`❌ Error iniciando workflow: ${error.message}`, 'error')
    }
  }

  const handleTestPipeline = async () => {
    try {
      const result = await adminApi.testFullPipeline()
      addNotification('🧪 Test del pipeline completado', 'success')
    } catch (error) {
      addNotification(`❌ Error en test: ${error.message}`, 'error')
    }
  }

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    }
    setNotifications(prev => [notification, ...prev.slice(0, 4)]) // Mantener solo 5
    
    // Auto-remove después de 5 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 5000)
  }

  const getWorkflowStatusInfo = () => {
    if (!status) return { color: '#6b7280', text: 'Desconocido', canStart: false }
    
    switch (status.workflow_state) {
      case 'idle':
        return { color: '#10b981', text: 'Sistema Listo', canStart: true }
      case 'scanning':
        return { color: '#f59e0b', text: 'Escaneando Procedimientos', canStart: false }
      case 'generating':
        return { color: '#f59e0b', text: 'Generando Preguntas', canStart: false }
      case 'validating':
        return { color: '#3b82f6', text: 'Validando Preguntas', canStart: false }
      case 'correcting':
        return { color: '#8b5cf6', text: 'Corrigiendo Preguntas', canStart: false }
      case 'completed':
        return { color: '#059669', text: 'Completado', canStart: true }
      case 'failed':
        return { color: '#ef4444', text: 'Error en Procesamiento', canStart: true }
      default:
        return { color: '#6b7280', text: status.workflow_state, canStart: false }
    }
  }

  const workflowInfo = getWorkflowStatusInfo()

  if (statusLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Cargando dashboard administrativo...</p>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notifications">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification notification-${notification.type}`}
            >
              <span>{notification.message}</span>
              <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <h2>Dashboard de Administración</h2>
        <p>Sistema de Generación Automática de Preguntas Técnicas</p>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button 
          className="action-btn primary"
          onClick={handleStartWorkflow}
          disabled={!workflowInfo.canStart || workflowLoading || !queue?.total_pending}
        >
          {workflowLoading ? '⏳' : '🚀'} Iniciar Generación Completa
        </button>
        
        <button 
          className="action-btn secondary"
          onClick={handleScanProcedures}
          disabled={isScanning}
        >
          {isScanning ? '⚡ Escaneando...' : '🚀 Escaneo Optimizado'} {queue?.total_procedimientos > 0 && `(${queue.total_procedimientos})`}
        </button>
        
        <button 
          className="action-btn tertiary"
          onClick={() => navigate('/admin/monitor')}
        >
          📊 Ver Monitor
        </button>
        
        <button 
          className="action-btn test"
          onClick={handleTestPipeline}
        >
          🧪 Test Pipeline
        </button>
      </div>

      {/* Status Cards */}
      <div className="status-grid">
        {/* Workflow Status */}
        <div className="status-card workflow-status">
          <div className="card-header">
            <h3>Estado del Workflow</h3>
            <div 
              className="status-indicator large"
              style={{ backgroundColor: workflowInfo.color }}
            ></div>
          </div>
          <div className="card-content">
            <p className="status-text">{workflowInfo.text}</p>
            {status?.active_batch_id && (
              <p className="batch-info">
                Lote activo: <code>{status.active_batch_id}</code>
              </p>
            )}
            {status?.workflow_stats?.total_tasks > 0 && (
              <div className="workflow-progress">
                <p>Tareas en progreso: {status.workflow_stats.total_tasks}</p>
                {Object.entries(status.workflow_stats.tasks_by_state || {}).map(([state, count]) => (
                  <span key={state} className="task-state">
                    {state}: {count}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Queue Status */}
        <div className="status-card queue-status">
          <div className="card-header">
            <h3>Cola de Procedimientos</h3>
            <span className="count-badge">{queue?.total_pending || 0}</span>
          </div>
          <div className="card-content">
            {queueLoading ? (
              <p>Cargando cola...</p>
            ) : queue?.total_pending > 0 ? (
              <>
                <p>{queue.total_pending} procedimientos pendientes</p>
                <div className="queue-summary">
                  {Object.entries(queue.status_summary || {}).map(([status, count]) => (
                    <span key={status} className="status-count">
                      {status}: {count}
                    </span>
                  ))}
                </div>
                <button 
                  className="view-queue-btn"
                  onClick={() => navigate('/admin/queue')}
                >
                  Ver Cola Completa →
                </button>
              </>
            ) : (
              <p>No hay procedimientos en cola</p>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="status-card system-health">
          <div className="card-header">
            <h3>Salud del Sistema</h3>
            <span className="health-indicator">
              {status?.environment?.openai_api_key_set && status?.procedures_dir_exists ? '✅' : '⚠️'}
            </span>
          </div>
          <div className="card-content">
            <div className="health-checks">
              <div className="health-item">
                <span>OpenAI API:</span>
                <span className={status?.environment?.openai_api_key_set ? 'status-ok' : 'status-error'}>
                  {status?.environment?.openai_api_key_set ? '✅ Configurado' : '❌ No configurado'}
                </span>
              </div>
              <div className="health-item">
                <span>Directorio Procedimientos:</span>
                <span className={status?.procedures_dir_exists ? 'status-ok' : 'status-error'}>
                  {status?.procedures_dir_exists ? '✅ Existe' : '❌ No encontrado'}
                </span>
              </div>
              <div className="health-item">
                <span>Archivo Excel:</span>
                <span className={status?.excel_file_exists ? 'status-ok' : 'status-warning'}>
                  {status?.excel_file_exists ? '✅ Existe' : '⚠️ Se creará'}
                </span>
              </div>
              <div className="health-item">
                <span>Modo:</span>
                <span className={status?.environment?.debug_mode ? 'status-warning' : 'status-ok'}>
                  {status?.environment?.debug_mode ? '🧪 DEBUG' : '🚀 PRODUCCIÓN'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="status-card quick-stats">
          <div className="card-header">
            <h3>Estadísticas Rápidas</h3>
            <button onClick={loadQuickStats} className="refresh-btn">🔄</button>
          </div>
          <div className="card-content">
            {statsLoading ? (
              <p>Cargando estadísticas...</p>
            ) : stats ? (
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{stats.total_procedures_scanned}</div>
                  <div className="stat-label">Procedimientos Escaneados</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.total_questions_generated}</div>
                  <div className="stat-label">Preguntas Generadas</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.success_rate_percentage}%</div>
                  <div className="stat-label">Tasa de Éxito</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.procedures_completed}</div>
                  <div className="stat-label">Completados</div>
                </div>
              </div>
            ) : (
              <p>No hay estadísticas disponibles</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {status?.last_scan && (
        <div className="recent-activity">
          <h3>Actividad Reciente</h3>
          <div className="activity-item">
            <span className="activity-icon">🔍</span>
            <span>Último escaneo: {new Date(status.last_scan.timestamp).toLocaleString()}</span>
            <span className="activity-detail">
              {status.last_scan.archivos_escaneados} archivos procesados
            </span>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-dashboard {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
          color: #6b7280;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Notifications */
        .notifications {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .notification {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-width: 300px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .notification-success { border-left: 4px solid #10b981; }
        .notification-error { border-left: 4px solid #ef4444; }
        .notification-warning { border-left: 4px solid #f59e0b; }
        .notification-info { border-left: 4px solid #3b82f6; }

        .notification button {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #9ca3af;
          margin-left: 1rem;
        }

        /* Header */
        .dashboard-header {
          margin-bottom: 2rem;
          text-align: center;
        }

        .dashboard-header h2 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
          font-size: 2rem;
          font-weight: 700;
        }

        .dashboard-header p {
          color: #6b7280;
          font-size: 1.1rem;
          margin: 0;
        }

        /* Quick Actions */
        .quick-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9rem;
          min-width: 180px;
        }

        .action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .action-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .action-btn.secondary {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }

        .action-btn.tertiary {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
        }

        .action-btn.test {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          color: #1f2937;
        }

        /* Status Grid */
        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .status-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          border: 1px solid #e5e7eb;
          transition: all 0.2s;
        }

        .status-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .card-header h3 {
          margin: 0;
          color: #1f2937;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .status-indicator.large {
          width: 16px;
          height: 16px;
        }

        .count-badge {
          background: #667eea;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .health-indicator {
          font-size: 1.2rem;
        }

        .refresh-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          padding: 0.25rem;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .refresh-btn:hover {
          background: #f3f4f6;
        }

        /* Card Content */
        .card-content {
          color: #4b5563;
        }

        .status-text {
          font-size: 1.1rem;
          font-weight: 500;
          margin: 0 0 0.5rem 0;
          color: #1f2937;
        }

        .batch-info {
          font-size: 0.9rem;
          margin: 0;
        }

        .batch-info code {
          background: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.8rem;
        }

        .workflow-progress {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #f3f4f6;
        }

        .task-state, .status-count {
          display: inline-block;
          background: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          margin: 0.25rem 0.25rem 0 0;
        }

        .queue-summary {
          margin: 1rem 0;
        }

        .view-queue-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: background 0.2s;
        }

        .view-queue-btn:hover {
          background: #5a67d8;
        }

        /* Health Checks */
        .health-checks {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .health-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
        }

        .status-ok { color: #059669; }
        .status-error { color: #dc2626; }
        .status-warning { color: #d97706; }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #6b7280;
        }

        /* Recent Activity */
        .recent-activity {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          border: 1px solid #e5e7eb;
        }

        .recent-activity h3 {
          margin: 0 0 1rem 0;
          color: #1f2937;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 8px;
        }

        .activity-icon {
          font-size: 1.2rem;
        }

        .activity-detail {
          margin-left: auto;
          font-size: 0.85rem;
          color: #6b7280;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .admin-dashboard {
            padding: 1rem;
          }

          .quick-actions {
            flex-direction: column;
            align-items: center;
          }

          .action-btn {
            width: 100%;
            max-width: 300px;
          }

          .status-grid {
            grid-template-columns: 1fr;
          }

          .notifications {
            right: 10px;
            left: 10px;
          }

          .notification {
            min-width: auto;
          }
        }
      `}</style>
    </div>
  )
}

export default AdminDashboard