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
  if (!siteUrl) return { ok: false, errorCode: 'NO_URL' }
  if (!selector) return { ok: false, errorCode: 'NO_SELECTOR' }

  const delay = store.get('scrapeDelay')

  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      offscreen: true,
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  try {
    try {
      await win.loadURL(siteUrl, { userAgent: 'Mozilla/5.0' })
    } catch (e) {
      win.destroy()
      return { ok: false, errorCode: 'NAVIGATION_FAIL', message: String(e) }
    }

    // Wait for selector
    try {
      await win.webContents.executeJavaScript(
        `
        new Promise(resolve => {
          const check = () => {
            if (document.querySelector('${selector}')) resolve(true)
            else setTimeout(check, 100)
          }
          check()
        })
      `,
        true,
      )
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

    return {
      ok: true,
      scrapedContent,
      hash: hashContent(JSON.stringify(scrapedContent)),
    }
  } catch (e) {
    win.destroy()
    logger.error('Scraping failed', e)
    // fallback to NAVIGATION_FAIL for unknown errors
    return { ok: false, errorCode: 'NAVIGATION_FAIL', message: String(e) }
  }
}
