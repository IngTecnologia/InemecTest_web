/**
 * Hooks personalizados para el módulo administrativo
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import adminApi from '../src/services/api.js'  // ← LÍNEA CORREGIDA (era adminApi.js)

/**
 * Hook para el estado del módulo admin con actualización automática
 */
export const useAdminStatus = (autoRefresh = true, interval = 10000) => {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const stopPollingRef = useRef(null)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await adminApi.getStatus()
      setStatus(response.data)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching admin status:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()

    if (autoRefresh) {
      // Simplified polling - usar setInterval en lugar de método complejo
      const intervalId = setInterval(fetchStatus, interval)
      return () => clearInterval(intervalId)
    }
  }, [fetchStatus, autoRefresh, interval])

  return {
    status,
    loading,
    error,
    refresh: fetchStatus
  }
}

/**
 * Hook para el progreso del workflow con polling automático
 */
export const useWorkflowProgress = (batchId, enabled = true) => {
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !batchId) {
      setLoading(false)
      return
    }

    const fetchProgress = async () => {
      try {
        const response = await adminApi.getWorkflowProgress(batchId)
        setProgress(response.data)
        setError(null)
      } catch (err) {
        setError(err.message)
        console.error('Error fetching workflow progress:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
    const intervalId = setInterval(fetchProgress, 2000) // cada 2 segundos

    return () => clearInterval(intervalId)
  }, [batchId, enabled])

  return {
    progress,
    loading,
    error
  }
}

/**
 * Hook para gestión de la cola de procedimientos
 */
export const useQueue = () => {
  const [queue, setQueue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching queue...') // Debug
      
      const response = await adminApi.getQueue()
      console.log('📦 Queue response:', response) // Debug
      
      // FIX: Manejar diferentes estructuras de respuesta
      let queueData
      if (response?.data?.queue_items) {
        queueData = response.data
      } else if (response?.queue_items) {
        queueData = response
      } else {
        console.warn('⚠️ Estructura inesperada:', response)
        queueData = { queue_items: [], total_pending: 0 }
      }
      
      console.log('✅ Setting queue data:', queueData) // Debug
      setQueue(queueData)
      setError(null)
    } catch (err) {
      console.error('❌ Error fetching queue:', err)
      setError(err.message)
      setQueue({ queue_items: [], total_pending: 0 })
    } finally {
      setLoading(false)
    }
  }, [])

  const scanProcedures = useCallback(async () => {
    try {
      setLoading(true)
      console.log('🔍 Scanning procedures...') // Debug
      
      const result = await adminApi.scanProcedures()
      console.log('📊 Scan result:', result) // Debug
      
      // Refrescar cola después del escaneo
      await fetchQueue()
    } catch (err) {
      console.error('❌ Error scanning:', err)
      setError(err.message)
      setLoading(false)
    }
  }, [fetchQueue])

  const removeFromQueue = useCallback(async (codigo, version, reason) => {
    try {
      await adminApi.removeFromQueue(codigo, version, reason)
      await fetchQueue()
    } catch (err) {
      setError(err.message)
      console.error('❌ Error removing from queue:', err)
    }
  }, [fetchQueue])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  return {
    queue,
    loading,
    error,
    refresh: fetchQueue,
    scanProcedures,
    removeFromQueue
  }
}

/**
 * Hook para control del workflow
 */
export const useWorkflow = () => {
  const [workflowStatus, setWorkflowStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const startWorkflow = useCallback(async (options = {}) => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminApi.startWorkflow(
        options.procedureCodes,
        options.forceRegeneration
      )
      return response
    } catch (err) {
      setError(err.message)
      console.error('Error starting workflow:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const cancelWorkflow = useCallback(async () => {
    try {
      setLoading(true)
      const response = await adminApi.cancelWorkflow()
      return response
    } catch (err) {
      setError(err.message)
      console.error('Error cancelling workflow:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getStatus = useCallback(async () => {
    try {
      const response = await adminApi.getWorkflowStatus()
      setWorkflowStatus(response.data)
      return response.data
    } catch (err) {
      setError(err.message)
      console.error('Error getting workflow status:', err)
    }
  }, [])

  return {
    workflowStatus,
    loading,
    error,
    startWorkflow,
    cancelWorkflow,
    getStatus
  }
}

/**
 * Hook para estadísticas del sistema
 */
export const useStats = (autoRefresh = false, interval = 30000) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = useCallback(async () => {
    try {
      const response = await adminApi.getStats()
      setStats(response.data)  // ← CORREGIDO: usar response.data
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()

    if (autoRefresh) {
      const intervalId = setInterval(fetchStats, interval)
      return () => clearInterval(intervalId)
    }
  }, [fetchStats, autoRefresh, interval])

  return {
    stats,
    loading,
    error,
    refresh: fetchStats
  }
}

/**
 * Hook para configuración del sistema
 */
export const useConfig = () => {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchConfig = useCallback(async () => {
    try {
      const response = await adminApi.getConfig()
      setConfig(response.data)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching config:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleDebugMode = useCallback(async (enable) => {
    try {
      await adminApi.toggleDebugMode(enable)
      await fetchConfig() // Refrescar configuración
    } catch (err) {
      setError(err.message)
      console.error('Error toggling debug mode:', err)
    }
  }, [fetchConfig])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  return {
    config,
    loading,
    error,
    refresh: fetchConfig,
    toggleDebugMode
  }
}