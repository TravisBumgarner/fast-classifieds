// Send and forget from main.

import type { ScraperProgress, SiteProgressDTO } from '.'

export const CHANNEL_INVOKES_FROM_MAIN = {
  SCRAPE: {
    PROGRESS: 'scraper:progress',
    COMPLETE: 'scraper:complete',
  },
} as const

export type FromMain = {
  [CHANNEL_INVOKES_FROM_MAIN.SCRAPE.PROGRESS]: {
    scrapeRunId: string
    progress:
      | {
          status: ScraperProgress
          totalSites: number
          completedSites: number
          sites: Array<SiteProgressDTO>
        }
      | undefined
  }
  [CHANNEL_INVOKES_FROM_MAIN.SCRAPE.COMPLETE]: {
    scrapeRunId: string
    totalNewJobs: number
    successfulSites: number
    failedSites: number
  }
}
