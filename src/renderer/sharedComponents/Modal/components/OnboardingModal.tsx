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
import { activeModalSignal } from '../../../signals'
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
      label: 'Create Prompts',
      description: (
        <>
          <Typography variant="body2">
            First, create prompts that describe the types of jobs you&apos;re
            looking for.
          </Typography>
          <Typography variant="body2">
            <strong>Tip:</strong> Upload your resume to ChatGPT and ask:
            &quot;Take my resume and extract all useful tokens and keywords for
            finding relevant jobs, return as a JSON list.&quot;
          </Typography>
          <Typography variant="body2">
            Then create a prompt like: &quot;I&apos;m looking for jobs that
            match my background. Use the following tokens and keywords to find
            highly relevant roles for me: Full Stack Software Engineer, Senior
            Software Engineer, Tech Lead, React, TypeScript, Remote&quot;
          </Typography>
        </>
      ),
    },
    {
      label: 'Add Sites',
      description: (
        <>
          <Typography variant="body2">
            Add company career pages you want to monitor. For each site
            you&apos;ll need:
          </Typography>
          <Typography variant="body2" component="div">
            • <strong>Site Title:</strong> Company name
            <br />• <strong>URL:</strong> Link to their careers page
            <br />• <strong>CSS Selector:</strong> Target the job listings
            container. Use &quot;body&quot; if unsure, but specific selectors
            save on AI costs.
            <br />• <strong>Prompt:</strong> Select which prompt to use for
            matching
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
          <Typography variant="body2">
            <strong>Note:</strong> You can re-open this guide anytime from
            Settings.
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
  }

  return (
    <DefaultModal title="Welcome to Job Search">
      <Box>
        <Typography variant="body1">
          Let&apos;s get you started finding relevant job opportunities!
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
