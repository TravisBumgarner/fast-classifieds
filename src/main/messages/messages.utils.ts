import { shell } from 'electron'
import { CHANNEL_INVOKES } from '../../shared/types/messages.invokes'
import logger from '../logger'
import { typedIpcMain } from './ipcMain'

function cleanTitle(input: string): string {
  const s = input.trim()
  let output = s

  // If starts with "Careers at"
  if (s.startsWith('Careers at')) {
    output = s.replace(/^Careers at[^a-zA-Z0-9]*([a-zA-Z0-9].*)$/i, '$1').trim()
  }

  // If starts with "Careers", strip everything up to first alphanumeric
  if (s.startsWith('Careers')) {
    output = output.replace(/^Careers[^a-zA-Z0-9]*([a-zA-Z0-9].*)$/i, '$1').trim()
  }

  return output
}

typedIpcMain.handle(CHANNEL_INVOKES.UTILS.OPEN_URL, async (_event, params) => {
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

typedIpcMain.handle(CHANNEL_INVOKES.UTILS.FETCH_PAGE_TITLE, async (_event, params) => {
  try {
    if (!params.url || typeof params.url !== 'string' || params.url.trim() === '') {
      logger.error('Invalid URL provided to fetchPageTitle:', params.url)
      return { success: false, error: 'Invalid URL' }
    }

    let validUrl = params.url.trim()
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = `https://${validUrl}`
    }

    const response = await fetch(validUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Fast-Classifieds/1.0)',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)

    if (titleMatch?.[1]) {
      const title = cleanTitle(titleMatch[1].trim())
      return { success: true, title }
    }

    // Fallback to hostname if no title found
    try {
      const url = new URL(validUrl)
      const title = cleanTitle(url.hostname)
      return { success: true, title }
    } catch {
      return { success: true, title: 'Untitled Site' }
    }
  } catch (error) {
    logger.error('Error fetching page title:', error)

    // Try to extract hostname as fallback
    try {
      let validUrl = params.url.trim()
      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
        validUrl = `https://${validUrl}`
      }
      const url = new URL(validUrl)
      const title = cleanTitle(url.hostname)
      return { success: true, title }
    } catch {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
})
