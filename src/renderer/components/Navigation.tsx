import { Tooltip } from '@mui/material'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Toolbar from '@mui/material/Toolbar'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { ROUTES } from '../consts'
import Icon from '../sharedComponents/Icon'
import { MODAL_ID } from '../sharedComponents/Modal/Modal.consts'
import { activeModalSignal } from '../signals'
import { SPACING } from '../styles/consts'

const NAV_ROUTES: Array<keyof typeof ROUTES> = [
  'postings',
  'sites',
  'prompts',
  'scrapeRuns',
]

const Navigation = () => {
  const location = useLocation()

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: SPACING.MEDIUM.PX,
              alignItems: 'center',
            }}
          >
            {NAV_ROUTES.map(key => {
              const route = ROUTES[key]
              const isActive = location.pathname === route.href()

              return (
                <Button
                  size="small"
                  key={key}
                  component={RouterLink}
                  to={route.href()}
                  variant={isActive ? 'contained' : 'text'}
                  color={isActive ? 'primary' : 'inherit'}
                  sx={{
                    minWidth: 'auto',
                    px: 2,
                  }}
                >
                  {route.label}
                </Button>
              )
            })}
          </Box>
          <Box
            sx={{
              display: 'flex',
              gap: SPACING.MEDIUM.PX,
              alignItems: 'center',
            }}
          >
            <Tooltip title={'Settings'}>
              <Button
                onClick={() =>
                  (activeModalSignal.value = { id: MODAL_ID.SETTINGS_MODAL })
                }
              >
                <Icon name="settings" />
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navigation
