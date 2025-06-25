/**
 * API service para el módulo administrativo de InemecTest
 */

const API_BASE_URL = '/api/v1/admin'

class AdminApiService {
  // =============================================================================
  // ESTADO Y CONFIGURACIÓN
  // =============================================================================
  
  async getStatus() {
    const response = await fetch(`${API_BASE_URL}/status`)
    if (!response.ok) throw new Error('Error obteniendo estado del admin')
    return response.json()
  }

  async getConfig() {
    const response = await fetch(`${API_BASE_URL}/config`)
    if (!response.ok) throw new Error('Error obteniendo configuración')
    return response.json()
  }

  async toggleDebugMode(enable) {
    const response = await fetch(`${API_BASE_URL}/config/debug?enable=${enable}`, {
      method: 'POST'
    })
    if (!response.ok) throw new Error('Error configurando modo debug')
    return response.json()
  }

  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`)
    if (!response.ok) throw new Error('Error en health check')
    return response.json()
  }

  // =============================================================================
  // ESCANEO Y COLA
  // =============================================================================

  async scanProcedures() {
    const response = await fetch(`${API_BASE_URL}/scan`, {
      method: 'POST'
    })
    if (!response.ok) throw new Error('Error escaneando procedimientos')
    return response.json()
  }

  async getQueue() {
    const response = await fetch(`${API_BASE_URL}/queue`)
    if (!response.ok) throw new Error('Error obteniendo cola')
    return response.json()
  }

  async removeFromQueue(codigo, version, reason = 'manual_removal') {
    const response = await fetch(`${API_BASE_URL}/queue/${codigo}/${version}?reason=${reason}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Error removiendo de cola')
    return response.json()
  }

  // =============================================================================
  // WORKFLOW Y GENERACIÓN
  // =============================================================================

  async startWorkflow(procedureCodes = null, forceRegeneration = false) {
    const body = {}
    if (procedureCodes) {
      body.procedure_codes = procedureCodes
    }
    if (forceRegeneration) {
      body.force_regeneration = forceRegeneration
    }

    const response = await fetch(`${API_BASE_URL}/workflow/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
    })
    
    if (!response.ok) throw new Error('Error iniciando workflow')
    return response.json()
  }

  async getWorkflowProgress(batchId = null) {
    const url = batchId 
      ? `${API_BASE_URL}/workflow/progress/${batchId}`
      : `${API_BASE_URL}/workflow/progress`
    
    const response = await fetch(url)
    if (!response.ok) throw new Error('Error obteniendo progreso')
    return response.json()
  }

  async getWorkflowStatus() {
    const response = await fetch(`${API_BASE_URL}/workflow/status`)
    if (!response.ok) throw new Error('Error obteniendo estado del workflow')
    return response.json()
  }

  async cancelWorkflow() {
    const response = await fetch(`${API_BASE_URL}/workflow/cancel`, {
      method: 'POST'
    })
    if (!response.ok) throw new Error('Error cancelando workflow')
    return response.json()
  }

  // =============================================================================
  // COMPONENTES INDIVIDUALES
  // =============================================================================

  async generateSingleProcedure(codigo, version = '1') {
    const response = await fetch(`${API_BASE_URL}/generate/single/${codigo}?version=${version}`, {
      method: 'POST'
    })
    if (!response.ok) throw new Error('Error generando procedimiento individual')
    return response.json()
  }

  async validateBatch(batchData) {
    const response = await fetch(`${API_BASE_URL}/validate/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(batchData)
    })
    if (!response.ok) throw new Error('Error validando lote')
    return response.json()
  }

  // =============================================================================
  // ESTADÍSTICAS Y RESULTADOS
  // =============================================================================

  async getStats() {
    const response = await fetch(`${API_BASE_URL}/stats`)
    if (!response.ok) throw new Error('Error obteniendo estadísticas')
    return response.json()
  }

  async getResults() {
    const response = await fetch(`${API_BASE_URL}/results`)
    if (!response.ok) throw new Error('Error obteniendo resultados')
    return response.json()
  }

  // =============================================================================
  // TESTING Y UTILIDADES
  // =============================================================================

  async testFullPipeline() {
    const response = await fetch(`${API_BASE_URL}/test/full-pipeline`, {
      method: 'POST'
    })
    if (!response.ok) throw new Error('Error en test del pipeline')
    return response.json()
  }

  // =============================================================================
  // UTILIDADES DE POLLING
  // =============================================================================

  /**
   * Polling continuo del estado del workflow
   * @param {Function} callback - Función que recibe los datos actualizados
   * @param {number} interval - Intervalo en milisegundos (default: 5000)
   * @returns {Function} - Función para detener el polling
   */
  startStatusPolling(callback, interval = 5000) {
    const poll = async () => {
      try {
        const status = await this.getStatus()
        const workflowStatus = await this.getWorkflowStatus()
        callback({ status: status.data, workflow: workflowStatus.data })
      } catch (error) {
        console.error('Error en polling:', error)
        callback({ error: error.message })
      }
    }

    // Primera llamada inmediata
    poll()
    
    // Configurar intervalo
    const intervalId = setInterval(poll, interval)
    
    // Retornar función para detener polling
    return () => clearInterval(intervalId)
  }

  /**
   * Polling del progreso del workflow
   * @param {string} batchId - ID del batch a monitorear
   * @param {Function} callback - Función que recibe el progreso
   * @param {number} interval - Intervalo en milisegundos (default: 2000)
   * @returns {Function} - Función para detener el polling
   */
  startProgressPolling(batchId, callback, interval = 2000) {
    const poll = async () => {
      try {
        const progress = await this.getWorkflowProgress(batchId)
        callback(progress.data)
      } catch (error) {
        console.error('Error en polling de progreso:', error)
        callback({ error: error.message })
      }
    }

    poll()
    const intervalId = setInterval(poll, interval)
    return () => clearInterval(intervalId)
  }

  // =============================================================================
  // UTILIDADES DE VALIDACIÓN
  // =============================================================================

  validateProcedureCode(codigo) {
    return codigo && typeof codigo === 'string' && codigo.trim().length > 0
  }

  validateVersion(version) {
    return version && (typeof version === 'string' || typeof version === 'number')
  }

  formatError(error) {
    if (error.response && error.response.data && error.response.data.detail) {
      return error.response.data.detail
    }
    return error.message || 'Error desconocido'
  }

  // =============================================================================
  // MÉTODOS DE CONVENIENCIA
  // =============================================================================

  /**
   * Ejecutar workflow completo con manejo de errores
   */
  async executeFullWorkflow(options = {}) {
    try {
      // 1. Verificar estado
      const status = await this.getStatus()
      if (status.data.workflow_state !== 'idle') {
        throw new Error(`Workflow ocupado: ${status.data.workflow_state}`)
      }

      // 2. Escanear si es necesario
      if (options.scanFirst !== false) {
        await this.scanProcedures()
      }

      // 3. Obtener cola
      const queue = await this.getQueue()
      if (queue.total_pending === 0) {
        throw new Error('No hay procedimientos en cola para procesar')
      }

      // 4. Iniciar workflow
      const result = await this.startWorkflow(
        options.procedureCodes,
        options.forceRegeneration
      )

      return {
        success: true,
        batchId: result.batch_id,
        proceduresCount: result.procedures_to_process,
        estimatedTime: result.estimated_time_minutes
      }

    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      }
    }
  }

  /**
   * Obtener resumen completo del sistema
   */
  async getSystemSummary() {
    try {
      const [status, config, stats, queue] = await Promise.all([
        this.getStatus(),
        this.getConfig(),
        this.getStats(),
        this.getQueue()
      ])

      return {
        success: true,
        data: {
          status: status.data,
          config: config.data,
          stats,
          queue: {
            total: queue.total_pending,
            items: queue.queue_items
          }
        }
      }
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      }
    }
  }
}

// Exportar instancia singleton
const adminApi = new AdminApiService()
export default adminApi

// También exportar la clase para testing
export { AdminApiService }