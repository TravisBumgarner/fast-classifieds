import Store from 'electron-store'
import { SITE_HTML_TO_JSON_JOBS_PROMPT_DEFAULT } from '../shared/consts'
import type { StoreSchema } from '../shared/types'

const defaults: StoreSchema = {
  openaiApiKey: '',
  openaiModel: 'gpt-5-nano',
  openAiSiteHTMLToJSONJobsPrompt: SITE_HTML_TO_JSON_JOBS_PROMPT_DEFAULT,
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
    openAiSiteHTMLToJSONJobsPrompt: store.get('openAiSiteHTMLToJSONJobsPrompt'),
    changelogLastSeenVersion: store.get('changelogLastSeenVersion'),
    scrapeDelay: store.get('scrapeDelay'),
    showStatusBarProgress: store.get('showStatusBarProgress'),
    onboardingCompleted: store.get('onboardingCompleted'),
  }
  return data
}

export default store
