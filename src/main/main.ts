import path from 'node:path'
// import * as Sentry from '@sentry/electron/main'
import { app, BrowserWindow, type BrowserWindowConstructorOptions, screen } from 'electron'

import started from 'electron-squirrel-startup'
import { updateElectronApp } from 'update-electron-app'
import { migrateProduction } from './database/client'
import logger from './logger'
import './messages'
import { backfillDevelopment } from './database/backfillDevelopment'

// prevent Squirrel.Windows launches your app multiple times during the installation/updating/uninstallation
if (require('electron-squirrel-startup') === true) app.quit()

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string
declare const MAIN_WINDOW_VITE_NAME: string

// Disabling because of excessive logging.
// Sentry.init({
//   dsn: 'https://aa9b99c0da19f5f16cde7295bcae0fa4@o196886.ingest.us.sentry.io/4510360742133760',
// })

updateElectronApp({
  logger: {
    log: logger.info,
    info: logger.info,
    warn: logger.warn,
    error: logger.error,
  },
})

// Something something Windows. Not currently supported, will just leave it.
if (started) {
  app.quit()
}

const createWindow = () => {
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

  const mainWindow = new BrowserWindow(windowOptions)
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
  }

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools()
  }
}

app.on('ready', () => {
  // At some point, backfillDevelopment was run in production. Zero idea how. Thus logs for the future.
  logger.info('App isPackaged:', app.isPackaged)
  logger.info('Process platform:', process.platform)
  logger.info('__dirname:', __dirname)

  if (app.isPackaged) {
    migrateProduction()
  } else {
    backfillDevelopment()
  }
  createWindow()
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
