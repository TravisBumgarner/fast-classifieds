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
