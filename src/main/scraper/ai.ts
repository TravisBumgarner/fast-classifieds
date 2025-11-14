import OpenAI from 'openai'
import { z } from 'zod'
import { renderPrompt } from '../../shared/utils'

const JobSchema = z.object({
  company: z.string().optional(),
  title: z.string(),
  siteUrl: z.string(),
  explanation: z.string(),
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

  const response = await client.responses.create({
    model,
    input: renderPrompt({
      prompt,
      siteContent,
      siteUrl,
      jobToJSONPrompt,
    }),
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
