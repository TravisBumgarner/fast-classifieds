// Send and forget from main.

import type { ScraperRunProgress, ScraperTask } from '.'

export const CHANNEL_FROM_MAIN = {
  SCRAPE: {
    PROGRESS: 'scraper:progress',
    COMPLETE: 'scraper:complete',
  },
} as const

export type FromMain = {
  [CHANNEL_FROM_MAIN.SCRAPE.PROGRESS]: {
    scrapeRunId: string
    progress:
      | {
          status: ScraperRunProgress
          totalSites: number
          completedSites: number
          sites: Array<ScraperTask>
        }
      | undefined
  }
  [CHANNEL_FROM_MAIN.SCRAPE.COMPLETE]: {
    scrapeRunId: string
    totalNewJobs: number
    successfulSites: number
    failedSites: number
  }
}
