import {
  Box,
  Button,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { CHANNEL } from '../../../../shared/messages.types'
import ipcMessenger from '../../../ipcMessenger'
import { activeModalSignal, onboardingCompletedSignal } from '../../../signals'
import { SPACING } from '../../../styles/consts'
import { MODAL_ID } from '../Modal.consts'
import DefaultModal from './DefaultModal'

export interface OnboardingModalProps {
  id: typeof MODAL_ID.ONBOARDING_MODAL
}

const OnboardingModal = () => {
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      label: 'Get an OpenAI API Key',
      description: (
        <>
          <Typography variant="body2">
            In the menu, go to Settings &gt; OpenAI and enter your API key to
            get started. There are instructions and a link to get your key.
          </Typography>
        </>
      ),
    },
    {
      label: 'Create a Prompt',
      description: (
        <>
          <Typography variant="body2">
            A prompt tells the AI what kind of jobs you&apos;re looking for.
          </Typography>
          <Typography variant="body2">
            <strong>Tip:</strong> Upload your resume to ChatGPT and ask:
            &quot;Take my resume and extract all useful tokens and keywords for
            finding relevant jobs, return this as a prompt I can give you in the
            future..&quot;
          </Typography>
        </>
      ),
    },
    {
      label: 'Add a Site',
      description: (
        <>
          <Typography variant="body2">
            Add company career pages you want to monitor.
          </Typography>
        </>
      ),
    },
    {
      label: 'Run & Review',
      description: (
        <>
          <Typography variant="body2">
            The app will scrape job listings from your sites and use AI to match
            them against your prompts.
          </Typography>
          <Typography variant="body2">
            Review matched jobs, mark them as applied, skipped, or track them
            through the interview process.
          </Typography>
        </>
      ),
    },
  ]

  const handleNext = () => {
    setActiveStep(prevStep => prevStep + 1)
  }

  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1)
  }

  const handleClose = () => {
    activeModalSignal.value = null
    onboardingCompletedSignal.value = true
    ipcMessenger.invoke(CHANNEL.STORE.SET, { onboardingCompleted: true })
  }

  return (
    <DefaultModal title="Welcome to Job Search">
      <Box>
        <Typography variant="body1">
          Let&apos;s get you started finding relevant job opportunities!
        </Typography>

        <Typography variant="body2">
          <strong>Note:</strong> You can re-open this guide anytime from
          Settings.
        </Typography>

        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>{step.description}</Box>
                <Stack direction="row" spacing={SPACING.SMALL.PX}>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    variant="outlined"
                    size="small"
                  >
                    Back
                  </Button>
                  {index === steps.length - 1 ? (
                    <Button
                      onClick={handleClose}
                      variant="contained"
                      size="small"
                    >
                      Get Started
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      variant="contained"
                      size="small"
                    >
                      Next
                    </Button>
                  )}
                </Stack>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {activeStep === steps.length && (
          <Box sx={{ mt: 2 }}>
            <Button onClick={handleClose} variant="contained">
              Get Started
            </Button>
          </Box>
        )}
      </Box>
    </DefaultModal>
  )
}

export default OnboardingModal
