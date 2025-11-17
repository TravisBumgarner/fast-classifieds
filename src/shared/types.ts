import { z } from 'zod'

export type PartialWithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

export const STATUS = {
  hash_exists: 'hash_exists',
  new_data: 'new_data',
  error: 'error',
}
export type Status = keyof typeof STATUS

export type SiteStatus = 'active' | 'inactive'

export type HashDTO = {
  id: number
  siteUrl: string
  hash: string
  createdAt: Date
}

export type ApiUsageDTO = {
  id: number
  responseId: string
  model: string
  createdAt: Date
  status: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cachedTokens: number
  reasoningTokens: number
  prompt: string
  siteContent: string
  siteUrl: string
  outputText: string
  temperature: number
  servicetier: string
  reasoningEffort: string
}

export type NewSiteDTO = {
  siteTitle: string
  siteUrl: string
  promptId: number
  selector: string
  status: SiteStatus
}

export type SiteDTO = NewSiteDTO & {
  id: number
  createdAt: Date
  updatedAt: Date
}

export type UpdateSiteDTO = {
  id: number
  siteTitle: string
  siteUrl: string
  promptId: number
  selector: string
  status: SiteStatus
}

export const JobSchema = z.object({
  title: z.string(),
  siteUrl: z.string(),
  explanation: z.string(),
})

export const JobsResponseSchema = z.array(JobSchema)

export type JobDTO = z.infer<typeof JobSchema>
export type JobsResponse = z.infer<typeof JobsResponseSchema>

export interface StoreSchema {
  openaiApiKey: string
  openaiModel: string
  changelogLastSeenVersion: string | null
  scrapeDelay: number
  showStatusBarProgress: boolean
  onboardingCompleted: boolean
  openAiSiteHTMLToJSONJobsPrompt: string
}

export type PromptStatus = 'active' | 'inactive'
export interface NewPromptDTO {
  title: string
  content: string
  status: PromptStatus
}

export interface UpdatePromptDTO {
  id: number
  title: string
  content: string
  status: PromptStatus
}

export interface PromptDTO extends NewPromptDTO {
  id: number
  createdAt: Date
  updatedAt: Date
}

export interface ScrapeTaskDTO {
  id: number
  scrapeRunId: number
  siteId: number
  siteUrl: string
  status: Status
  newPostingsFound: number
  errorMessage?: string | null
  createdAt: Date
  completedAt?: Date | null
}

export interface ScrapeRunDTO {
  id: number
  completedAt?: Date | null
  totalSites: number
  successfulSites: number
  failedSites: number
  status: Status
  createdAt: Date
  comments?: string | null
}
