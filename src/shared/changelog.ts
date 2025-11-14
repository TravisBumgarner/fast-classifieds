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
