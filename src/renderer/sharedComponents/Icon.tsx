import { CgDebug } from 'react-icons/cg'
import { FaCheck, FaExternalLinkAlt } from 'react-icons/fa'
import { FaFilterCircleXmark } from 'react-icons/fa6'
import { GiHamburgerMenu } from 'react-icons/gi'
import { IoIosRefresh, IoIosSkipForward, IoMdSettings } from 'react-icons/io'
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
  refresh: IoIosRefresh,
  check: FaCheck,
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
  filterClear: FaFilterCircleXmark,
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
