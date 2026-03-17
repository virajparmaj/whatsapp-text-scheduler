import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/ipc'

export function useNextFireTimes() {
  const [fireTimes, setFireTimes] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await api.getNextFireTimes()
      setFireTimes(data)
    } catch (err) {
      console.error('Failed to load fire times:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Re-fetch when schedule executes
  useEffect(() => {
    const unsub = api.onScheduleExecuted(() => {
      refresh()
    })
    return unsub
  }, [refresh])

  return { fireTimes, loading, refresh }
}
