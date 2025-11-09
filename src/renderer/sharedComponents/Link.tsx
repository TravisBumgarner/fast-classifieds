import { Link as MUILink } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

const Link = ({
  to,
  children,
  target,
  rel,
}: {
  to: string
  children: React.ReactNode
  target?: string
  rel?: string
}) => {
  return (
    <MUILink component={RouterLink} to={to} target={target} rel={rel}>
      {children}
    </MUILink>
  )
}

export default Link
