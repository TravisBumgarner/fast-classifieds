// Send and forget from main.

export const CHANNEL_FROM_MAIN = {
  SCRAPE: {
    PROGRESS: 'scraper:progress',
    COMPLETE: 'scraper:complete',
  },
} as const

export type FromMain = {
  [CHANNEL_FROM_MAIN.SCRAPE.PROGRESS]: undefined
  [CHANNEL_FROM_MAIN.SCRAPE.COMPLETE]: {
    scrapeRunId: string
    totalNewJobs: number
    successfulSites: number
    failedSites: number
  }
}
