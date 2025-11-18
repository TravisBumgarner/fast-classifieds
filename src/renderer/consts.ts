export const ROUTES = {
  postings: {
    href: () => '/',
    label: 'Postings',
    target: '_self',
  },
  sites: {
    href: () => '/sites',
    label: 'Sites',
    target: '_self',
  },
  prompts: {
    href: () => '/prompts',
    label: 'Prompts',
    target: '_self',
  },
  scrapeRuns: {
    href: () => '/scrape-runs',
    label: 'History',
    target: '_self',
  },
  settings: {
    href: () => '/settings',
    label: 'Settings',
    target: '_self',
  },
  debugger: {
    href: (siteId?: string) => `/debugger${siteId ? `?site_id=${siteId}` : ''}`,
    label: 'Debug',
    target: '_self',
  },
} as const

export const QUERY_KEYS = {
  POSTINGS: 'postings',
  PROMPTS: 'prompts',
  SCRAPE_RUNS: 'scrapeRuns',
  SITES: 'sites',
}

export const PAGINATION = {
  DEFAULT_ROWS_PER_PAGE: 10 as number,
  ROWS_PER_PAGE_OPTIONS: [10, 25, 50, 100] as readonly number[],
} as const

export const TOOLTIPS = {
  CSS_SELECTOR:
    "Use the CSS Selector to target the HTML element wrapping all the jobs. Tip: To save on AI costs, use specific selectors like '.careers-list' instead of 'body'.",
  API_KEY: 'Get your API key from https://platform.openai.com/settings/organization/api-keys',
  MODEL: 'View pricing and available models at https://platform.openai.com/docs/pricing',
} as const
