import { Box } from '@mui/material'

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%', // ensures the page is full height
        minHeight: 0, // REQUIRED for nested flex scrolling
      }}
    >
      {children}
    </Box>
  )
}

export default PageWrapper
