export const ROUTES = {
  home: {
    href: () => '/',
    label: 'Home',
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
    label: 'Run History',
    target: '_self',
  },
} as const

export const QUERY_KEYS = {}
