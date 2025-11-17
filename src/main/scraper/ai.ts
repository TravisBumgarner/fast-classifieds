import OpenAI from 'openai'
import type { NewJobPostingDTO, ScrapedContentDTO } from 'src/shared/types'
import { z } from 'zod'
import { renderPrompt } from '../../shared/utils'

const aiJobSchema = z.array(
  z.object({
    company: z.string(),
    title: z.string(),
    siteUrl: z.string(),
    explanation: z.string(),
    location: z.string(),
  }),
)

export async function processText({
  prompt,
  scrapedContent,
  apiKey,
  model,
  siteUrl,
  jobToJSONPrompt,
  siteId,
}: {
  prompt: string
  scrapedContent: ScrapedContentDTO
  apiKey: string
  model: string
  siteUrl: string
  jobToJSONPrompt: string
  siteId: string
}): Promise<{ jobs: NewJobPostingDTO[]; rawResponse: OpenAI.Responses.Response }> {
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please set it in Settings.')
  }

  const client = new OpenAI({ apiKey })

  const response = await client.responses.create({
    model,
    input: renderPrompt({
      prompt,
      scrapedContent,
      siteUrl,
      jobToJSONPrompt,
    }),
  })

  console.log('AI response received', response.output_text)

  const parsed = aiJobSchema.safeParse(JSON.parse(response.output_text || '[]'))

  if (!parsed.success) {
    throw new Error(`Failed to parse AI response: ${parsed.error.message} Response was: ${response.output_text}`)
  }

  return {
    jobs: parsed.data.map((job) => ({ ...job, siteId, status: 'new' })),
    rawResponse: response,
  }
}
