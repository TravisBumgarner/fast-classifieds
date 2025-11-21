export const SITE_HTML_TO_JSON_JOBS_PROMPT_DEFAULT = `
Extract ALL real job postings found in the scraped content.

For each job posting, provide:
- title (exact from content)
- jobUrl (use real URL; if missing, use SITE_URL)
- location (or "Unknown")
- description (ONLY literal text found immediately around the job in the scraped content; if none exists, use "")
- recommendationExplanation (state why this is or isn't relevant based ONLY on literal words found in the content; no inference)
- aiRecommendationStatus (one of "RECOMMENDED", "NOT_RECOMMENDED")

Rules:
1. Do NOT invent jobs. Only extract what truly appears in the content.
2. Return ALL jobs. Use aiRecommendationStatus to mark relevance.
3. Use EXACT links found in the content; never fabricate URLs.
4. If no link exists, use SITE_URL.
5. If no jobs exist, return an empty list.
6. Do NOT infer, summarize, expand, embellish, or generalize. Use ONLY literal text from the content.
`
