import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useCallback } from 'react'
import { activeModalSignal } from '../../../signals'
import { MODAL_ID } from '../Modal.consts'
import DefaultModal from './DefaultModal'

export interface ConfirmationModalProps {
  id: typeof MODAL_ID.CONFIRMATION_MODAL
  title: string
  body: string
  confirmationCallback?: () => void
  cancelCallback?: () => void
  isConfirmDestructive?: boolean
  isCancelDestructive?: boolean
  showCancel?: boolean
  overrideConfirmation?: boolean
}

const ConfirmationModal = ({
  title,
  body,
  confirmationCallback,
  cancelCallback,
  overrideConfirmation,
  showCancel,
}: ConfirmationModalProps) => {
  const handleCancel = useCallback(() => {
    cancelCallback?.()
    activeModalSignal.value = null
  }, [cancelCallback])

  const handleConfirm = useCallback(() => {
    confirmationCallback?.()
    if (!overrideConfirmation) {
      activeModalSignal.value = null
    }
  }, [confirmationCallback, overrideConfirmation])

  return (
    <DefaultModal title={title}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Typography variant="body1">{body}</Typography>
        <Box
          sx={{
            display: 'flex',
            gap: '10px',
            flexDirection: 'row',
            justifyContent: 'flex-end',
          }}
        >
          {showCancel && (
            <Button variant="outlined" color="primary" onClick={handleCancel}>
              Cancel
            </Button>
          )}
          <Button variant="contained" color="primary" onClick={handleConfirm}>
            Ok!
          </Button>
        </Box>
      </Box>
    </DefaultModal>
  )
}

export default ConfirmationModal
