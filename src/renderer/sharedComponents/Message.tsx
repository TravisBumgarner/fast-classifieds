import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

import { useTheme } from '@mui/material/styles'
import { useMemo } from 'react'
import { SPACING } from '../styles/consts'
import Icon from './Icon'

const Message = ({
  message,
  color,
  callback,
  callbackText,
  includeVerticalMargin,
}: {
  message: string
  color: 'info' | 'error' | 'success'
  callback?: () => void
  callbackText?: string
  includeVerticalMargin?: boolean
}) => {
  const theme = useTheme()

  const icon = useMemo(() => {
    if (color === 'error') {
      return <Icon name="error" color={theme.palette.info.main} />
    }
    if (color === 'success') {
      return <Icon name="success" color={theme.palette.info.main} />
    }
    return <Icon name="info" color={theme.palette.info.main} />
  }, [color, theme])

  return (
    <Box
      sx={{
        padding: SPACING.MEDIUM.PX,
        margin: includeVerticalMargin ? `${SPACING.LARGE.PX} 0` : 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        gap: SPACING.MEDIUM.PX,
      }}
    >
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box>{icon}</Box>
        <Typography
          sx={{ marginLeft: SPACING.SMALL.PX }}
          variant="h5"
          color={'info.main'}
        >
          {message}
        </Typography>
      </Box>
      {callback && (
        <Button variant="contained" color={color} onClick={callback}>
          {callbackText}
        </Button>
      )}
    </Box>
  )
}

export default Message
