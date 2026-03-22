import { ipcMain, app } from 'electron'
import { exec } from 'child_process'
import * as db from '../services/db.service'
import { checkAccessibility, openAccessibilitySettings } from '../services/whatsapp.service'
import { createLogger } from '../utils/logger'

const log = createLogger('ipc:settings')

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:getAll', () => {
    try {
      return db.getSettings()
    } catch (err) {
      log.error('getAll failed', err)
      throw err
    }
  })

  ipcMain.handle('settings:update', (_, key: string, value: string) => {
    try {
      db.updateSetting(key, value)

      // Sync login item setting when changed
      if (key === 'open_at_login') {
        app.setLoginItemSettings({ openAtLogin: value === '1', openAsHidden: true })
      }
    } catch (err) {
      log.error('update failed', err)
      throw err
    }
  })

  ipcMain.handle('system:checkAccessibility', async () => {
    return checkAccessibility()
  })

  ipcMain.handle('system:openAccessibilityPrefs', async () => {
    return openAccessibilitySettings()
  })

  ipcMain.handle('app:rebuild', () => {
    const projectRoot = app.getAppPath()
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      exec('npm run build', { cwd: projectRoot, shell: true }, (error) => {
        if (error) {
          log.error('rebuild failed', error)
          resolve({ success: false, error: error.message })
        } else {
          app.relaunch()
          app.quit()
          resolve({ success: true })
        }
      })
    })
  })
}
