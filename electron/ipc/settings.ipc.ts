import { ipcMain, app } from 'electron'
import * as db from '../services/db.service'
import { checkAccessibility, openAccessibilitySettings } from '../services/whatsapp.service'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:getAll', () => {
    try {
      return db.getSettings()
    } catch (err) {
      console.error('[settings:getAll]', err)
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
      console.error('[settings:update]', err)
      throw err
    }
  })

  ipcMain.handle('system:checkAccessibility', async () => {
    return checkAccessibility()
  })

  ipcMain.handle('system:openAccessibilityPrefs', async () => {
    return openAccessibilitySettings()
  })
}
