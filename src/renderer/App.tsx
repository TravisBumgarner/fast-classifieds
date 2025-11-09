import { Box } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { CHANGELOG_VERSION_KEY, CURRENT_VERSION } from '../shared/changelog'
import Navigation from './components/Navigation'
import Router from './components/Router'
import RenderModal from './sharedComponents/Modal'
import { MODAL_ID } from './sharedComponents/Modal/Modal.consts'
import { activeModalSignal } from './signals'
import AppThemeProvider from './styles/Theme'
import { SPACING } from './styles/consts'

const queryClient = new QueryClient()

function App() {
  useEffect(() => {
    // Check if we should show the changelog
    const lastSeenVersion = localStorage.getItem(CHANGELOG_VERSION_KEY)

    if (lastSeenVersion !== CURRENT_VERSION) {
      // Show changelog modal after a short delay to let the app render
      setTimeout(() => {
        activeModalSignal.value = {
          id: MODAL_ID.CHANGELOG_MODAL,
          showLatestOnly: true,
        }
        // Update the last seen version
        localStorage.setItem(CHANGELOG_VERSION_KEY, CURRENT_VERSION)
      }, 500)
    }
  }, [])

  return (
    <>
      <Navigation />
      <Box
        sx={{
          padding: SPACING.SMALL.PX,
          height: '100%',
          paddingBottom: '20px', // Lazy way to ensure content is visible.
        }}
      >
        <Router />
      </Box>
      <RenderModal />
    </>
  )
}

const WrappedApp = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <MemoryRouter>
        <AppThemeProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </AppThemeProvider>
      </MemoryRouter>
    </Box>
  )
}

export default WrappedApp
