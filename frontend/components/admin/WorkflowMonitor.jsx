import React, { useState, useEffect } from 'react'
import { useAdminStatus, useWorkflowProgress } from '../../hooks/useAdminStatus'
import adminApi from '../../src/services/adminApi.js'

const WorkflowMonitor = () => {
  const { status, loading: statusLoading } = useAdminStatus(true, 5000) // Update every 5 seconds
  const [selectedBatchId, setSelectedBatchId] = useState(null)
  const { progress, loading: progressLoading } = useWorkflowProgress(selectedBatchId, !!selectedBatchId)
  
  const [workflowLogs, setWorkflowLogs] = useState([])
  const [autoScroll, setAutoScroll] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  // Update selected batch ID when status changes
  useEffect(() => {
    if (status?.active_batch_id && status.active_batch_id !== selectedBatchId) {
      setSelectedBatchId(status.active_batch_id)
    }
  }, [status?.active_batch_id, selectedBatchId])

  // Simulate workflow logs (in a real implementation, these would come from the backend)
  useEffect(() => {
    if (status?.workflow_state && status.workflow_state !== 'idle') {
      const newLog = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        message: `Workflow estado: ${getWorkflowStateText(status.workflow_state)}`,
        batchId: status.active_batch_id
      }
      
      setWorkflowLogs(prev => {
        const updated = [newLog, ...prev.slice(0, 49)] // Keep last 50 logs
        return updated
      })
    }
  }, [status?.workflow_state, status?.active_batch_id])

  const getWorkflowStateText = (state) => {
    const states = {
      'idle': 'Sistema inactivo',
      'scanning': 'Escaneando procedimientos',
      'generating': 'Generando preguntas',
      'validating': 'Validando preguntas',
      'correcting': 'Corrigiendo preguntas',
      'syncing': 'Sincronizando con Excel',
      'completed': 'Procesamiento completado',
      'failed': 'Error en procesamiento',
      'cancelled': 'Procesamiento cancelado'
    }
    return states[state] || state
  }

  const getWorkflowStateColor = (state) => {
    const colors = {
      'idle': '#6b7280',
      'scanning': '#f59e0b',
      'generating': '#3b82f6', 
      'validating': '#8b5cf6',
      'correcting': '#ec4899',
      'syncing': '#10b981',
      'completed': '#059669',
      'failed': '#ef4444',
      'cancelled': '#6b7280'
    }
    return colors[state] || '#6b7280'
  }

  const handleCancelWorkflow = async () => {
    const confirmed = window.confirm('¿Estás seguro de cancelar el workflow actual?')
    if (!confirmed) return

    try {
      await adminApi.cancelWorkflow()
      const cancelLog = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        level: 'warning',
        message: 'Workflow cancelado por el usuario',
        batchId: selectedBatchId
      }
      setWorkflowLogs(prev => [cancelLog, ...prev])
    } catch (error) {
      const errorLog = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        level: 'error',
        message: `Error cancelando workflow: ${error.message}`,
        batchId: selectedBatchId
      }
      setWorkflowLogs(prev => [errorLog, ...prev])
    }
  }

  const clearLogs = () => {
    setWorkflowLogs([])
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '0s'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  const getLogLevelIcon = (level) => {
    const icons = {
      'info': 'ℹ️',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌'
    }
    return icons[level] || 'ℹ️'
  }

  const getLogLevelColor = (level) => {
    const colors = {
      'info': '#3b82f6',
      'success': '#10b981',
      'warning': '#f59e0b',
      'error': '#ef4444'
    }
    return colors[level] || '#6b7280'
  }

  if (statusLoading) {
    return (
      <div className="monitor-loading">
        <div className="loading-spinner"></div>
        <p>Cargando monitor de workflow...</p>
      </div>
    )
  }

  const isWorkflowActive = status?.workflow_state && status.workflow_state !== 'idle'

  return (
    <div className="workflow-monitor">
      {/* Header */}
      <div className="monitor-header">
        <div className="header-left">
          <h2>Monitor de Workflow</h2>
          <p>Seguimiento en tiempo real del procesamiento</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => setAutoScroll(!autoScroll)}
            className={`toggle-btn ${autoScroll ? 'active' : ''}`}
          >
            📜 Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
          </button>
          <button onClick={clearLogs} className="clear-btn">
            🗑️ Limpiar Logs
          </button>
          {isWorkflowActive && (
            <button onClick={handleCancelWorkflow} className="cancel-btn">
              ⏹️ Cancelar Workflow
            </button>
          )}
        </div>
      </div>

      {/* Status Overview */}
      <div className="status-overview">
        <div className="status-card main-status">
          <div className="status-header">
            <h3>Estado del Sistema</h3>
            <div 
              className="status-indicator large"
              style={{ backgroundColor: getWorkflowStateColor(status?.workflow_state) }}
            ></div>
          </div>
          <div className="status-content">
            <div className="status-text">
              {getWorkflowStateText(status?.workflow_state || 'idle')}
            </div>
            {status?.active_batch_id && (
              <div className="batch-info">
                <strong>Lote Activo:</strong> 
                <code>{status.active_batch_id}</code>
              </div>
            )}
          </div>
        </div>

        {progress && (
          <div className="status-card progress-card">
            <div className="status-header">
              <h3>Progreso Detallado</h3>
              <span className="progress-percentage">
                {progress.progress_percentage?.toFixed(1)}%
              </span>
            </div>
            <div className="progress-content">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress.progress_percentage || 0}%` }}
                ></div>
              </div>
              <div className="progress-details">
                <div className="progress-step">
                  <strong>Paso Actual:</strong> {progress.current_step}
                </div>
                <div className="progress-status">
                  <strong>Estado:</strong> {progress.current_status}
                </div>
                {progress.estimated_time_remaining && (
                  <div className="progress-eta">
                    <strong>Tiempo Estimado:</strong> {progress.estimated_time_remaining}
                  </div>
                )}
                <div className="progress-stats">
                  {progress.completed_steps}/{progress.total_steps} pasos completados
                </div>
              </div>
            </div>
          </div>
        )}

        {status?.workflow_stats && Object.keys(status.workflow_stats.tasks_by_state || {}).length > 0 && (
          <div className="status-card tasks-card">
            <div className="status-header">
              <h3>Tareas por Estado</h3>
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="details-toggle"
              >
                {showDetails ? '▼' : '▶'} Detalles
              </button>
            </div>
            <div className="tasks-content">
              <div className="tasks-summary">
                <div className="task-count">
                  <span className="count">{status.workflow_stats.total_tasks}</span>
                  <span className="label">Total</span>
                </div>
                {Object.entries(status.workflow_stats.tasks_by_state).map(([state, count]) => (
                  <div key={state} className="task-count">
                    <span className="count">{count}</span>
                    <span className="label">{state}</span>
                  </div>
                ))}
              </div>
              {showDetails && status.workflow_stats.average_processing_time && (
                <div className="tasks-details">
                  <div className="detail-item">
                    <strong>Tiempo Promedio:</strong> {status.workflow_stats.average_processing_time}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Activity Logs */}
      <div className="activity-logs">
        <div className="logs-header">
          <h3>Registro de Actividad</h3>
          <div className="logs-info">
            {workflowLogs.length} entradas
            {autoScroll && <span className="auto-scroll-indicator">📜</span>}
          </div>
        </div>

        {workflowLogs.length === 0 ? (
          <div className="logs-empty">
            <div className="empty-icon">📝</div>
            <p>No hay actividad registrada</p>
            <small>Los logs aparecerán aquí cuando inicie un workflow</small>
          </div>
        ) : (
          <div className="logs-container">
            {workflowLogs.map((log) => (
              <div 
                key={log.id} 
                className={`log-entry log-${log.level}`}
                style={{ borderLeftColor: getLogLevelColor(log.level) }}
              >
                <div className="log-header">
                  <span className="log-icon">{getLogLevelIcon(log.level)}</span>
                  <span className="log-timestamp">{log.timestamp}</span>
                  {log.batchId && (
                    <span className="log-batch">
                      Lote: <code>{log.batchId}</code>
                    </span>
                  )}
                </div>
                <div className="log-message">
                  {log.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isWorkflowActive && (
        <div className="idle-state">
          <div className="idle-icon">💤</div>
          <h3>Sistema Inactivo</h3>
          <p>No hay workflow en ejecución actualmente</p>
          <p>Dirígete a la <a href="/admin/queue">Cola de Procedimientos</a> para iniciar uno nuevo</p>
        </div>
      )}

      <style jsx>{`
        .workflow-monitor {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .monitor-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #6b7280;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        /* Header */
        .monitor-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .monitor-header h2 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
          font-size: 1.75rem;
          font-weight: 700;
        }

        .monitor-header p {
          margin: 0;
          color: #6b7280;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .toggle-btn, .clear-btn, .cancel-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
        }

        .toggle-btn {
          background: #f3f4f6;
          color: #374151;
        }

        .toggle-btn.active {
          background: #667eea;
          color: white;
        }

        .clear-btn {
          background: #f59e0b;
          color: white;
        }

        .cancel-btn {
          background: #ef4444;
          color: white;
        }

        .toggle-btn:hover, .clear-btn:hover, .cancel-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        /* Status Overview */
        .status-overview {
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
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .status-header h3 {
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

        .progress-percentage {
          font-size: 1.2rem;
          font-weight: 700;
          color: #667eea;
        }

        .details-toggle {
          background: none;
          border: none;
          cursor: pointer;
          color: #667eea;
          font-size: 0.9rem;
        }

        /* Status Content */
        .status-text {
          font-size: 1.1rem;
          font-weight: 500;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .batch-info {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .batch-info code {
          background: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: monospace;
          margin-left: 0.5rem;
        }

        /* Progress */
        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 0.3s ease;
        }

        .progress-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #4b5563;
        }

        .progress-stats {
          font-size: 0.8rem;
          color: #6b7280;
          font-style: italic;
        }

        /* Tasks */
        .tasks-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .task-count {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 60px;
        }

        .task-count .count {
          font-size: 1.25rem;
          font-weight: 700;
          color: #667eea;
        }

        .task-count .label {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .tasks-details {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #f3f4f6;
        }

        .detail-item {
          font-size: 0.9rem;
          color: #4b5563;
        }

        /* Activity Logs */
        .activity-logs {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .logs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
        }

        .logs-header h3 {
          margin: 0;
          color: #1f2937;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .logs-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #6b7280;
        }

        .auto-scroll-indicator {
          animation: bounce 2s infinite;
        }

        .logs-empty {
          padding: 3rem;
          text-align: center;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .logs-container {
          max-height: 400px;
          overflow-y: auto;
          padding: 1rem;
        }

        .log-entry {
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          background: #f8fafc;
          border-radius: 6px;
          border-left: 3px solid;
        }

        .log-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.25rem;
          font-size: 0.8rem;
        }

        .log-timestamp {
          color: #6b7280;
          font-family: monospace;
        }

        .log-batch {
          color: #4b5563;
        }

        .log-batch code {
          background: #e5e7eb;
          padding: 0.125rem 0.25rem;
          border-radius: 3px;
          font-size: 0.7rem;
        }

        .log-message {
          font-size: 0.9rem;
          color: #1f2937;
          line-height: 1.4;
        }

        /* Idle State */
        .idle-state {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
          background: white;
          border-radius: 12px;
          margin-top: 2rem;
        }

        .idle-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .idle-state h3 {
          margin: 0 0 0.5rem 0;
          color: #374151;
        }

        .idle-state a {
          color: #667eea;
          text-decoration: none;
        }

        .idle-state a:hover {
          text-decoration: underline;
        }

        /* Animations */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
          40%, 43% { transform: translateY(-10px); }
          70% { transform: translateY(-5px); }
          90% { transform: translateY(-2px); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .workflow-monitor {
            padding: 1rem;
          }

          .monitor-header {
            flex-direction: column;
            gap: 1rem;
          }

          .header-actions {
            justify-content: center;
            flex-wrap: wrap;
          }

          .status-overview {
            grid-template-columns: 1fr;
          }

          .tasks-summary {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}

export default WorkflowMonitor