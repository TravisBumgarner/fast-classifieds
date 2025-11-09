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

export const TOOLTIPS = {
  CSS_SELECTOR:
    "Use the CSS Selector to target the HTML element wrapping all the jobs. Tip: To save on AI costs, use specific selectors like '.careers-list' instead of 'body'.",
  API_KEY:
    'Get your API key from https://platform.openai.com/settings/organization/api-keys',
  MODEL:
    'View pricing and available models at https://platform.openai.com/docs/pricing',
} as const
