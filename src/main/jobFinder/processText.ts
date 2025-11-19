import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import type { ScrapedContentDTO } from '../../shared/types'
import { renderPrompt } from '../../shared/utils'
import log from '../logger'

const aiJobSchema = z.object({
  title: z.string(),
  jobUrl: z.string(),
  explanation: z.string(),
  location: z.string(),
  recommendedByAI: z.boolean(),
})
type AiJob = z.infer<typeof aiJobSchema>

// Root must be an object
const aiJobsSchema = z.object({
  jobs: z.array(aiJobSchema),
})

export async function processText({
  prompt,
  scrapedContent,
  apiKey,
  model,
  siteUrl,
  jobToJSONPrompt,
}: {
  prompt: string
  scrapedContent: ScrapedContentDTO
  apiKey: string
  model: string
  siteUrl: string
  jobToJSONPrompt: string
  siteId: string
  scrapeRunId: string
}): Promise<{ aiJobs: AiJob[]; rawResponse: OpenAI.Responses.Response }> {
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please set it in Settings.')
  }

  const client = new OpenAI({ apiKey })

  const response = await client.responses.parse({
    model,
    input: renderPrompt({
      prompt,
      scrapedContent,
      siteUrl,
      jobToJSONPrompt,
    }),
    text: {
      format: zodTextFormat(aiJobsSchema, 'jobs'),
    },
  })

  console.log('AI response received', response.output_parsed)

  const parsedJobs = response.output_parsed?.jobs || []

  if (parsedJobs.length === 0) {
    log.info('AI response did not contain any job postings.')
    return { aiJobs: [], rawResponse: response }
  }

  return {
    aiJobs: parsedJobs,
    rawResponse: response,
  }
}
