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
    IMPORT_BULK: 'sites:import-bulk',
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
    CLEAR_LOCAL_STORAGE: 'app:clear-local-storage',
  },
  SCRAPER: {
    START: 'scraper:start',
    GET_PROGRESS: 'scraper:get-progress',
    GET_ACTIVE_RUN: 'scraper:get-active-run',
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
    SKIP_NOT_RECOMMENDED_POSTINGS: 'job-postings:skip-not-recommended-postings',
    GET_SUSPECTED_DUPLICATES: 'job-postings:get-suspected-duplicates',
    GET_DUPLICATE_GROUP: 'job-postings:get-duplicate-group',
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
  'sites:import-progress': {
    total: number
    processed: number
    last?: { url: string; success: boolean | null; error?: string }
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
  [CHANNEL.APP.CLEAR_LOCAL_STORAGE]: {
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
      sites: Array<SiteDTO & { totalJobs: number; promptTitle: string }>
    }
  }
  [CHANNEL.SITES.GET_BY_ID]: {
    args: { id: string }
    result: {
      site: SiteDTO | null
    }
  }
  [CHANNEL.JOB_POSTINGS.SKIP_NOT_RECOMMENDED_POSTINGS]: {
    args: undefined
    result: { success: true } | { success: false; error: string }
  }
  [CHANNEL.SITES.CREATE]: {
    args: NewSiteDTO
    result: { success: true; id: string } | { success: false; error: string }
  }
  [CHANNEL.SITES.IMPORT_BULK]: {
    args: { promptId: string; urls: string[] }
    result: {
      success: boolean
      created: Array<{ url: string; title: string; id: string }>
      failed: Array<{ url: string; error: string }>
    }
  }
  [CHANNEL.SITES.UPDATE]: {
    args: UpdateSiteDTO
    result: { success: true } | { success: false; error: string }
  }
  [CHANNEL.SITES.DELETE]: {
    args: { id: string }
    result: { success: true } | { success: false; error: string }
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
    result: { success: true; id: string } | { success: false; error: string }
  }
  [CHANNEL.PROMPTS.UPDATE]: {
    args: UpdatePromptDTO
    result: { success: true } | { success: false; error: string }
  }
  [CHANNEL.PROMPTS.DELETE]: {
    args: { id: string }
    result: { success: true } | { success: false; error: string }
  }
  [CHANNEL.SCRAPER.START]: {
    args: undefined
    result: { success: true; scrapeRunId: string } | { success: false; error: string }
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
  [CHANNEL.SCRAPER.GET_ACTIVE_RUN]: {
    args: undefined
    result: {
      hasActive: boolean
      scrapeRunId?: string
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
    }
    result:
      | {
          success: true
          jobs: Array<NewJobPostingDTO>
        }
      | {
          success: false
          error: string
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
      suspectedDuplicatesCount: number
    }
  }
  [CHANNEL.JOB_POSTINGS.GET_BY_SITE_ID]: {
    args: { siteId: string }
    result: {
      postings: Array<JobPostingDTO>
    }
  }
  [CHANNEL.JOB_POSTINGS.GET_SUSPECTED_DUPLICATES]: {
    args: undefined
    result: {
      groups: Array<{
        duplicationDetectionId: string
        total: number
        titleSample: string
        siteTitleSample: string
        latestCreatedAt: Date
      }>
    }
  }
  [CHANNEL.JOB_POSTINGS.GET_DUPLICATE_GROUP]: {
    args: { duplicationDetectionId: string }
    result: {
      postings: Array<JobPostingDTO>
    }
  }
  [CHANNEL.JOB_POSTINGS.UPDATE]: {
    args: {
      id: string
      data: Partial<NewJobPostingDTO>
    }
    result: { success: true } | { success: false; error: string }
  }
}
