import React, { useState, useEffect } from 'react'
import { useConfig } from '../../hooks/useAdminStatus'
import adminApi from '../../src/services/adminApi.js'

const ConfigPanel = () => {
  const { config, loading, error, refresh, toggleDebugMode } = useConfig()
  const [localSettings, setLocalSettings] = useState({})
  const [notifications, setNotifications] = useState([])
  const [saving, setSaving] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    debug: true,
    generation: false,
    validators: false,
    environment: false
  })

  useEffect(() => {
    if (config) {
      setLocalSettings({
        debugMode: config.debug?.enabled || false,
        mockCalls: config.debug?.mock_openai_calls || false,
        verboseLogging: config.debug?.verbose_logging || false
      })
    }
  }, [config])

  const addNotification = (message, type = 'info') => {
    const notification = { id: Date.now(), message, type }
    setNotifications(prev => [notification, ...prev.slice(0, 2)])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 4000)
  }

  const handleDebugToggle = async () => {
    try {
      setSaving(true)
      const newDebugState = !localSettings.debugMode
      await toggleDebugMode(newDebugState)
      setLocalSettings(prev => ({ ...prev, debugMode: newDebugState }))
      addNotification(
        `✅ Modo debug ${newDebugState ? 'habilitado' : 'deshabilitado'}`, 
        'success'
      )
    } catch (error) {
      addNotification(`❌ Error cambiando modo debug: ${error.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleTestPipeline = async () => {
    try {
      setSaving(true)
      await adminApi.testFullPipeline()
      addNotification('🧪 Test del pipeline completado exitosamente', 'success')
    } catch (error) {
      addNotification(`❌ Error en test: ${error.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleHealthCheck = async () => {
    try {
      setSaving(true)
      const health = await adminApi.healthCheck()
      const status = health.data.overall_health
      addNotification(
        `${status === 'healthy' ? '✅' : '⚠️'} Health check: ${status}`, 
        status === 'healthy' ? 'success' : 'warning'
      )
    } catch (error) {
      addNotification(`❌ Error en health check: ${error.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getValidatorStatusIcon = (validatorName) => {
    if (!config?.validators?.enabled_validators) return '❓'
    return config.validators.enabled_validators.includes(validatorName) ? '✅' : '❌'
  }

  const formatValidatorName = (name) => {
    const names = {
      estructura: 'Estructura',
      tecnico: 'Técnico',
      dificultad: 'Dificultad',
      claridad: 'Claridad'
    }
    return names[name] || name
  }

  if (loading) {
    return (
      <div className="config-loading">
        <div className="loading-spinner"></div>
        <p>Cargando configuración...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="config-error">
        <h3>❌ Error cargando configuración</h3>
        <p>{error}</p>
        <button onClick={refresh} className="retry-btn">
          🔄 Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="config-panel">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notifications">
          {notifications.map(notification => (
            <div key={notification.id} className={`notification notification-${notification.type}`}>
              {notification.message}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="config-header">
        <div className="header-left">
          <h2>Configuración del Sistema</h2>
          <p>Gestionar configuración y parámetros del módulo administrativo</p>
        </div>
        <div className="header-actions">
          <button onClick={refresh} disabled={loading} className="refresh-btn">
            🔄 Actualizar
          </button>
          <button onClick={handleHealthCheck} disabled={saving} className="health-btn">
            {saving ? '⏳' : '🏥'} Health Check
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <div className="action-card primary">
          <div className="action-header">
            <h3>🧪 Modo Debug</h3>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="debug-toggle"
                checked={localSettings.debugMode}
                onChange={handleDebugToggle}
                disabled={saving}
              />
              <label htmlFor="debug-toggle"></label>
            </div>
          </div>
          <p>
            {localSettings.debugMode 
              ? 'Modo debug activo - Usando respuestas mock para testing'
              : 'Modo producción - Usando API real de OpenAI'
            }
          </p>
        </div>

        <div className="action-card secondary">
          <div className="action-header">
            <h3>🧪 Test Pipeline</h3>
            <button 
              onClick={handleTestPipeline}
              disabled={saving}
              className="test-btn"
            >
              {saving ? '⏳' : '▶️'} Ejecutar Test
            </button>
          </div>
          <p>Probar todo el pipeline con un procedimiento de ejemplo</p>
        </div>
      </div>

      {/* Configuration Sections */}
      <div className="config-sections">
        
        {/* Debug Configuration */}
        <div className="config-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('debug')}
          >
            <h3>🐛 Configuración Debug</h3>
            <span className={`expand-icon ${expandedSections.debug ? 'expanded' : ''}`}>
              ▶
            </span>
          </div>
          {expandedSections.debug && (
            <div className="section-content">
              <div className="config-grid">
                <div className="config-item">
                  <label>Debug Habilitado</label>
                  <span className={`status-badge ${config?.debug?.enabled ? 'active' : 'inactive'}`}>
                    {config?.debug?.enabled ? '✅ Sí' : '❌ No'}
                  </span>
                </div>
                <div className="config-item">
                  <label>Mock API Calls</label>
                  <span className={`status-badge ${config?.debug?.mock_openai_calls ? 'active' : 'inactive'}`}>
                    {config?.debug?.mock_openai_calls ? '✅ Sí' : '❌ No'}
                  </span>
                </div>
                <div className="config-item">
                  <label>Logging Verbose</label>
                  <span className={`status-badge ${config?.debug?.verbose_logging ? 'active' : 'inactive'}`}>
                    {config?.debug?.verbose_logging ? '✅ Sí' : '❌ No'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Generation Configuration */}
        <div className="config-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('generation')}
          >
            <h3>🤖 Configuración de Generación</h3>
            <span className={`expand-icon ${expandedSections.generation ? 'expanded' : ''}`}>
              ▶
            </span>
          </div>
          {expandedSections.generation && (
            <div className="section-content">
              <div className="config-grid">
                <div className="config-item">
                  <label>Modelo OpenAI</label>
                  <span className="config-value">{config?.generation?.openai_model || 'N/A'}</span>
                </div>
                <div className="config-item">
                  <label>Temperatura</label>
                  <span className="config-value">{config?.generation?.temperature || 'N/A'}</span>
                </div>
                <div className="config-item">
                  <label>Max Tokens</label>
                  <span className="config-value">{config?.generation?.max_tokens || 'N/A'}</span>
                </div>
                <div className="config-item">
                  <label>Timeout (segundos)</label>
                  <span className="config-value">{config?.generation?.timeout_seconds || 'N/A'}</span>
                </div>
                <div className="config-item">
                  <label>Max Reintentos</label>
                  <span className="config-value">{config?.generation?.max_retries || 'N/A'}</span>
                </div>
                <div className="config-item">
                  <label>Rate Limiting</label>
                  <span className={`status-badge ${config?.generation?.rate_limit_enabled ? 'active' : 'inactive'}`}>
                    {config?.generation?.rate_limit_enabled ? '✅ Habilitado' : '❌ Deshabilitado'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Validators Configuration */}
        <div className="config-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('validators')}
          >
            <h3>🔍 Configuración de Validadores</h3>
            <span className={`expand-icon ${expandedSections.validators ? 'expanded' : ''}`}>
              ▶
            </span>
          </div>
          {expandedSections.validators && (
            <div className="section-content">
              <div className="validators-info">
                <div className="threshold-info">
                  <label>Umbral de Validación</label>
                  <span className="threshold-value">
                    {config?.validators?.validation_threshold || 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="validators-grid">
                {config?.validators?.enabled_validators?.map(validatorName => (
                  <div key={validatorName} className="validator-card">
                    <div className="validator-header">
                      <span className="validator-icon">
                        {getValidatorStatusIcon(validatorName)}
                      </span>
                      <h4>{formatValidatorName(validatorName)}</h4>
                    </div>
                    <div className="validator-details">
                      {config?.validators?.validators_config?.[validatorName] && (
                        <>
                          <div className="validator-detail">
                            <span>Peso:</span>
                            <span>{config.validators.validators_config[validatorName].weight}</span>
                          </div>
                          <div className="validator-detail">
                            <span>Crítico:</span>
                            <span className={config.validators.validators_config[validatorName].critical ? 'critical' : 'non-critical'}>
                              {config.validators.validators_config[validatorName].critical ? '🔴 Sí' : '🟡 No'}
                            </span>
                          </div>
                          <div className="validator-detail">
                            <span>Timeout:</span>
                            <span>{config.validators.validators_config[validatorName].timeout}s</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Environment Configuration */}
        <div className="config-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('environment')}
          >
            <h3>🌍 Variables de Entorno</h3>
            <span className={`expand-icon ${expandedSections.environment ? 'expanded' : ''}`}>
              ▶
            </span>
          </div>
          {expandedSections.environment && (
            <div className="section-content">
              <div className="config-grid">
                <div className="config-item">
                  <label>OpenAI API Key</label>
                  <span className={`status-badge ${config?.environment?.openai_api_key_set ? 'active' : 'inactive'}`}>
                    {config?.environment?.openai_api_key_set ? '✅ Configurado' : '❌ No configurado'}
                  </span>
                </div>
                <div className="config-item">
                  <label>Directorio de Procedimientos</label>
                  <span className="config-value">{config?.procedures_source_dir || 'N/A'}</span>
                </div>
                <div className="config-item">
                  <label>Batch Size</label>
                  <span className="config-value">{config?.environment?.generation_batch_size || 'N/A'}</span>
                </div>
                <div className="config-item">
                  <label>Max Retries (Global)</label>
                  <span className="config-value">{config?.environment?.max_retries || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .config-panel {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .config-loading, .config-error {
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

        .retry-btn {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
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
          padding: 0.75rem 1rem;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          animation: slideIn 0.3s ease-out;
          max-width: 350px;
        }

        .notification-success { border-left: 4px solid #10b981; }
        .notification-error { border-left: 4px solid #ef4444; }
        .notification-warning { border-left: 4px solid #f59e0b; }

        /* Header */
        .config-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .config-header h2 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
          font-size: 1.75rem;
          font-weight: 700;
        }

        .config-header p {
          margin: 0;
          color: #6b7280;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .refresh-btn, .health-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .refresh-btn {
          background: #f3f4f6;
          color: #374151;
        }

        .health-btn {
          background: #10b981;
          color: white;
        }

        .refresh-btn:hover, .health-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        /* Quick Actions */
        .quick-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .action-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          border: 1px solid #e5e7eb;
        }

        .action-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .action-header h3 {
          margin: 0;
          color: #1f2937;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .action-card p {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        /* Toggle Switch */
        .toggle-switch {
          position: relative;
        }

        .toggle-switch input[type="checkbox"] {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-switch label {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 28px;
          background-color: #ccc;
          border-radius: 14px;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .toggle-switch label:before {
          content: "";
          position: absolute;
          top: 2px;
          left: 2px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: white;
          transition: transform 0.3s;
        }

        .toggle-switch input:checked + label {
          background-color: #667eea;
        }

        .toggle-switch input:checked + label:before {
          transform: translateX(22px);
        }

        .test-btn {
          padding: 0.5rem 1rem;
          background: #f59e0b;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
        }

        .test-btn:hover {
          background: #d97706;
        }

        /* Config Sections */
        .config-sections {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .config-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .section-header {
          padding: 1rem 1.5rem;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: background 0.2s;
        }

        .section-header:hover {
          background: #f1f5f9;
        }

        .section-header h3 {
          margin: 0;
          color: #1f2937;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .expand-icon {
          transition: transform 0.3s;
          color: #6b7280;
        }

        .expand-icon.expanded {
          transform: rotate(90deg);
        }

        .section-content {
          padding: 1.5rem;
        }

        /* Config Grid */
        .config-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .config-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .config-item label {
          font-weight: 500;
          color: #374151;
        }

        .config-value {
          color: #6b7280;
          font-family: monospace;
          font-size: 0.85rem;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .status-badge.active {
          background: #d1fae5;
          color: #059669;
        }

        .status-badge.inactive {
          background: #fee2e2;
          color: #dc2626;
        }

        /* Validators */
        .validators-info {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 8px;
          display: flex;
          justify-content: center;
        }

        .threshold-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .threshold-info label {
          font-weight: 600;
          color: #374151;
          font-size: 0.9rem;
        }

        .threshold-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #667eea;
        }

        .validators-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .validator-card {
          background: #f8fafc;
          border-radius: 8px;
          padding: 1rem;
          border: 1px solid #e5e7eb;
        }

        .validator-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .validator-header h4 {
          margin: 0;
          color: #1f2937;
          font-size: 0.95rem;
          font-weight: 600;
        }

        .validator-icon {
          font-size: 1.1rem;
        }

        .validator-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .validator-detail {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #6b7280;
        }

        .validator-detail .critical {
          color: #dc2626;
        }

        .validator-detail .non-critical {
          color: #d97706;
        }

        /* Animations */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .config-panel {
            padding: 1rem;
          }

          .config-header {
            flex-direction: column;
            gap: 1rem;
          }

          .quick-actions {
            grid-template-columns: 1fr;
          }

          .config-grid {
            grid-template-columns: 1fr;
          }

          .validators-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default ConfigPanel