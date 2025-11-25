import { JSDOM } from 'jsdom'
import { type Browser, launch } from 'puppeteer'
import type { INTERNAL_ERRORS } from '../../shared/errors'
import type { ScrapedContentDTO } from '../../shared/types'
import store from '../store'
import { hashContent } from '../utilities'

function extractTextAndLinks(html: string, baseUrl = ''): ScrapedContentDTO {
  const { window } = new JSDOM(html)
  const { document } = window

  // remove junk
  document.querySelectorAll('script, style, noscript').forEach((el) => {
    el.remove()
  })

  const items = []

  // walk entire tree
  const walker = document.createTreeWalker(document.body, window.NodeFilter.SHOW_TEXT, null)
  while (walker.nextNode()) {
    const text = walker.currentNode.nodeValue?.trim()
    if (!text) continue

    // find closest ancestor link if any
    const linkEl = walker.currentNode.parentElement?.closest('a')
    let link = linkEl?.getAttribute('href') || null
    if (link && baseUrl) {
      // ignore invalid/broken hrefs like "http:", "https:", "#", "javascript:", etc.
      if (
        link === '#' ||
        link.startsWith('javascript:') ||
        /^https?:?$/.test(link) // "http:", "https:", "http", "https"
      ) {
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

  let browser: Browser
  try {
    browser = await launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  } catch (e) {
    return { ok: false, errorCode: 'BROWSER_LAUNCH_FAIL', message: String(e) }
  }

  const page = await browser.newPage()

  try {
    try {
      await page.goto(siteUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      })
    } catch (e) {
      return { ok: false, errorCode: 'NAVIGATION_FAIL', message: String(e) }
    }

    try {
      await page.waitForSelector(selector, { timeout: 10_000 })
    } catch (e) {
      return { ok: false, errorCode: 'SELECTOR_NOT_FOUND', message: String(e) }
    }

    await new Promise((r) => setTimeout(r, delay))

    const rawContent = await page.$eval(selector, (el) => el.outerHTML)
    const scrapedContent = extractTextAndLinks(rawContent, siteUrl)

    return {
      ok: true,
      scrapedContent,
      hash: hashContent(JSON.stringify(scrapedContent)),
    }
  } finally {
    await browser.close().catch(() => {})
  }
}
