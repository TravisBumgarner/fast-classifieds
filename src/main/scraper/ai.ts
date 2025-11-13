import OpenAI from 'openai'
import { z } from 'zod'

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
  jobToJSONPrompt,
}: {
  prompt: string
  siteContent: string
  apiKey: string
  model: string
  siteUrl: string
  jobToJSONPrompt: string
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

${jobToJSONPrompt}
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
