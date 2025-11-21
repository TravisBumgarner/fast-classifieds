import { IconButton } from '@mui/material'
import { CHANNEL } from 'src/shared/messages.types'
import ipcMessenger from '../ipcMessenger'
import Icon from './Icon'

const Link = ({ url }: { url: string }) => {
  const handleClick = () => {
    ipcMessenger.invoke(CHANNEL.UTILS.OPEN_URL, { url })
  }

  return (
    <IconButton onClick={handleClick} size="small">
      <Icon name="externalLink" size={16} />
    </IconButton>
  )
}

export default Link
