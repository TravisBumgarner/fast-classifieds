import Store from 'electron-store'
import { KNOWN_MODELS } from '../shared/consts'
import type { StoreSchema } from '../shared/types'

const defaults: StoreSchema = {
  openaiApiKey: '',
  selectedModel: KNOWN_MODELS.find((m) => m.model === 'gpt-5-nano') || KNOWN_MODELS[0],
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
    openaiApiKey: store.get('openaiApiKey'),
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
