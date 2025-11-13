import { Box, Tab, Tabs, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { CHANNEL } from '../../../shared/messages.types'
import { StoreSchema } from '../../../shared/types'
import ipcMessenger from '../../ipcMessenger'
import PageWrapper from '../../sharedComponents/PageWrapper'
import { SPACING } from '../../styles/consts'
import TabData from './components/TabData'
import TabHelpAndOnboarding from './components/TabHelpAndOnboarding'
import TabJobFinder from './components/TabJobFinder'
import TabOpenAI from './components/TabOpenAI'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Settings = () => {
  const [storeFromServer, setStoreFromServer] = useState<StoreSchema | null>(
    null,
  )

  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    const loadStoreSettings = async () => {
      const store = await ipcMessenger.invoke(CHANNEL.STORE.GET, undefined)
      setStoreFromServer(store)
    }

    loadStoreSettings()
  }, [])

  if (!storeFromServer) {
    return (
      <PageWrapper>
        <Box
          sx={{ p: SPACING.MEDIUM.PX, display: 'flex', alignItems: 'center' }}
        >
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
          <Tab label="Help & Onboarding" />
        </Tabs>

        {activeTab === 0 && (
          <TabOpenAI
            initialOpenAiApiKey={storeFromServer.openaiApiKey}
            initialOpenAIModel={storeFromServer.openaiModel}
          />
        )}

        {activeTab === 1 && (
          <TabJobFinder initialScrapeDelay={storeFromServer.scrapeDelay} />
        )}
        {activeTab === 2 && <TabData />}
        {activeTab === 3 && <TabHelpAndOnboarding />}
      </Box>
    </PageWrapper>
  )
}

export default Settings
