import { shell } from 'electron'
import { CHANNEL_INVOKES } from '../../shared/types/messages.invokes'
import logger from '../logger'
import { typedIpcMain } from './ipcMain'

function decodeEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

export function cleanTitle(input: string): string {
  const decoded = decodeEntities(input.trim())
  let s = decoded

  // 1. Careers at Foo → Foo
  if (/^careers at\b/i.test(s)) {
    s = s.replace(/^careers at\s*/i, '')
    console.log(`cleanTitle: "${input}" → "${s.trim()}"`)
    return s.trim()
  }

  // 2. Careers - Foo → Foo
  if (/^careers\b/i.test(s)) {
    s = s.replace(/^careers[^a-zA-Z0-9]*([a-zA-Z0-9].*)$/i, '$1')
    console.log(`cleanTitle: "${input}" → "${s.trim()}"`)
    return s.trim()
  }

  // 3. Jobs at Foo → Foo
  s = s.replace(/^jobs at\s*/i, '')

  // 4. Strip job-related prefixes on left side of separators
  s = s.replace(/^(all jobs|view jobs|search jobs)\s*[-|—]+\s*/i, '')

  // 5. Patterns like "All Jobs | Foo" → Foo
  s = s.replace(/^(all jobs|view jobs|search jobs)\s*\|\s*/i, '')

  console.log(`cleanTitle: "${input}" → "${s.trim()}"`)
  return s.trim()
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
    logger.error('Error fetching page title:', error, params.url)

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
