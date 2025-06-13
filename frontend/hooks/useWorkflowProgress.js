import { useState, useEffect, useRef } from 'react'
import adminApi from '../src/services/adminApi.js'

/**
 * Poll workflow progress for a given batch id
 * @param {string|null} batchId
 * @param {boolean} enabled
 */
export default function useWorkflowProgress(batchId, enabled = true) {
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const stopRef = useRef(null)

  useEffect(() => {
    if (!enabled || !batchId) {
      setLoading(false)
      return
    }

    stopRef.current = adminApi.startProgressPolling(
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
      2000
    )

    return () => {
      if (stopRef.current) stopRef.current()
    }
  }, [batchId, enabled])

  return { progress, loading, error }
}