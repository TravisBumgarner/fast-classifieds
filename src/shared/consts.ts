// This string is stored in Electron Store. To update it, navigate Settings -> Reset Jobs to JSON Prompt
// Which ya know, might be an issue in the future.
export const SITE_HTML_TO_JSON_JOBS_PROMPT_DEFAULT = `CRITICAL: Extract ONLY real job postings that actually exist in the provided content.

Return a JSON array of objects with this structure:
 - location: string (job location) - Default to "Unknown" if not found
 - title: string (exact job title from the content)
 - siteUrl: string (the ACTUAL URL from the content - DO NOT make up URLs, use the exact link found)
 - explanation: string (brief why this matches the criteria)
 - recommendedByAI: boolean (true if you think this is a good match, false otherwise)

Rules:
0. DO NOT filter out any jobs. Always return EVERY job posting found. Use recommendedByAI to mark relevance.
1. Extract ONLY jobs that are actually present in the scraped content
2. Present all jobs to the user, even if you are unsure, make proper use of the recommendedByAI field
3. Use the EXACT URLs found in the content
4. If no URL is found for a job, use the base SITE_URL provided
5. DO NOT create fake/placeholder URLs like "example.com"
6. Return empty array [] if no matching jobs are found`
