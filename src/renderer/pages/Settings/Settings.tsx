import { Box, Tab, Tabs, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import type { StoreSchema } from '../../../shared/types'
import { CHANNEL_INVOKES } from '../../../shared/types/messages.invokes'
import ipcMessenger from '../../ipcMessenger'
import PageWrapper from '../../sharedComponents/PageWrapper'
import { SPACING } from '../../styles/consts'
import TabData from './components/TabData'
import TabJobFinder from './components/TabJobFinder'
import TabOpenAI from './components/TabOpenAI'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Settings = () => {
  const [storeFromServer, setStoreFromServer] = useState<StoreSchema | null>(null)

  const [activeTab, setActiveTab] = useState(0)

  const loadStoreSettings = useCallback(async () => {
    const store = await ipcMessenger.invoke(CHANNEL_INVOKES.STORE.GET, undefined)
    setStoreFromServer(store)
  }, [])

  useEffect(() => {
    ;(async () => {
      await loadStoreSettings()
    })()
  }, [loadStoreSettings])

  if (!storeFromServer) {
    return (
      <PageWrapper>
        <Box sx={{ p: SPACING.MEDIUM.PX, display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ ml: SPACING.SMALL.PX }}>
            Loading settings...
          </Typography>
        </Box>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <Box sx={{ minWidth: 500 }}>
        <Tabs
          value={activeTab}
          onChange={(_e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="OpenAI" />
          <Tab label="Job Finder" />
          <Tab label="Data" />
        </Tabs>

        {activeTab === 0 && (
          <TabOpenAI
            initialOpenAiApiKey={storeFromServer.openaiApiKey}
            loadStoreSettings={loadStoreSettings}
            initialSelectedModel={storeFromServer.selectedModel}
            initialCustomModels={storeFromServer.customModels}
          />
        )}

        {activeTab === 1 && (
          <TabJobFinder loadStoreSettings={loadStoreSettings} initialScrapeDelay={storeFromServer.scrapeDelay} />
        )}
        {activeTab === 2 && <TabData />}
      </Box>
    </PageWrapper>
  )
}

export default Settings
