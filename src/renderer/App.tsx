import { Box } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { CURRENT_VERSION } from '../shared/changelog'
import { CHANNEL } from '../shared/messages.types'
import Navigation from './components/Navigation'
import Router from './components/Router'
import ipcMessenger from './ipcMessenger'
import RenderModal from './sharedComponents/Modal'
import { MODAL_ID } from './sharedComponents/Modal/Modal.consts'
import { activeModalSignal, onboardingCompletedSignal } from './signals'
import AppThemeProvider from './styles/Theme'
import { SPACING } from './styles/consts'

const queryClient = new QueryClient()

function App() {
  useEffect(() => {
    // Wait for onboarding check to complete before showing changelog
    if (!onboardingCompletedSignal.value) return

    ipcMessenger
      .invoke(CHANNEL.STORE.GET, undefined)
      .then(({ changelogLastSeenVersion }) => {
        if (changelogLastSeenVersion !== CURRENT_VERSION) {
          // Show changelog modal after a short delay to let the app render
          setTimeout(() => {
            activeModalSignal.value = {
              id: MODAL_ID.CHANGELOG_MODAL,
              showLatestOnly: true,
            }
            // Update the last seen version
            ipcMessenger.invoke(CHANNEL.STORE.SET, {
              changelogLastSeenVersion: CURRENT_VERSION,
            })
          }, 500)
        }
      })
  }, [])

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
      <AppThemeProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </AppThemeProvider>
    </MemoryRouter>
  )
}

export default WrappedApp
