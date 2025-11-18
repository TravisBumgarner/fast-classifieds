export type PartialWithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

type TimestampsAndID = {
  id: string
  createdAt: Date
  updatedAt: Date
}

export const POSTING_STATUS = {
  NEW: 'new',
  APPLIED: 'applied',
  INTERVIEW: 'interview',
  OFFER: 'offer',
  REJECTED: 'rejected',
  SKIPPED: 'skipped',
} as const
export type PostingStatus = (typeof POSTING_STATUS)[keyof typeof POSTING_STATUS]

export const STATUS = {
  hash_exists: 'hash_exists',
  new_data: 'new_data',
  error: 'error',
}
export type Status = keyof typeof STATUS

export const SITE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const
export type SiteStatus = (typeof SITE_STATUS)[keyof typeof SITE_STATUS]

export type NewHashDTO = {
  siteContentHash: string
  promptHash: string
  siteId: string
  jobToJSONPromptHash: string
}

export type HashDTO = NewHashDTO & TimestampsAndID

export type ApiUsageDTO = {
  id: string
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
  promptId: string
  selector: string
  status: SiteStatus
}

export type SiteDTO = NewSiteDTO & TimestampsAndID

export type UpdateSiteDTO = {
  id: string
  siteTitle: string
  siteUrl: string
  promptId: string
  selector: string
  status: SiteStatus
}

export type NewJobPostingDTO = {
  title: string
  siteUrl: string
  siteId: string
  explanation: string
  location: string
  status: PostingStatus
  scrapeRunId: string
}
export type JobPostingDTO = { siteTitle: string } & NewJobPostingDTO & TimestampsAndID

export interface StoreSchema {
  openaiApiKey: string
  openaiModel: string
  changelogLastSeenVersion: string | null
  scrapeDelay: number
  showStatusBarProgress: boolean
  onboardingCompleted: boolean
  openAiSiteHTMLToJSONJobsPrompt: string
}

export const PROMPT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const
export type PromptStatus = (typeof PROMPT_STATUS)[keyof typeof PROMPT_STATUS]
export interface NewPromptDTO {
  title: string
  content: string
  status: PromptStatus
}

export interface UpdatePromptDTO {
  id: string
  title: string
  content: string
  status: PromptStatus
}

export interface PromptDTO extends NewPromptDTO {
  id: string
  createdAt: Date
  updatedAt: Date
}

export type NewScrapeTaskDTO = {
  scrapeRunId: string
  siteId: string
  siteUrl: string
  status: Status
  newPostingsFound: number
  errorMessage?: string | null
  completedAt?: Date | null
}

export type ScrapeTaskDTO = NewScrapeTaskDTO & TimestampsAndID

export type NewScrapeRunDTO = {
  status: Status
  totalSites: number
  successfulSites: number
  failedSites: number
  comments?: string | null
  completedAt?: Date | null
}

export type ScrapedContentDTO = {
  text: string
  link: string | null
}[]

export type ScrapeRunDTO = NewScrapeRunDTO & TimestampsAndID
