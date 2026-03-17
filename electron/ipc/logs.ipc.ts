import { ipcMain } from 'electron'
import * as db from '../services/db.service'

export function registerLogsHandlers(): void {
  ipcMain.handle('logs:getAll', (_, limit?: number) => {
    try {
      return db.getLogs(limit)
    } catch (err) {
      console.error('[logs:getAll]', err)
      throw err
    }
  })

  ipcMain.handle('logs:bySchedule', (_, scheduleId: string) => {
    try {
      return db.getLogsBySchedule(scheduleId)
    } catch (err) {
      console.error('[logs:bySchedule]', err)
      throw err
    }
  })

  ipcMain.handle('logs:clear', (_, olderThanDays?: number) => {
    try {
      db.clearLogs(olderThanDays)
    } catch (err) {
      console.error('[logs:clear]', err)
      throw err
    }
  })
}
