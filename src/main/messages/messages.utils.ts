import { shell } from 'electron'
import { CHANNEL } from '../../shared/messages.types'
import logger from '../logger'
import { typedIpcMain } from './ipcMain'

typedIpcMain.handle(CHANNEL.UTILS.OPEN_URL, async (_event, params) => {
  try {
    if (!params.url || typeof params.url !== 'string' || params.url.trim() === '') {
      logger.error('Invalid URL provided to openExternal:', params.url)
      return { success: false, error: 'Invalid URL' }
    }

    let validUrl = params.url.trim()
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = `https://${validUrl}`
    }

    await shell.openExternal(validUrl)
    return { success: true }
  } catch (error) {
    logger.error('Error opening external URL:', error)
    return { success: false, error: (error as Error).message }
  }
})
