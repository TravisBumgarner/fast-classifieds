// This string is stored in Electron Store. To update it, navigate Settings -> Reset Jobs to JSON Prompt
// Which ya know, might be an issue in the future.
export const SITE_HTML_TO_JSON_JOBS_PROMPT_DEFAULT = `
Extract real job postings found in the scraped content.

For each job posting, provide:
- title (exact from content)
- siteUrl (use real URL; if missing, use SITE_URL)
- location (or "Unknown")
- explanation (why it matches or doesn't match what the user is looking for)
- recommendedByAI (true/false)

Rules:
1. Do NOT invent jobs. Only extract what truly appears in the content.
2. Return ALL jobs. Use recommendedByAI to mark relevance.
3. Use EXACT links found in the content; never fabricate URLs.
4. If no link exists, use SITE_URL.
5. If no jobs exist, return an empty list.
`
