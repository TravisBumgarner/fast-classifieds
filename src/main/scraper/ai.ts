import OpenAI from 'openai'
import { z } from 'zod'

const RESPONSE_PROMPT = `
CRITICAL: Extract ONLY real job postings that actually exist in the provided content.

Return a JSON array of objects with this structure:
 - company: string (company name)
 - title: string (exact job title from the content)
 - siteUrl: string (the ACTUAL URL from the content - DO NOT make up URLs, use the exact link found)
 - explanation?: string (brief why this matches the criteria)

Rules:
1. Extract ONLY jobs that are actually present in the scraped content
2. Use the EXACT URLs found in the content
3. If no URL is found for a job, use the base SITE_URL provided
4. DO NOT create fake/placeholder URLs like "example.com"
5. Return empty array [] if no matching jobs are found
`

const JobSchema = z.object({
  company: z.string().optional(),
  title: z.string(),
  siteUrl: z.string(),
  explanation: z.string().optional(),
})

const JobsResponseSchema = z.array(JobSchema)

export type Job = z.infer<typeof JobSchema>

export async function processText({
  prompt,
  siteContent,
  apiKey,
  model,
  siteUrl,
}: {
  prompt: string
  siteContent: string
  apiKey: string
  model: string
  siteUrl: string
}): Promise<{ jobs: Job[]; rawResponse: OpenAI.Responses.Response }> {
  if (!apiKey) {
    throw new Error(
      'OpenAI API key is not configured. Please set it in Settings.',
    )
  }

  const client = new OpenAI({ apiKey })

  const fullPrompt = `
USER CRITERIA:
${prompt}

SCRAPED CONTENT:
${siteContent}

SITE_URL: ${siteUrl}

${RESPONSE_PROMPT}
`

  const response = await client.responses.create({
    model,
    input: fullPrompt,
  })

  const parsed = JobsResponseSchema.safeParse(
    JSON.parse(response.output_text || '[]'),
  )

  if (!parsed.success) {
    throw new Error(`Failed to parse AI response: ${parsed.error.message}`)
  }

  return {
    jobs: parsed.data,
    rawResponse: response,
  }
}
