import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAdminStatus } from '../../hooks/useAdminStatus'

const AdminLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { status, loading, error } = useAdminStatus(true, 10000)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const getStatusColor = (workflowState) => {
    switch (workflowState) {
      case 'idle': return '#10b981'
      case 'scanning': case 'generating': case 'validating': case 'correcting': return '#f59e0b'
      case 'completed': return '#059669'
      case 'failed': return '#ef4444'
      case 'cancelled': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getStatusText = (workflowState) => {
    switch (workflowState) {
      case 'idle': return 'Inactivo'
      case 'scanning': return 'Escaneando'
      case 'generating': return 'Generando'
      case 'validating': return 'Validando'
      case 'correcting': return 'Corrigiendo'
      case 'syncing': return 'Sincronizando'
      case 'completed': return 'Completado'
      case 'failed': return 'Error'
      case 'cancelled': return 'Cancelado'
      default: return 'Desconocido'
    }
  }

  const navigationItems = [
    {
      path: '/admin',
      label: 'Dashboard',
      icon: '📊',
      description: 'Vista general del sistema'
    },
    {
      path: '/admin/queue',
      label: 'Cola de Procedimientos',
      icon: '📋',
      description: 'Gestionar procedimientos pendientes'
    },
    {
      path: '/admin/monitor',
      label: 'Monitor en Tiempo Real',
      icon: '🔄',
      description: 'Seguimiento del workflow activo'
    },
    {
      path: '/admin/config',
      label: 'Configuración',
      icon: '⚙️',
      description: 'Configurar el sistema'
    }
  ]

  const isActivePath = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="admin-layout">
      {/* Header */}
      <header className="admin-header">
        <div className="header-left">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '▶️' : '◀️'}
          </button>
          <h1>InemecTest: DICACOCU 360° - Administración</h1>
        </div>
        
        <div className="header-center">
          {status && (
            <div className="workflow-status">
              <span 
                className="status-indicator"
                style={{ backgroundColor: getStatusColor(status.workflow_state) }}
              ></span>
              <span className="status-text">
                {getStatusText(status.workflow_state)}
              </span>
              {status.active_batch_id && (
                <span className="batch-id">
                  ID: {status.active_batch_id}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="header-right">
          <div className="system-info">
            {loading && <span className="loading-indicator">⏳</span>}
            {error && <span className="error-indicator" title={error}>❌</span>}
            {status && (
              <>
                <span className="info-item">
                  📁 {status.generated_questions_count} preguntas
                </span>
                <span className="info-item">
                  🔧 {status.environment.debug_mode ? 'DEBUG' : 'PROD'}
                </span>
              </>
            )}
          </div>
          <button 
            className="home-button"
            onClick={() => navigate('/')}
            title="Volver al Portal de Evaluación"
          >
            🏠 Portal Principal
          </button>
        </div>
      </header>

      <div className="admin-content">
        {/* Sidebar */}
        <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <nav className="sidebar-nav">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActivePath(item.path) ? 'active' : ''}`}
                title={item.description}
              >
                <span className="nav-icon">{item.icon}</span>
                {!sidebarCollapsed && (
                  <span className="nav-label">{item.label}</span>
                )}
              </Link>
            ))}
          </nav>

          {!sidebarCollapsed && status && (
            <div className="sidebar-footer">
              <div className="system-summary">
                <h4>Estado del Sistema</h4>
                <div className="summary-item">
                  <span>OpenAI:</span>
                  <span className={status.environment.openai_api_key_set ? 'status-ok' : 'status-error'}>
                    {status.environment.openai_api_key_set ? '✅' : '❌'}
                  </span>
                </div>
                <div className="summary-item">
                  <span>Procedimientos:</span>
                  <span>{status.procedures_dir_exists ? '✅' : '❌'}</span>
                </div>
                <div className="summary-item">
                  <span>Excel:</span>
                  <span>{status.excel_file_exists ? '✅' : '❌'}</span>
                </div>
                {status.last_scan && (
                  <div className="last-scan">
                    <small>
                      Último escaneo: {new Date(status.last_scan.timestamp).toLocaleTimeString()}
                    </small>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="admin-main">
          {error && (
            <div className="error-banner">
              <span>⚠️ Error de conexión: {error}</span>
              <button onClick={() => window.location.reload()}>
                🔄 Recargar
              </button>
            </div>
          )}
          
          <Outlet />
        </main>
      </div>

      <style jsx>{`
        .admin-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f8fafc;
        }

        /* Header */
        .admin-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .sidebar-toggle {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .sidebar-toggle:hover {
          background: rgba(255,255,255,0.3);
        }

        .admin-header h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .header-center {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .workflow-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255,255,255,0.1);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .status-text {
          font-weight: 500;
          font-size: 0.9rem;
        }

        .batch-id {
          font-size: 0.8rem;
          opacity: 0.8;
          font-family: monospace;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .system-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.85rem;
        }

        .info-item {
          background: rgba(255,255,255,0.1);
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          white-space: nowrap;
        }

        .loading-indicator {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .error-indicator {
          animation: blink 1s ease-in-out infinite alternate;
        }

        @keyframes blink {
          from { opacity: 1; }
          to { opacity: 0.5; }
        }

        .home-button {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.85rem;
        }

        .home-button:hover {
          background: rgba(255,255,255,0.3);
          transform: translateY(-1px);
        }

        /* Content Area */
        .admin-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        /* Sidebar */
        .admin-sidebar {
          width: 280px;
          background: white;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease;
          box-shadow: 2px 0 4px rgba(0,0,0,0.05);
        }

        .admin-sidebar.collapsed {
          width: 70px;
        }

        .sidebar-nav {
          padding: 1rem 0;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          color: #4a5568;
          text-decoration: none;
          transition: all 0.2s;
          border-left: 3px solid transparent;
          gap: 0.75rem;
        }

        .nav-item:hover {
          background: #f7fafc;
          color: #2d3748;
          border-left-color: #cbd5e0;
        }

        .nav-item.active {
          background: #edf2f7;
          color: #667eea;
          border-left-color: #667eea;
          font-weight: 500;
        }

        .nav-icon {
          font-size: 1.25rem;
          min-width: 24px;
          text-align: center;
        }

        .nav-label {
          font-size: 0.9rem;
          white-space: nowrap;
        }

        /* Sidebar Footer */
        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .system-summary h4 {
          margin: 0 0 0.75rem 0;
          font-size: 0.85rem;
          color: #4a5568;
          font-weight: 600;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
          color: #718096;
        }

        .status-ok {
          color: #38a169;
        }

        .status-error {
          color: #e53e3e;
        }

        .last-scan {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid #e2e8f0;
        }

        .last-scan small {
          color: #a0aec0;
          font-size: 0.75rem;
        }

        /* Main Content */
        .admin-main {
          flex: 1;
          overflow-y: auto;
          background: #f8fafc;
        }

        .error-banner {
          background: #fed7d7;
          color: #c53030;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #feb2b2;
        }

        .error-banner button {
          background: #c53030;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .error-banner button:hover {
          background: #9b2c2c;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .admin-header {
            padding: 1rem;
            flex-wrap: wrap;
          }

          .header-center {
            order: 3;
            width: 100%;
            justify-content: flex-start;
            margin-top: 0.5rem;
          }

          .admin-sidebar {
            width: 70px;
          }

          .admin-sidebar.collapsed {
            width: 50px;
          }

          .nav-label,
          .sidebar-footer {
            display: none;
          }

          .system-info {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}

export default AdminLayout