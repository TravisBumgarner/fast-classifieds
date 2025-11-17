import type {
  ApiUsageDTO,
  HashDTO,
  JobPostingDTO,
  NewJobPostingDTO,
  NewPromptDTO,
  NewSiteDTO,
  PromptDTO,
  ScrapedContentDTO,
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
    UPDATE: 'job-postings:update',
  },
} as const

export type FromRenderer = {
  'does-not-exist': { id: string }
}

export type ScraperProgress = 'pending' | 'in_progress' | 'completed' | 'failed'

export type ScraperSiteProgress = 'pending' | 'scraping' | 'processing' | 'complete' | 'error'

export type SiteProgressDTO = {
  siteId: string
  siteUrl: string
  siteTitle: string
  status: ScraperSiteProgress
  newJobsFound?: number
  errorMessage?: string
}

export type FromMain = {
  'does-not-exist': { ok: boolean; id: string }
  'scraper:progress': {
    scrapeRunId: string
    progress: {
      status: ScraperProgress
      totalSites: number
      completedSites: number
      sites: Array<SiteProgressDTO>
    }
  }
  'scraper:complete': {
    scrapeRunId: string
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
        jobPostings: Array<JobPostingDTO>
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
        jobPostings: Array<JobPostingDTO>
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
    args: { id: string }
    result: {
      site: SiteDTO | null
    }
  }
  [CHANNEL.SITES.CREATE]: {
    args: NewSiteDTO
    result: { success: boolean; id?: string; error?: string }
  }
  [CHANNEL.SITES.UPDATE]: {
    args: UpdateSiteDTO
    result: { success: boolean; error?: string }
  }
  [CHANNEL.SITES.DELETE]: {
    args: { id: string }
    result: { success: boolean; error?: string }
  }
  [CHANNEL.PROMPTS.GET_ALL]: {
    args: undefined
    result: {
      prompts: Array<PromptDTO>
    }
  }
  [CHANNEL.PROMPTS.GET_BY_ID]: {
    args: { id: string }
    result: {
      prompt: PromptDTO | null
    }
  }
  [CHANNEL.PROMPTS.CREATE]: {
    args: NewPromptDTO
    result: { success: boolean; id?: string; error?: string }
  }
  [CHANNEL.PROMPTS.UPDATE]: {
    args: UpdatePromptDTO
    result: { success: boolean; error?: string }
  }
  [CHANNEL.PROMPTS.DELETE]: {
    args: { id: string }
    result: { success: boolean; error?: string }
  }
  [CHANNEL.SCRAPER.START]: {
    args: undefined
    result: { success: boolean; scrapeRunId?: string; error?: string }
  }
  [CHANNEL.SCRAPER.RETRY]: {
    args: { scrapeRunId: string }
    result: { success: boolean; scrapeRunId?: string; error?: string }
  }
  [CHANNEL.SCRAPER.GET_PROGRESS]: {
    args: { scrapeRunId: string }
    result: {
      success: boolean
      progress?: {
        status: ScraperProgress
        totalSites: number
        completedSites: number
        sites: Array<{
          siteId: string
          siteTitle: string
          siteUrl: string
          status: ScraperSiteProgress
          newJobsFound?: number
          errorMessage?: string
        }>
      }
      error?: string
    }
  }
  [CHANNEL.DEBUG.SCRAPE]: {
    args: { url: string; selector: string }
    result: { success: true; scrapedContent: ScrapedContentDTO } | { success: false; error: string }
  }
  [CHANNEL.DEBUG.AI]: {
    args: {
      prompt: string
      scrapedContent: ScrapedContentDTO
      siteUrl: string
      siteId: string
      jobToJSONPrompt: string
    }
    result: {
      success: boolean
      jobs?: Array<NewJobPostingDTO>
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
    args: { scrapeRunId: string }
    result: {
      tasks: Array<ScrapeTaskDTO>
    }
  }
  [CHANNEL.JOB_POSTINGS.GET_ALL]: {
    args: undefined
    result: {
      postings: Array<JobPostingDTO>
    }
  }
  [CHANNEL.JOB_POSTINGS.GET_BY_SITE_ID]: {
    args: { siteId: string }
    result: {
      postings: Array<JobPostingDTO>
    }
  }
  [CHANNEL.JOB_POSTINGS.UPDATE]: {
    args: {
      id: string
      data: Partial<NewJobPostingDTO>
    }
    result: { success: boolean; error?: string }
  }
}
