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
