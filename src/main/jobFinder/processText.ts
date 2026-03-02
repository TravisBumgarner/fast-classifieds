import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { AI_RECOMMENDATION_STATUS, type ScrapedContentDTO } from '../../shared/types'
import { renderPrompt } from '../../shared/utils'
import log from '../logger'

const aiJobSchema = z.object({
  title: z.string(),
  jobUrl: z.string(),
  description: z.string(),
  recommendationExplanation: z.string(),
  location: z.string(),
  datePosted: z.string().nullable(),
  aiRecommendationStatus: z.enum([AI_RECOMMENDATION_STATUS.RECOMMENDED, AI_RECOMMENDATION_STATUS.NOT_RECOMMENDED]),
})
type AiJob = z.infer<typeof aiJobSchema>

const aiJobsSchema = z.object({
  jobs: z.array(aiJobSchema),
})

const jobsToolSchema = {
  name: 'extract_jobs' as const,
  description: 'Extract job postings from scraped content',
  input_schema: {
    type: 'object' as const,
    properties: {
      jobs: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            title: { type: 'string' as const },
            jobUrl: { type: 'string' as const },
            description: { type: 'string' as const },
            recommendationExplanation: { type: 'string' as const },
            location: { type: 'string' as const },
            datePosted: { type: ['string', 'null'] as const },
            aiRecommendationStatus: {
              type: 'string' as const,
              enum: [AI_RECOMMENDATION_STATUS.RECOMMENDED, AI_RECOMMENDATION_STATUS.NOT_RECOMMENDED],
            },
          },
          required: [
            'title',
            'jobUrl',
            'description',
            'recommendationExplanation',
            'location',
            'datePosted',
            'aiRecommendationStatus',
          ],
        },
      },
    },
    required: ['jobs'],
  },
}

export type AnthropicResponse = Anthropic.Message

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
  datePosted?: string | null
}): Promise<{ aiJobs: AiJob[]; rawResponse: AnthropicResponse }> {
  if (!apiKey) {
    throw new Error('Anthropic API key is not configured. Please set it in Settings.')
  }

  const client = new Anthropic({ apiKey })

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: jobToJSONPrompt,
    tools: [jobsToolSchema],
    tool_choice: { type: 'tool', name: 'extract_jobs' },
    messages: [
      {
        role: 'user',
        content: renderPrompt({
          prompt,
          scrapedContent,
          siteUrl,
          jobToJSONPrompt,
        }),
      },
    ],
  })

  const toolUseBlock = response.content.find((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')

  let parsedJobs: AiJob[] = []
  if (toolUseBlock) {
    const parsed = aiJobsSchema.safeParse(toolUseBlock.input)
    if (parsed.success) {
      parsedJobs = parsed.data.jobs
    } else {
      log.error('Failed to parse tool use response:', parsed.error)
    }
  }

  if (parsedJobs.length === 0) {
    log.info('AI response did not contain any job postings.')
    return { aiJobs: [], rawResponse: response }
  }

  return {
    aiJobs: parsedJobs,
    rawResponse: response,
  }
}
