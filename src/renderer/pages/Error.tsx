import { Typography } from '@mui/material'
import ContactForm from '../sharedComponents/Contact'
import PageWrapper from '../sharedComponents/PageWrapper'

const ErrorPage = () => {
  return (
    <PageWrapper>
      <Typography>500 - Internal Server Error</Typography>
      <Typography>Something went wrong on our end. What were you trying to do?</Typography>
      <ContactForm formSuffix="error-page" />
    </PageWrapper>
  )
}

export default ErrorPage
