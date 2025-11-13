import {
  app,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  screen,
} from 'electron'
import log from 'electron-log/main'
import started from 'electron-squirrel-startup'
import path from 'node:path'
import { updateElectronApp } from 'update-electron-app'
import { setupMenuBarProgress } from './menuBarProgress'
import { setMainWindow } from './messages/messages'

log.initialize()

updateElectronApp({
  logger: {
    log: log.log,
    info: log.info,
    warn: log.warn,
    error: log.error,
  },
})

// Something something Windows. Not currently supported, will just leave it.
if (started) {
  app.quit()
}

const createWindow = () => {
  const displays = screen.getAllDisplays()

  const externalDisplay = displays.length > 1 ? displays[1] : null

  const windowOptions: BrowserWindowConstructorOptions = {
    width: app.isPackaged ? 800 : 1200,
    height: 800,
    x: 0,
    y: 0,
    icon: path.join(__dirname, '../assets/icon.png'),
    title: app.isPackaged ? 'Fast Classifieds' : 'Fast Classifieds - Debug',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  }

  if (externalDisplay && !app.isPackaged) {
    windowOptions.x = externalDisplay.bounds.x + 50
    windowOptions.y = externalDisplay.bounds.y + 50
  }

  const mainWindow = new BrowserWindow(windowOptions)

  // Set the main window reference for IPC handlers
  setMainWindow(mainWindow)

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    )
  }

  // Only open dev tools in development mode
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools()
  }
}

app.on('ready', () => {
  createWindow()
  setupMenuBarProgress()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
