import type { ScrapedContentDTO } from './types'

export const renderPrompt = ({
  prompt,
  scrapedContent,
  siteUrl,
  jobToJSONPrompt,
}: {
  prompt: string
  scrapedContent: ScrapedContentDTO
  siteUrl: string
  jobToJSONPrompt: string
}) => {
  const fullPrompt = `
USER CRITERIA:
${prompt}

SCRAPED CONTENT:
${JSON.stringify(scrapedContent, null, 2)}

SITE_URL: ${siteUrl}

${jobToJSONPrompt}
        `
  return fullPrompt
}
