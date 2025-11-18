import { Box } from '@mui/material'
import * as Sentry from '@sentry/electron/renderer'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Navigation from './components/Navigation'
import Router from './components/Router'
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
