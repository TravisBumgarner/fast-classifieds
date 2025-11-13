import Store from 'electron-store'

export interface StoreSchema {
  openaiApiKey: string
  openaiModel: string
  changelogLastSeenVersion: string | null
  scrapeDelay: number
  showStatusBarProgress: boolean
  onboardingCompleted: boolean
}

const defaults: StoreSchema = {
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
  changelogLastSeenVersion: null,
  scrapeDelay: 3000,
  showStatusBarProgress: true,
  onboardingCompleted: false,
}

const store = new Store<StoreSchema>({ defaults })

// Helper function to only allow defined keys
export const getStore = () => {
  const data = {
    openaiApiKey: store.get('openaiApiKey'),
    openaiModel: store.get('openaiModel'),
    changelogLastSeenVersion: store.get('changelogLastSeenVersion'),
    scrapeDelay: store.get('scrapeDelay'),
    showStatusBarProgress: store.get('showStatusBarProgress'),
    onboardingCompleted: store.get('onboardingCompleted'),
  }
  return data
}

// Example usage (will error if key is not in StoreSchema):
// getStoreValue('openaiApiKey') // OK
// getStoreValue('goog') // TypeScript error
export default store
