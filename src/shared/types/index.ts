import type { KnownModel } from '../consts'

export type PartialWithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

type TimestampsAndID = {
  id: string
  createdAt: Date
  updatedAt: Date
}

export const AI_RECOMMENDATION_STATUS = {
  RECOMMENDED: 'recommended',
  NOT_RECOMMENDED: 'not_recommended',
  HUMAN_OVERRIDE: 'human_override',
} as const
export type AIRecommendationStatus = (typeof AI_RECOMMENDATION_STATUS)[keyof typeof AI_RECOMMENDATION_STATUS]

export const JOB_POSTING_DUPLICATE_STATUS = {
  UNIQUE: 'unique',
  SUSPECTED_DUPLICATE: 'suspected_duplicate',
  CONFIRMED_DUPLICATE: 'confirmed_duplicate',
} as const
export type JobPostingDuplicateStatus = (typeof JOB_POSTING_DUPLICATE_STATUS)[keyof typeof JOB_POSTING_DUPLICATE_STATUS]

export const JOB_POSTING_STATUS = {
  NEW: 'new',
  APPLIED: 'applied',
  INTERVIEW: 'interview',
  OFFER: 'offer',
  REJECTED: 'rejected',
  SKIPPED: 'skipped',
} as const
export type JobPostingStatus = (typeof JOB_POSTING_STATUS)[keyof typeof JOB_POSTING_STATUS]

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
  responseId: string | null
  actualModel: string
  userSelectedModel: string
  createdAt: Date
  status: string | null
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cachedTokens: number | null
  reasoningTokens: number | null
  prompt: string
  siteContent: string
  siteUrl: string
  siteTitle: string
  outputText: string
  temperature: number | null
  servicetier: string | null
  reasoningEffort: string | null
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
  jobUrl: string
  siteId: string
  recommendationExplanation: string
  description: string
  location: string
  status: JobPostingStatus
  scrapeRunId: string
  datePosted?: Date | null
  aiRecommendationStatus: AIRecommendationStatus
  duplicationDetectionId: string
  duplicateStatus: JobPostingDuplicateStatus
}
export type JobPostingDTO = { siteTitle: string } & NewJobPostingDTO & TimestampsAndID

export interface StoreSchema {
  openaiApiKey: string
  selectedModel: KnownModel
  customModels: KnownModel[]
  changelogLastSeenVersion: string | null
  scrapeDelay: number
  showStatusBarProgress: boolean
  onboardingCompleted: boolean
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
  result: ScraperTaskResult
  newPostingsFound: number
  errorMessage?: string | null
  completedAt?: Date | null
}

export type ScrapeTaskDTO = NewScrapeTaskDTO & TimestampsAndID

export type NewScrapeRunDTO = {
  status: ScrapeRunStatus
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

export const SCRAPER_RUN_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const
export type ScraperRunStatus = keyof typeof SCRAPER_RUN_STATUS

export const SCRAPER_TASK_RESULT = {
  HASH_EXISTS: 'HASH_EXISTS',
  NEW_DATA: 'NEW_DATA',
  ERROR: 'ERROR',
} as const
export type ScraperTaskResult = keyof typeof SCRAPER_TASK_RESULT

export const SCRAPER_TASK_STATUS = {
  PENDING: 'PENDING',
  SCRAPING: 'SCRAPING',
  PROCESSING: 'PROCESSING',
  COMPLETE: 'COMPLETE',
  ERROR: 'ERROR',
} as const
export type ScraperTaskProgress = keyof typeof SCRAPER_TASK_STATUS

export type ScraperTask = {
  siteId: string
  siteUrl: string
  siteTitle: string
  status: ScraperTaskProgress
  newJobsFound?: number
  errorMessage?: string
}

export const SCRAPE_RUN_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const
export type ScrapeRunStatus = keyof typeof SCRAPE_RUN_STATUS
