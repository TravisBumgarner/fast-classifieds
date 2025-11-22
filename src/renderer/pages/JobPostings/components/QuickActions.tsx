import { Button, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { CHANNEL_INVOKES } from '../../../../shared/types/messages.invokes'
import { QUERY_KEYS } from '../../../consts'
import ipcMessenger from '../../../ipcMessenger'
import Icon from '../../../sharedComponents/Icon'
import { MODAL_ID } from '../../../sharedComponents/Modal/Modal.consts'
import { activeModalSignal } from '../../../signals'

const QuickActions = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const queryClient = useQueryClient()

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleSkipNotRecommended = () => {
    activeModalSignal.value = {
      id: MODAL_ID.CONFIRMATION_MODAL,
      title: "Skip all 'Not Recommended' listings?",
      body: "Are you sure you want to skip all job postings marked as 'Not Recommended'? This action cannot be undone.",
      confirmationCallback: async () => {
        await ipcMessenger.invoke(CHANNEL_INVOKES.JOB_POSTINGS.SKIP_NOT_RECOMMENDED_POSTINGS, undefined)
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.JOB_POSTINGS] })
      },
    }
    handleMenuClose()
  }

  return (
    <>
      <Button variant="outlined" onClick={handleMenuOpen} startIcon={<Icon name="menu" />}>
        Quick Actions
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
        <MenuItem onClick={handleSkipNotRecommended}>
          <ListItemIcon>
            <Icon name="skip" />
          </ListItemIcon>
          <ListItemText primary="Skip all 'Not Recommended' listings" />
        </MenuItem>
      </Menu>
    </>
  )
}

export default QuickActions
