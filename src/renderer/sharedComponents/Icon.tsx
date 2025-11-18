import { CgDebug } from 'react-icons/cg'
import { FaExternalLinkAlt } from 'react-icons/fa'
import { GiHamburgerMenu } from 'react-icons/gi'
import { IoIosSkipForward, IoMdSettings } from 'react-icons/io'
import { IoInformationCircleOutline } from 'react-icons/io5'
import { LuPartyPopper } from 'react-icons/lu'

import {
  MdAdd,
  MdClose,
  MdDelete,
  MdEdit,
  MdError,
  MdKeyboardArrowDown,
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdKeyboardArrowUp,
} from 'react-icons/md'

export const iconMap = {
  edit: MdEdit,
  menu: GiHamburgerMenu,
  delete: MdDelete,
  add: MdAdd,
  close: MdClose,
  info: IoInformationCircleOutline,
  skip: IoIosSkipForward,
  error: MdError,
  success: LuPartyPopper,
  settings: IoMdSettings,
  debug: CgDebug,
  externalLink: FaExternalLinkAlt,
  down: MdKeyboardArrowDown,
  right: MdKeyboardArrowRight,
  left: MdKeyboardArrowLeft,
  up: MdKeyboardArrowUp,
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
