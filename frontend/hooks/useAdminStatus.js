
/**
 * Hooks personalizados para el módulo administrativo
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import adminApi from '../services/adminApi'

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
      stopPollingRef.current = adminApi.startStatusPolling((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setStatus(data.status)
          setError(null)
        }
        setLoading(false)
      }, interval)
    }

    return () => {
      if (stopPollingRef.current) {
        stopPollingRef.current()
      }
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
  const stopPollingRef = useRef(null)

  useEffect(() => {
    if (!enabled || !batchId) {
      setLoading(false)
      return
    }

    stopPollingRef.current = adminApi.startProgressPolling(
      batchId,
      (data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setProgress(data)
          setError(null)
        }
        setLoading(false)
      },
      2000 // Actualizar cada 2 segundos
    )

    return () => {
      if (stopPollingRef.current) {
        stopPollingRef.current()
      }
    }
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
      const response = await adminApi.getQueue()
      setQueue(response)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching queue:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const scanProcedures = useCallback(async () => {
    try {
      setLoading(true)
      await adminApi.scanProcedures()
      await fetchQueue() // Refrescar cola después del escaneo
    } catch (err) {
      setError(err.message)
      console.error('Error scanning procedures:', err)
      setLoading(false)
    }
  }, [fetchQueue])

  const removeFromQueue = useCallback(async (codigo, version, reason) => {
    try {
      await adminApi.removeFromQueue(codigo, version, reason)
      await fetchQueue() // Refrescar cola después de remover
    } catch (err) {
      setError(err.message)
      console.error('Error removing from queue:', err)
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
      setStats(response)
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

/**
 * Hook genérico para polling
 */
export const usePolling = (fetchFunction, interval = 5000, enabled = true) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  const poll = useCallback(async () => {
    try {
      const result = await fetchFunction()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Polling error:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchFunction])

  useEffect(() => {
    if (!enabled) return

    poll() // Primera llamada inmediata

    if (interval > 0) {
      intervalRef.current = setInterval(poll, interval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [poll, interval, enabled])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const restart = useCallback(() => {
    stop()
    if (enabled && interval > 0) {
      intervalRef.current = setInterval(poll, interval)
    }
  }, [stop, poll, enabled, interval])

  return {
    data,
    loading,
    error,
    stop,
    restart,
    refresh: poll
  }
}