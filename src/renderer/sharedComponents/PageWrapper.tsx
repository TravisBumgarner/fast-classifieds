import { Box } from '@mui/material'

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {children}
    </Box>
  )
}

export default PageWrapper
