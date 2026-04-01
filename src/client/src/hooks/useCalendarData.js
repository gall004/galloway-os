import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchTimeBlocks, fetchTasks } from '@/lib/api'
import { useBoard } from '@/hooks/useBoard'

/**
 * @description Compute the Monday-start week boundaries for a given offset.
 * @param {number} weekOffset - 0 = current week, -1 = last week, 1 = next week.
 * @returns {{ weekStart: Date, weekEnd: Date, days: Date[] }}
 */
function getWeekBounds(weekOffset) {
  const now = new Date()
  const day = now.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 7)

  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d)
  }

  return { weekStart: monday, weekEnd: sunday, days }
}

/**
 * @description Hook that manages calendar week state, time blocks, and unscheduled task computation.
 * @returns {Object} Calendar data and navigation controls.
 */
export function useCalendarData() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [timeBlocks, setTimeBlocks] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const { activeBoardId } = useBoard()

  const { weekStart, weekEnd, days } = useMemo(() => getWeekBounds(weekOffset), [weekOffset])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [blocks, tasks] = await Promise.all([
        fetchTimeBlocks(weekStart.toISOString(), weekEnd.toISOString(), activeBoardId),
        fetchTasks(activeBoardId),
      ])
      setTimeBlocks(blocks)
      setAllTasks(tasks)
    } catch {
      /* error handled by loading state */
    }
    setLoading(false)
  }, [weekStart, weekEnd, activeBoardId])

  useEffect(() => { load() }, [load])

  const activeTasks = useMemo(() => {
    return allTasks.filter(
      (t) => !t.is_template && t.status_name !== 'done'
    )
  }, [allTasks])

  return {
    weekOffset,
    setWeekOffset,
    weekStart,
    weekEnd,
    days,
    timeBlocks,
    activeTasks,
    allTasks,
    loading,
    reload: load,
    goToday: () => setWeekOffset(0),
    goPrev: () => setWeekOffset((o) => o - 1),
    goNext: () => setWeekOffset((o) => o + 1),
  }
}
