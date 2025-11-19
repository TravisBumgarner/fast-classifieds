import { Box } from '@mui/material'
import * as Sentry from '@sentry/electron/renderer'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Navigation from './components/Navigation'
import Router from './components/Router'
import { QUERY_KEYS } from './consts'
import useShowChangelog from './hooks/useShowChangelog'
import useShowOnboarding from './hooks/useShowOnboarding'
import RenderModal from './sharedComponents/Modal'
import { SPACING } from './styles/consts'
import AppThemeProvider from './styles/Theme'

Sentry.init({
  dsn: 'https://aa9b99c0da19f5f16cde7295bcae0fa4@o196886.ingest.us.sentry.io/4510360742133760',
})

const queryClient = new QueryClient()

function App() {
  useShowChangelog()
  useShowOnboarding()
  const queryClient = useQueryClient()

  // Invalidate job postings on scrape completion globally
  React.useEffect(() => {
    const unsub = window.electron.ipcRenderer.on('scraper:complete', () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.JOB_POSTINGS] })
    })
    return () => {
      unsub()
    }
  }, [queryClient])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Navigation />
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          marginBottom: SPACING.MEDIUM.PX,
          padding: SPACING.MEDIUM.PX,
        }}
      >
        <Router />
      </Box>
      <RenderModal />
    </Box>
  )
}

const WrappedApp = () => {
  return (
    <MemoryRouter>
      <ErrorBoundary>
        <AppThemeProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </AppThemeProvider>
      </ErrorBoundary>
    </MemoryRouter>
  )
}

export default WrappedApp
