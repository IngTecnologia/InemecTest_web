import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Generic polling hook
 * @param {Function} fetchFunction Function returning a promise with new data
 * @param {number} interval Polling interval in ms
 * @param {boolean} enabled Whether polling is active
 */
export default function usePolling(fetchFunction, interval = 5000, enabled = true) {
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

    poll()
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

  return { data, loading, error, stop, restart, refresh: poll }
}