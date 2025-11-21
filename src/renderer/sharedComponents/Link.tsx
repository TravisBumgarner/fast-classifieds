import { IconButton } from '@mui/material'
import { CHANNEL_INVOKES } from '../../shared/types/messages.invokes'
import ipcMessenger from '../ipcMessenger'
import Icon from './Icon'

const Link = ({ url }: { url: string }) => {
  const handleClick = () => {
    ipcMessenger.invoke(CHANNEL_INVOKES.UTILS.OPEN_URL, { url })
  }

  return (
    <IconButton onClick={handleClick} size="small">
      <Icon name="externalLink" size={16} />
    </IconButton>
  )
}

export default Link
