import { CgDebug } from 'react-icons/cg'
import { IoMdSettings } from 'react-icons/io'
import { IoInformationCircleOutline } from 'react-icons/io5'
import { LuPartyPopper } from 'react-icons/lu'
import { MdAdd, MdClose, MdDelete, MdEdit, MdError } from 'react-icons/md'
import { FaExternalLinkAlt } from "react-icons/fa";

export const iconMap = {
  edit: MdEdit,
  delete: MdDelete,
  add: MdAdd,
  close: MdClose,
  info: IoInformationCircleOutline,
  error: MdError,
  success: LuPartyPopper,
  settings: IoMdSettings,
  debug: CgDebug,
  externalLink: FaExternalLinkAlt,
}

const Icon = ({
  name,
  size = 20,
  color = 'currentColor',
}: {
  name: keyof typeof iconMap
  size?: number
  color?: string
}) => {
  const IconComponent = iconMap[name]
  return <IconComponent size={size} color={color} />
}

export default Icon
