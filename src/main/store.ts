import Store from 'electron-store'
import { KNOWN_MODELS } from '../shared/consts'
import type { StoreSchema } from '../shared/types'

const defaults: StoreSchema = {
  anthropicApiKey: '',
  selectedModel: KNOWN_MODELS.find((m) => m.model === 'claude-haiku-4-5') || KNOWN_MODELS[0],
  customModels: [],
  changelogLastSeenVersion: null,
  scrapeDelay: 3000,
  showStatusBarProgress: true,
  onboardingCompleted: false,
}

const store = new Store<StoreSchema>({ defaults })

// Helper function to only allow defined keys
export const getStore = () => {
  const data = {
    anthropicApiKey: store.get('anthropicApiKey'),
    selectedModel: store.get('selectedModel'),
    customModels: store.get('customModels'),
    changelogLastSeenVersion: store.get('changelogLastSeenVersion'),
    scrapeDelay: store.get('scrapeDelay'),
    showStatusBarProgress: store.get('showStatusBarProgress'),
    onboardingCompleted: store.get('onboardingCompleted'),
  }
  return data
}

export default store
