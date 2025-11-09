import { IconButton } from '@mui/material'
import Icon from './Icon'

const Link = ({ url }: { url: string }) => {
  const handleClick = () => {
    // @ts-expect-error - shell:openExternal is not in typed IPC but is defined in messages.ts
    window.electron.ipcRenderer.invoke('shell:openExternal', url)
  }

  return (
    <IconButton onClick={handleClick} size="small">
      <Icon name="externalLink" size={16} />
    </IconButton>
  )
}

export default Link
