import { Stack } from '@mui/material'
import ContactForm from '../sharedComponents/Contact'
import PageWrapper from '../sharedComponents/PageWrapper'

const Feedback: React.FC = () => {
  return (
    <PageWrapper>
      <Stack alignContent="center" justifyContent="center" height="100%">
        <ContactForm formSuffix="feedback" />
      </Stack>
    </PageWrapper>
  )
}

export default Feedback
