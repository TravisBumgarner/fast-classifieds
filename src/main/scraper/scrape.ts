import crypto from 'crypto'
import { JSDOM } from 'jsdom'
import { launch } from 'puppeteer'
import store from '../store'

function extractTextAndLinks(html: string, baseUrl = '') {
  const { window } = new JSDOM(html)
  const { document } = window

  // remove junk
  document
    .querySelectorAll('script, style, noscript')
    .forEach(el => el.remove())

  const items = []

  // walk entire tree
  const walker = document.createTreeWalker(
    document.body,
    window.NodeFilter.SHOW_TEXT,
    null,
  )
  while (walker.nextNode()) {
    const text = walker.currentNode.nodeValue?.trim()
    if (!text) continue

    // find closest ancestor link if any
    const linkEl = walker.currentNode.parentElement?.closest('a')
    let link = linkEl?.getAttribute('href') || null
    if (link && baseUrl) link = new URL(link, baseUrl).href

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

  return JSON.stringify(unique)
}

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

export const scrape = async ({
  siteUrl,
  selector,
}: {
  siteUrl: string
  selector: string
}): Promise<{ siteContent: string; hash: string }> => {
  const delay = store.get('scrapeDelay')
  const browser = await launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()

  try {
    await page.goto(siteUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })

    await page.waitForSelector(selector, { timeout: 10_000 })
    // Not sure the best solution here.
    // For some sites, content loads dynamically after selector appears.
    // Maybe this gets passed in as a param later?
    await new Promise(r => setTimeout(r, delay))

    const rawContent = await page.$eval(selector, (el: Element) => el.outerHTML)
    const siteContent = extractTextAndLinks(rawContent, siteUrl)

    return {
      siteContent,
      hash: hashContent(siteContent),
    }
  } finally {
    await browser.close()
  }
}
