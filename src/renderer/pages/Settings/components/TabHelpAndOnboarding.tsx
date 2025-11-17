import { Box, Button, Divider, Typography } from '@mui/material'
import { MODAL_ID } from '../../../sharedComponents/Modal/Modal.consts'
import { activeModalSignal } from '../../../signals'
import { SPACING } from '../../../styles/consts'

const TabHelpAndOnboarding = () => {
  const handleOpenOnboarding = () => {
    activeModalSignal.value = { id: MODAL_ID.ONBOARDING_MODAL }
  }

  const handleOpenChangelog = () => {
    activeModalSignal.value = { id: MODAL_ID.CHANGELOG_MODAL, showLatestOnly: false }
  }

  return (
    <Box sx={{ p: SPACING.MEDIUM.PX }}>
      <Typography variant="subtitle2" gutterBottom>
        Getting Started Guide
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: SPACING.SMALL.PX }}>
        View the step-by-step onboarding guide
      </Typography>
      <Button variant="outlined" onClick={handleOpenOnboarding} fullWidth>
        Show Onboarding Guide
      </Button>

      <Divider sx={{ my: SPACING.MEDIUM.PX }} />

      <Typography variant="subtitle2" gutterBottom>
        What&apos;s New
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: SPACING.SMALL.PX }}>
        View the complete changelog of all updates and improvements
      </Typography>
      <Button variant="outlined" onClick={handleOpenChangelog} fullWidth>
        View Changelog
      </Button>
    </Box>
  )
}

export default TabHelpAndOnboarding
