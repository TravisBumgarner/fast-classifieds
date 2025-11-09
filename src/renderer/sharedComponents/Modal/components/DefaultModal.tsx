import { Typography } from '@mui/material'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import MUIModal from '@mui/material/Modal'
import type { SxProps } from '@mui/material/styles'
import { useCallback, type FC } from 'react'
import Icon from '../../../sharedComponents/Icon'
import { activeModalSignal } from '../../../signals'
import { SPACING, Z_INDICES } from '../../../styles/consts'
interface ActiveModal {
  children: React.ReactNode | React.ReactNode[]
  closeCallback?: () => void
  sx?: SxProps
  title: string
}

const Modal: FC<ActiveModal> = ({ children, closeCallback, sx, title }) => {
  const handleClose = useCallback(
    (_event: unknown, reason?: string) => {
      if (closeCallback) closeCallback()

      if (reason === 'backdropClick') return
      activeModalSignal.value = null
    },
    [closeCallback],
  )

  return (
    <MUIModal
      sx={{
        maxHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.paper',
        zIndex: Z_INDICES.MODAL,
      }}
      open={activeModalSignal.value !== null}
      onClose={handleClose}
      disableRestoreFocus={true}
      disableEscapeKeyDown={true}
    >
      <Box
        sx={{
          width: '600px',
          maxWidth: '90%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.paper',
          color: 'text.primary',
          padding: SPACING.MEDIUM.PX,
          ...sx,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: SPACING.SMALL.PX,
          }}
        >
          <Typography variant="h5" component="h2">
            {title}
          </Typography>
          <IconButton component="button" onClick={handleClose}>
            <Icon name="close" size={24} />
          </IconButton>
        </Box>
        {children}
      </Box>
    </MUIModal>
  )
}

export default Modal
