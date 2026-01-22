export interface ChangelogEntry {
  version: string
  date: string
  changes: {
    category: 'New' | 'Improved' | 'Fixed'
    description: string
  }[]
}
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.12.0',
    date: '2026-01-22',
    changes: [
      {
        category: 'Improved',
        description: 'Edit sites from job postings page.',
      },
    ],
  },
  {
    version: '1.11.0',
    date: '2026-01-16',
    changes: [
      {
        category: 'Fixed',
        description: 'Missing package error.',
      },
    ],
  },
  {
    version: '1.10.0',
    date: '2026-01-16',
    changes: [
      {
        category: 'Fixed',
        description: 'Duplicate detection was finding duplicates but not displaying them to the user.',
      },
    ],
  },
  {
    version: '1.9.0',
    date: '2026-01-13',
    changes: [
      {
        category: 'Improved',
        description: 'Better pagination and filtering for job postings.',
      },
    ],
  },
  {
    version: '1.8.0',
    date: '2026-01-12',
    changes: [
      {
        category: 'Improved',
        description: 'Duplicate detection has much higher detection abilities.',
      },
      {
        category: 'New',
        description: 'Bulk site imports now include id as selector if included in the URL',
      },
    ],
  },
  {
    version: '1.7.4',
    date: '2026-01-08',
    changes: [
      {
        category: 'Fixed',
        description: 'Disabled excessive logging to Sentry',
      },
    ],
  },
  {
    version: '1.7.3',
    date: '2025-12-09',
    changes: [
      {
        category: 'New',
        description: 'Automated builds for all operating systems',
      },
    ],
  },
  {
    version: '1.7.2',
    date: '2025-12-09',
    changes: [
      {
        category: 'Fixed',
        description: 'Overhauled scraping infra to simplify new installations',
      },
    ],
  },
  {
    version: '1.7.1',
    date: '2025-12-08',
    changes: [
      {
        category: 'New',
        description: 'Initial Windows and Linux support',
      },
    ],
  },
  {
    version: '1.6.0',
    date: '2025-11-25',
    changes: [
      {
        category: 'Improved',
        description: 'Tables have fixed column widths for better readability',
      },
      {
        category: 'Fixed',
        description: 'Site scraping fail on invalid a tags',
      },
      {
        category: 'Improved',
        description: 'Increased legibility of setup modal',
      },
      {
        category: 'New',
        description: 'Job site notes',
      },
    ],
  },
  {
    version: '1.5.0',
    date: '2025-11-24',
    changes: [
      {
        category: 'Improved',
        description: 'Job postings show date posted',
      },
      {
        category: 'New',
        description: 'Retries for failed scraper tasks',
      },
      {
        category: 'New',
        description: 'Feedback form',
      },
      {
        category: 'Improved',
        description: 'Bulk import experience for sites including better site title detection and progress indicators',
      },
      {
        category: 'Improved',
        description: 'Better errors messages throughout the app',
      },
    ],
  },
  {
    version: '1.4.0',
    date: '2025-11-19',
    changes: [
      {
        category: 'Improved',
        description: 'Job postings now show location, description, and if recommended by AI and why',
      },
      {
        category: 'Improved',
        description: 'Job postings can be edited for when AI does not extract the correct details',
      },
      {
        category: 'New',
        description: 'Duplicate detection for when AI finds the same job twice',
      },
      {
        category: 'Improved',
        description: 'Debugger data is now easier to read',
      },
      {
        category: 'Improved',
        description: 'Debugger site content can be searched',
      },
    ],
  },
  {
    version: '1.3.0',
    date: '2025-11-14',
    changes: [
      {
        category: 'New',
        description: 'YouTube tutorials',
      },
      {
        category: 'New',
        description: 'Support & Marketing Website',
      },
    ],
  },
  {
    version: '1.2.0',
    date: '2025-11-13',
    changes: [
      {
        category: 'New',
        description: 'Contact form',
      },
      {
        category: 'Improved',
        description: 'Debugger tool now supports entire workflow',
      },
      {
        category: 'Improved',
        description: 'Exposed additional settings',
      },
      {
        category: 'Fixed',
        description: 'Prompt not showing when editing a site',
      },
    ],
  },
  {
    version: '1.1.0',
    date: '2025-11-09',
    changes: [
      {
        category: 'New',
        description: 'Open selected job postings in browser',
      },
      {
        category: 'New',
        description: 'Debugger tool for checking scraper issues',
      },
    ],
  },
  {
    version: '1.0.0',
    date: '2025-11-08',
    changes: [
      {
        category: 'New',
        description: 'Initial release',
      },
    ],
  },
]

export const CURRENT_VERSION = CHANGELOG[0].version
export const CHANGELOG_VERSION_KEY = 'changelog_last_seen_version'
