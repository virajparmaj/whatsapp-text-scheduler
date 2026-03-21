import { app, BrowserWindow, shell, powerMonitor, Notification, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { initDb, closeDb, getSettings } from './services/db.service'
import { initScheduler, setOnExecutedCallback, shutdownScheduler, resyncAfterWake } from './services/scheduler.service'
import { registerAllHandlers } from './ipc/handlers'
import type { RunLog } from '../shared/types'

const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Hide window on close instead of destroying (keeps scheduler running)
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  // Load renderer
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray(): void {
  const iconPath = join(__dirname, '../../resources/trayTemplate.png')
  const icon = nativeImage.createFromPath(iconPath)
  icon.setTemplateImage(true)

  tray = new Tray(icon)
  tray.setToolTip('WA Scheduler')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Window',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        } else {
          createWindow()
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit WA Scheduler',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    } else {
      createWindow()
    }
  })
}

app.whenReady().then(() => {
  // Initialize database
  initDb()

  // Register IPC handlers
  registerAllHandlers()

  // Initialize scheduler
  initScheduler()

  // Create system tray icon
  createTray()

  // Sync login item setting from DB
  const settings = getSettings()
  app.setLoginItemSettings({ openAtLogin: settings.openAtLogin, openAsHidden: true })

  // Push execution events to renderer + show native notification
  setOnExecutedCallback((log: RunLog) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('schedule:executed', log)
    }

    if (Notification.isSupported()) {
      const title = log.status === 'success' ? 'Message Sent'
        : log.status === 'dry_run' ? 'Dry Run Complete'
        : log.status === 'failed' ? 'Send Failed'
        : 'Schedule Skipped'
      const body = log.status === 'failed'
        ? (log.errorMessage || 'Unknown error')
        : (log.contactName || log.phoneNumber || log.scheduleId)
      new Notification({ title, body }).show()
    }
  })

  // Re-sync scheduler after macOS sleep/wake to catch missed timers
  powerMonitor.on('resume', () => {
    console.log('System resumed from sleep — resyncing scheduler')
    resyncAfterWake()
  })

  createWindow()

  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    } else {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  // On macOS, keep running in background (tray). On other platforms, quit.
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  isQuitting = true
  shutdownScheduler()
  closeDb()
})
