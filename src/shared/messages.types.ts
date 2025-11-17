import type {
  ApiUsageDTO,
  HashDTO,
  JobDTO,
  NewPromptDTO,
  NewSiteDTO,
  PromptDTO,
  ScrapeRunDTO,
  ScrapeTaskDTO,
  SiteDTO,
  StoreSchema,
  UpdatePromptDTO,
  UpdateSiteDTO,
} from '../shared/types'

export const CHANNEL = {
  SITES: {
    GET_ALL: 'sites:get-all',
    GET_ALL_WITH_JOB_COUNTS: 'sites:get-all-with-job-counts',
    GET_BY_ID: 'sites:get-by-id',
    CREATE: 'sites:create',
    UPDATE: 'sites:update',
    DELETE: 'sites:delete',
  },
  STORE: {
    GET: 'store:get',
    SET: 'store:set',
  },
  PROMPTS: {
    GET_ALL: 'prompts:get-all',
    GET_BY_ID: 'prompts:get-by-id',
    CREATE: 'prompts:create',
    UPDATE: 'prompts:update',
    DELETE: 'prompts:delete',
  },
  APP: {
    GET_BACKUP_DIRECTORY: 'app:get-backup-directory',
    EXPORT_ALL_DATA: 'app:export-all-data',
    RESTORE_ALL_DATA: 'app:restore-all-data',
    NUKE_DATABASE: 'app:nuke-database',
  },
  SCRAPER: {
    START: 'scraper:start',
    RETRY: 'scraper:retry',
    GET_PROGRESS: 'scraper:get-progress',
  },
  DEBUG: {
    SCRAPE: 'debug:scrape',
    AI: 'debug:ai',
  },
  SCRAPE_RUNS: {
    GET_ALL: 'scrape-runs:get-all',
    GET_TASKS: 'scrape-runs:get-tasks',
  },
  JOB_POSTINGS: {
    GET_ALL: 'job-postings:get-all',
    GET_BY_SITE_ID: 'job-postings:get-by-site-id',
    UPDATE_STATUS: 'job-postings:update-status',
  },
} as const

export type FromRenderer = {
  'does-not-exist': { id: number }
}

export type FromMain = {
  'does-not-exist': { ok: boolean; id: number }
  'scraper:progress': {
    scrapeRunId: number
    progress: {
      status: 'pending' | 'in_progress' | 'completed' | 'failed'
      totalSites: number
      completedSites: number
      sites: Array<{
        siteId: number
        siteTitle: string
        siteUrl: string
        status: 'pending' | 'scraping' | 'processing' | 'complete' | 'error'
        newJobsFound?: number
        errorMessage?: string
      }>
    }
  }
  'scraper:complete': {
    scrapeRunId: number
    totalNewJobs: number
    successfulSites: number
    failedSites: number
  }
}

export type Invokes = {
  [CHANNEL.STORE.GET]: {
    args: undefined
    result: StoreSchema
  }
  [CHANNEL.STORE.SET]: {
    args: Partial<StoreSchema>
    result: { success: boolean }
  }
  [CHANNEL.APP.GET_BACKUP_DIRECTORY]: {
    args: undefined
    result: { backupDirectory: string }
  }
  [CHANNEL.APP.EXPORT_ALL_DATA]: {
    args: undefined
    result: {
      success: boolean
      data?: {
        sites: Array<SiteDTO>
        prompts: Array<PromptDTO>
        jobPostings: Array<JobDTO>
        scrapeRuns: Array<ScrapeRunDTO>
        scrapeTasks: Array<ScrapeTaskDTO>
      }
      error?: string
    }
  }
  [CHANNEL.APP.RESTORE_ALL_DATA]: {
    args: {
      data: {
        sites: Array<SiteDTO>
        prompts: Array<PromptDTO>
        jobPostings: Array<JobDTO>
        scrapeRuns: Array<ScrapeRunDTO>
        scrapeTasks: Array<ScrapeTaskDTO>
        hashes: Array<HashDTO>
        apiUsage: Array<ApiUsageDTO>
      }
    }
    result: { success: boolean; error?: string }
  }
  [CHANNEL.APP.NUKE_DATABASE]: {
    args: undefined
    result: { success: boolean; error?: string }
  }
  [CHANNEL.SITES.GET_ALL]: {
    args: undefined
    result: {
      sites: Array<SiteDTO>
    }
  }
  [CHANNEL.SITES.GET_ALL_WITH_JOB_COUNTS]: {
    args: undefined
    result: {
      sites: Array<SiteDTO & { totalJobs: number }>
    }
  }
  [CHANNEL.SITES.GET_BY_ID]: {
    args: { id: number }
    result: {
      site: SiteDTO | null
    }
  }
  [CHANNEL.SITES.CREATE]: {
    args: NewSiteDTO
    result: { success: boolean; id?: number; error?: string }
  }
  [CHANNEL.SITES.UPDATE]: {
    args: UpdateSiteDTO
    result: { success: boolean; error?: string }
  }
  [CHANNEL.SITES.DELETE]: {
    args: { id: number }
    result: { success: boolean; error?: string }
  }
  [CHANNEL.PROMPTS.GET_ALL]: {
    args: undefined
    result: {
      prompts: Array<PromptDTO>
    }
  }
  [CHANNEL.PROMPTS.GET_BY_ID]: {
    args: { id: number }
    result: {
      prompt: PromptDTO | null
    }
  }
  [CHANNEL.PROMPTS.CREATE]: {
    args: NewPromptDTO
    result: { success: boolean; id?: number; error?: string }
  }
  [CHANNEL.PROMPTS.UPDATE]: {
    args: UpdatePromptDTO
    result: { success: boolean; error?: string }
  }
  [CHANNEL.PROMPTS.DELETE]: {
    args: { id: number }
    result: { success: boolean; error?: string }
  }
  [CHANNEL.SCRAPER.START]: {
    args: undefined
    result: { success: boolean; scrapeRunId?: number; error?: string }
  }
  [CHANNEL.SCRAPER.RETRY]: {
    args: { scrapeRunId: number }
    result: { success: boolean; scrapeRunId?: number; error?: string }
  }
  [CHANNEL.SCRAPER.GET_PROGRESS]: {
    args: { scrapeRunId: number }
    result: {
      success: boolean
      progress?: {
        status: 'pending' | 'in_progress' | 'completed' | 'failed'
        totalSites: number
        completedSites: number
        sites: Array<{
          siteId: number
          siteTitle: string
          siteUrl: string
          status: 'pending' | 'scraping' | 'processing' | 'complete' | 'error'
          newJobsFound?: number
          errorMessage?: string
        }>
      }
      error?: string
    }
  }
  [CHANNEL.DEBUG.SCRAPE]: {
    args: { url: string; selector: string }
    result: { success: boolean; html?: string; error?: string }
  }
  [CHANNEL.DEBUG.AI]: {
    args: {
      prompt: string
      siteContent: string
      siteUrl: string
      jobToJSONPrompt: string
    }
    result: {
      success: boolean
      jobs?: Array<JobDTO>
      rawResponse?: unknown
      error?: string
    }
  }
  [CHANNEL.SCRAPE_RUNS.GET_ALL]: {
    args: undefined
    result: {
      runs: Array<ScrapeRunDTO>
    }
  }
  [CHANNEL.SCRAPE_RUNS.GET_TASKS]: {
    args: { scrapeRunId: number }
    result: {
      tasks: Array<ScrapeTaskDTO>
    }
  }
  [CHANNEL.JOB_POSTINGS.GET_ALL]: {
    args: undefined
    result: {
      postings: Array<{
        id: number
        title: string
        siteUrl: string
        siteId?: number | null
        explanation?: string | null
        status: 'new' | 'applied' | 'skipped' | 'interview' | 'rejected' | 'offer'
        createdAt: Date
        updatedAt: Date
      }>
    }
  }
  [CHANNEL.JOB_POSTINGS.GET_BY_SITE_ID]: {
    args: { siteId: number }
    result: {
      postings: Array<{
        id: number
        title: string
        siteUrl: string
        siteId?: number | null
        explanation?: string | null
        status: 'new' | 'applied' | 'skipped' | 'interview' | 'rejected' | 'offer'
        createdAt: Date
        updatedAt: Date
      }>
    }
  }
  [CHANNEL.JOB_POSTINGS.UPDATE_STATUS]: {
    args: {
      id: number
      status: 'new' | 'applied' | 'skipped' | 'interview' | 'rejected' | 'offer'
    }
    result: { success: boolean; error?: string }
  }
}
