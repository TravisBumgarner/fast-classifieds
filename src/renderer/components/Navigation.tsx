import { Tooltip, Typography } from '@mui/material'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Toolbar from '@mui/material/Toolbar'
import { useState } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'

import Logo from '../assets/icon.png'
import { ROUTES } from '../consts'
import Icon from '../sharedComponents/Icon'
import { SPACING } from '../styles/consts'

const NAV_ROUTES: Array<keyof typeof ROUTES> = [
  'postings',
  'prompts',
  'sites',
  'scrapeRuns',
  'settings',
  'debugger',
  'feedback',
]

const Navigation = () => {
  const location = useLocation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleExternalLink = (url: string) => {
    handleMenuClose()
    // @ts-expect-error - shell:openExternal is not in typed IPC but is defined in messages.ts
    window.electron.ipcRenderer.invoke('shell:openExternal', url)
  }

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            height: '40px',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              height: '100%',
              display: 'flex',
            }}
          >
            <img src={Logo} alt="Fast Classifieds Logo" style={{ height: '100%', aspectRatio: '1 / 1' }} />
            <Typography variant="body1" sx={{ fontWeight: 'bold', ml: 0.5 }}>
              <sup>Alpha</sup>
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              gap: SPACING.TINY.PX,
              alignItems: 'center',
            }}
          >
            {NAV_ROUTES.map((key) => {
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
                    width: '70px',
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
            <Tooltip title="Menu">
              <IconButton onClick={handleMenuClick}>
                <Icon name="menu" />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={() => handleExternalLink('https://github.com/TravisBumgarner/fast-classifieds')}>
                GitHub
              </MenuItem>
              <MenuItem onClick={() => handleExternalLink('https://travisbumgarner.dev/marketing/classifieds')}>
                Website & Support
              </MenuItem>
              <MenuItem onClick={() => handleExternalLink('https://travisbumgarner.dev/')}>More from Creator</MenuItem>
              <MenuItem onClick={() => handleExternalLink('https://discord.gg/xSZwF7PQ')}>Join the Community</MenuItem>
            </Menu>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navigation
