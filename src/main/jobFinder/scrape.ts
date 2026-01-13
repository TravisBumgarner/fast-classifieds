// import { JSDOM } from 'jsdom' // No longer needed
import { BrowserWindow } from 'electron'
import type { INTERNAL_ERRORS } from '../../shared/errors'
import type { ScrapedContentDTO } from '../../shared/types'
import logger from '../logger'
import store from '../store'
import { hashContent } from '../utilities'

function extractTextAndLinksFromDOM(baseUrl = ''): Array<{ text: string; link: string | null }> {
  // Remove junk
  document.querySelectorAll('script, style, noscript').forEach((el) => {
    el.remove()
  })
  const items = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null)
  while (walker.nextNode()) {
    const text = walker.currentNode.nodeValue?.trim()
    if (!text) continue
    const linkEl = walker.currentNode.parentElement?.closest('a')
    let link = linkEl?.getAttribute('href') || null
    if (link && baseUrl) {
      if (link === '#' || link.startsWith('javascript:') || /^https?:?$/.test(link)) {
        link = null
      } else {
        try {
          link = new URL(link, baseUrl).href
        } catch {
          link = null
        }
      }
    }
    items.push({ text, link })
  }
  // dedupe identical text/link combos
  const seen = new Set()
  const unique = []
  for (const i of items) {
    const key = `${i.text}|${i.link || ''}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(i)
    }
  }
  return unique
}

export const scrape = async ({
  siteUrl,
  selector,
}: {
  siteUrl: string
  selector: string
}): Promise<
  | { ok: true; scrapedContent: ScrapedContentDTO; hash: string }
  | { ok: false; errorCode: keyof typeof INTERNAL_ERRORS; message?: string }
> => {
  if (!siteUrl) {
    return { ok: false, errorCode: 'NO_URL' }
  }
  if (!selector) {
    return { ok: false, errorCode: 'NO_SELECTOR' }
  }

  const delay = store.get('scrapeDelay')

  const win = new BrowserWindow({
    show: false,
    width: 1920,
    height: 1080,
    webPreferences: {
      offscreen: true,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Helps with some bot detection
    },
  })

  // Set more realistic user agent and headers
  const session = win.webContents.session

  await session.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  )

  // Add common headers to look more like a real browser
  session.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders.Accept =
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
    details.requestHeaders['Accept-Language'] = 'en-US,en;q=0.9'
    details.requestHeaders['Accept-Encoding'] = 'gzip, deflate, br'
    details.requestHeaders['Cache-Control'] = 'no-cache'
    details.requestHeaders.Pragma = 'no-cache'
    details.requestHeaders['Sec-Fetch-Dest'] = 'document'
    details.requestHeaders['Sec-Fetch-Mode'] = 'navigate'
    details.requestHeaders['Sec-Fetch-Site'] = 'none'
    details.requestHeaders['Sec-Fetch-User'] = '?1'
    details.requestHeaders['Upgrade-Insecure-Requests'] = '1'
    callback({ requestHeaders: details.requestHeaders })
  })

  try {
    try {
      // Add random delay before loading to seem more human
      const randomPreDelay = Math.floor(Math.random() * 2000) + 1000 // 1-3 seconds
      await new Promise((r) => setTimeout(r, randomPreDelay))

      await win.loadURL(siteUrl, {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        extraHeaders: [
          'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language: en-US,en;q=0.5',
          'Accept-Encoding: gzip, deflate',
          'Connection: keep-alive',
          'Upgrade-Insecure-Requests: 1',
        ].join('\n'),
      })

      // Check if we got blocked or redirected to a captcha/bot detection page
      const currentUrl = win.webContents.getURL()
      const title = await win.webContents.getTitle()

      // Check for common bot detection indicators
      if (
        title.toLowerCase().includes('blocked') ||
        title.toLowerCase().includes('captcha') ||
        title.toLowerCase().includes('robot') ||
        title.toLowerCase().includes('access denied') ||
        currentUrl.includes('captcha') ||
        currentUrl.includes('blocked')
      ) {
        win.destroy()
        return { ok: false, errorCode: 'NAVIGATION_FAIL', message: 'Possible bot detection' }
      }
    } catch (e) {
      win.destroy()
      return { ok: false, errorCode: 'NAVIGATION_FAIL', message: String(e) }
    }

    // Wait for selector
    try {
      let attempts = 0
      const maxAttempts = 3
      let elementFound = false

      while (attempts < maxAttempts && !elementFound) {
        attempts++

        try {
          elementFound = await win.webContents.executeJavaScript(`!!document.querySelector('${selector}')`, true)

          if (elementFound) {
            break
          }
        } catch (jsError) {
          // Continue to next attempt
          logger.error(`Error checking for selector on attempt ${attempts}: ${jsError}`)
        }

        // Only wait if not the last attempt
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 3000))
        }
      }

      if (!elementFound) {
        throw new Error(`Selector '${selector}' not found after ${maxAttempts} gentle attempts`)
      }
    } catch (e) {
      win.destroy()
      return { ok: false, errorCode: 'SELECTOR_NOT_FOUND', message: String(e) }
    }

    await new Promise((r) => setTimeout(r, delay))

    // Get the HTML and extract text/links in the renderer context
    const scrapedContent = await win.webContents.executeJavaScript(
      `(${extractTextAndLinksFromDOM.toString()})(${JSON.stringify(siteUrl)})`,
      true,
    )

    win.destroy()

    const hash = hashContent(JSON.stringify(scrapedContent))

    return {
      ok: true,
      scrapedContent,
      hash,
    }
  } catch (e) {
    win.destroy()
    // fallback to NAVIGATION_FAIL for unknown errors
    return { ok: false, errorCode: 'NAVIGATION_FAIL', message: String(e) }
  }
}
