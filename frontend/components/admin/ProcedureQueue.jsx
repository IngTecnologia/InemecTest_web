import React, { useState, useMemo } from 'react'
import { useQueue, useWorkflow } from '../../hooks/useAdminStatus'
import adminApi from '../../src/services/adminApi.js'

const ProcedureQueue = () => {
  const { queue, loading, error, refresh, scanProcedures, removeFromQueue } = useQueue()
  const { startWorkflow, loading: workflowLoading } = useWorkflow()
  
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('nombre')
  const [sortOrder, setSortOrder] = useState('asc')
  const [isScanning, setIsScanning] = useState(false)
  const [notifications, setNotifications] = useState([])

  // Filtrar y ordenar items
  const filteredAndSortedItems = useMemo(() => {
    if (!queue?.queue_items && !queue) return []

    let items = queue.queue_items

    // Filtrar por estado
    if (filterStatus !== 'all') {
      items = items.filter(item => item.estado === filterStatus)
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      items = items.filter(item => 
        item.codigo.toLowerCase().includes(term) ||
        item.nombre.toLowerCase().includes(term) ||
        item.archivo.toLowerCase().includes(term)
      )
    }

    // Ordenar
    items.sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
      }
    })

    return items
  }, [queue?.queue_items, filterStatus, searchTerm, sortBy, sortOrder])

  // Manejar selección
  const handleSelectItem = (codigo, checked) => {
    const newSelected = new Set(selectedItems)
    if (checked) {
      newSelected.add(codigo)
    } else {
      newSelected.delete(codigo)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      const allCodes = filteredAndSortedItems.map(item => item.codigo)
      setSelectedItems(new Set(allCodes))
    } else {
      setSelectedItems(new Set())
    }
  }

  // Acciones
  const handleScan = async () => {
    try {
      setIsScanning(true)
      await scanProcedures()
      addNotification('✅ Escaneo completado', 'success')
      setSelectedItems(new Set()) // Limpiar selección
    } catch (error) {
      addNotification(`❌ Error en escaneo: ${error.message}`, 'error')
    } finally {
      setIsScanning(false)
    }
  }

  const handleRemoveSelected = async () => {
    if (selectedItems.size === 0) return

    const confirmed = window.confirm(
      `¿Estás seguro de remover ${selectedItems.size} procedimiento(s) de la cola?`
    )
    
    if (!confirmed) return

    let successful = 0
    let failed = 0

    for (const codigo of selectedItems) {
      try {
        const item = filteredAndSortedItems.find(item => item.codigo === codigo)
        if (item) {
          await removeFromQueue(codigo, item.version, 'bulk_removal')
          successful++
        }
      } catch (error) {
        failed++
        console.error(`Error removing ${codigo}:`, error)
      }
    }

    addNotification(
      `✅ ${successful} removidos exitosamente${failed > 0 ? `, ${failed} fallaron` : ''}`, 
      failed > 0 ? 'warning' : 'success'
    )
    
    setSelectedItems(new Set())
  }

  const handleStartSelected = async () => {
    if (selectedItems.size === 0) return

    try {
      const selectedCodes = Array.from(selectedItems)
      await startWorkflow({ procedureCodes: selectedCodes })
      addNotification(`🚀 Workflow iniciado para ${selectedCodes.length} procedimientos`, 'success')
    } catch (error) {
      addNotification(`❌ Error iniciando workflow: ${error.message}`, 'error')
    }
  }

  const handleStartAll = async () => {
    try {
      await startWorkflow()
      addNotification('🚀 Workflow iniciado para todos los procedimientos', 'success')
    } catch (error) {
      addNotification(`❌ Error iniciando workflow: ${error.message}`, 'error')
    }
  }

  const addNotification = (message, type = 'info') => {
    const notification = { id: Date.now(), message, type }
    setNotifications(prev => [notification, ...prev.slice(0, 2)])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 4000)
  }

  const getStatusBadge = (estado) => {
    const statusConfig = {
      nuevo_procedimiento: { color: '#10b981', text: 'Nuevo' },
      nueva_version: { color: '#f59e0b', text: 'Nueva Versión' },
      ya_procesado: { color: '#6b7280', text: 'Procesado' }
    }
    
    const config = statusConfig[estado] || { color: '#6b7280', text: estado }
    
    return (
      <span 
        className="status-badge"
        style={{ backgroundColor: config.color }}
      >
        {config.text}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="queue-loading">
        <div className="loading-spinner"></div>
        <p>Cargando cola de procedimientos...</p>
      </div>
    )
  }

  return (
    <div className="procedure-queue">
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
      <div className="queue-header">
        <div className="header-left">
          <h2>Cola de Procedimientos</h2>
          <p>Gestionar procedimientos pendientes de generación</p>
        </div>
        <div className="header-actions">
          <button 
            className="scan-btn"
            onClick={handleScan}
            disabled={isScanning}
          >
            {isScanning ? '⏳ Escaneando...' : '🔍 Escanear'}
          </button>
          <button onClick={refresh} disabled={loading}>
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Summary */}
      {queue && (
        <div className="queue-summary">
          <div className="summary-card">
            <div className="summary-number">{queue.total_pending}</div>
            <div className="summary-label">Total en Cola</div>
          </div>
          <div className="summary-card">
            <div className="summary-number">{selectedItems.size}</div>
            <div className="summary-label">Seleccionados</div>
          </div>
          {Object.entries(queue.status_summary || {}).map(([status, count]) => (
            <div key={status} className="summary-card">
              <div className="summary-number">{count}</div>
              <div className="summary-label">{status.replace('_', ' ')}</div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="queue-controls">
        <div className="controls-left">
          <input
            type="text"
            placeholder="Buscar por código, nombre o archivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos los estados</option>
            <option value="nuevo_procedimiento">Nuevos</option>
            <option value="nueva_version">Nueva Versión</option>
            <option value="ya_procesado">Procesados</option>
          </select>

          <select 
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-')
              setSortBy(field)
              setSortOrder(order)
            }}
            className="sort-select"
          >
            <option value="nombre-asc">Nombre A-Z</option>
            <option value="nombre-desc">Nombre Z-A</option>
            <option value="codigo-asc">Código A-Z</option>
            <option value="codigo-desc">Código Z-A</option>
            <option value="version-asc">Versión ↑</option>
            <option value="version-desc">Versión ↓</option>
          </select>
        </div>

        <div className="controls-right">
          <button 
            className="action-btn secondary"
            onClick={handleRemoveSelected}
            disabled={selectedItems.size === 0}
          >
            🗑️ Remover Seleccionados ({selectedItems.size})
          </button>
          <button 
            className="action-btn primary"
            onClick={handleStartSelected}
            disabled={selectedItems.size === 0 || workflowLoading}
          >
            🚀 Procesar Seleccionados ({selectedItems.size})
          </button>
          <button 
            className="action-btn primary"
            onClick={handleStartAll}
            disabled={filteredAndSortedItems.length === 0 || workflowLoading}
          >
            🚀 Procesar Todos ({filteredAndSortedItems.length})
          </button>
        </div>
      </div>

      {/* Queue Table */}
      {error ? (
        <div className="error-message">
          ❌ Error cargando cola: {error}
        </div>
      ) : filteredAndSortedItems.length === 0 ? (
        <div className="empty-queue">
          <div className="empty-icon">📋</div>
          <h3>No hay procedimientos en cola</h3>
          <p>Escanea el directorio de procedimientos para encontrar archivos nuevos o actualizados</p>
          <button className="scan-btn primary" onClick={handleScan}>
            🔍 Escanear Procedimientos
          </button>
        </div>
      ) : (
        <div className="queue-table-container">
          <table className="queue-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedItems.size === filteredAndSortedItems.length && filteredAndSortedItems.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th>Código</th>
                <th>Nombre</th>
                <th>Versión</th>
                <th>Estado</th>
                <th>Archivo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedItems.map(item => (
                <tr 
                  key={`${item.codigo}-${item.version}`}
                  className={selectedItems.has(item.codigo) ? 'selected' : ''}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.codigo)}
                      onChange={(e) => handleSelectItem(item.codigo, e.target.checked)}
                    />
                  </td>
                  <td className="codigo-cell">
                    <code>{item.codigo}</code>
                  </td>
                  <td className="nombre-cell">
                    <div className="procedure-name">{item.nombre}</div>
                    {item.datos_completos?.disciplina && (
                      <div className="procedure-discipline">
                        {item.datos_completos.disciplina}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="version-badge">v{item.version}</span>
                  </td>
                  <td>
                    {getStatusBadge(item.estado)}
                  </td>
                  <td className="archivo-cell">
                    <span title={item.datos_completos?.ruta_completa}>
                      {item.archivo}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="action-btn-small primary"
                      onClick={() => handleStartSelected([item.codigo])}
                      disabled={workflowLoading}
                      title="Procesar solo este procedimiento"
                    >
                      ▶️
                    </button>
                    <button
                      className="action-btn-small danger"
                      onClick={() => removeFromQueue(item.codigo, item.version, 'manual')}
                      title="Remover de la cola"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .procedure-queue {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .queue-loading {
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
        .queue-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .queue-header h2 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
          font-size: 1.75rem;
          font-weight: 700;
        }

        .queue-header p {
          margin: 0;
          color: #6b7280;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .scan-btn, .header-actions button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .scan-btn {
          background: #10b981;
          color: white;
        }

        .scan-btn:hover {
          background: #059669;
        }

        .header-actions button {
          background: #f3f4f6;
          color: #374151;
        }

        .header-actions button:hover {
          background: #e5e7eb;
        }

        /* Summary */
        .queue-summary {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .summary-card {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          min-width: 120px;
          text-align: center;
        }

        .summary-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 0.25rem;
        }

        .summary-label {
          font-size: 0.8rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Controls */
        .queue-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .controls-left {
          display: flex;
          gap: 0.75rem;
          flex: 1;
          min-width: 300px;
        }

        .controls-right {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .search-input, .filter-select, .sort-select {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .search-input {
          flex: 1;
          min-width: 200px;
        }

        .action-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .action-btn.primary {
          background: #667eea;
          color: white;
        }

        .action-btn.primary:hover:not(:disabled) {
          background: #5a67d8;
        }

        .action-btn.secondary {
          background: #f59e0b;
          color: white;
        }

        .action-btn.secondary:hover:not(:disabled) {
          background: #d97706;
        }

        /* Empty State */
        .empty-queue {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .empty-queue h3 {
          margin: 0 0 0.5rem 0;
          color: #374151;
        }

        .empty-queue p {
          margin: 0 0 1.5rem 0;
        }

        .scan-btn.primary {
          background: #667eea;
          color: white;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
        }

        /* Table */
        .queue-table-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .queue-table {
          width: 100%;
          border-collapse: collapse;
        }

        .queue-table th {
          background: #f8fafc;
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
          font-size: 0.85rem;
        }

        .queue-table td {
          padding: 0.75rem;
          border-bottom: 1px solid #f3f4f6;
          font-size: 0.9rem;
        }

        .queue-table tr:hover {
          background: #f8fafc;
        }

        .queue-table tr.selected {
          background: #ede9fe;
        }

        .codigo-cell code {
          background: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.8rem;
        }

        .nombre-cell {
          max-width: 300px;
        }

        .procedure-name {
          font-weight: 500;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .procedure-discipline {
          font-size: 0.8rem;
          color: #6b7280;
          font-style: italic;
        }

        .version-badge {
          background: #e0e7ff;
          color: #3730a3;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .status-badge {
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
          display: inline-block;
        }

        .archivo-cell {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: monospace;
          font-size: 0.8rem;
          color: #6b7280;
        }

        .actions-cell {
          display: flex;
          gap: 0.25rem;
        }

        .action-btn-small {
          padding: 0.25rem 0.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s;
        }

        .action-btn-small.primary {
          background: #10b981;
          color: white;
        }

        .action-btn-small.danger {
          background: #ef4444;
          color: white;
        }

        .action-btn-small:hover:not(:disabled) {
          transform: scale(1.1);
        }

        .error-message {
          background: #fed7d7;
          color: #c53030;
          padding: 1rem;
          border-radius: 8px;
          text-align: center;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .procedure-queue {
            padding: 1rem;
          }

          .queue-header {
            flex-direction: column;
            gap: 1rem;
          }

          .queue-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .controls-left {
            flex-direction: column;
            min-width: auto;
          }

          .controls-right {
            justify-content: center;
          }

          .queue-table-container {
            overflow-x: auto;
          }

          .queue-table {
            min-width: 800px;
          }
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default ProcedureQueue