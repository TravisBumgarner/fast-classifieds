import { BiCollapseVertical, BiExpandVertical } from 'react-icons/bi'
import { CgDetailsMore } from 'react-icons/cg'
import { FaThList } from 'react-icons/fa'
import { FaBottleWater } from 'react-icons/fa6'
import { IoMdCheckbox, IoMdSettings, IoMdWarning } from 'react-icons/io'
import { IoInformationCircleOutline } from 'react-icons/io5'
import { LuPartyPopper } from 'react-icons/lu'

import {
  MdAdd,
  MdClose,
  MdDelete,
  MdEdit,
  MdError,
  MdOutlineCheckBoxOutlineBlank,
} from 'react-icons/md'

export const iconMap = {
  edit: MdEdit,
  delete: MdDelete,
  add: MdAdd,
  // checkbox: IoMdCheckbox,
  // checkboxOutline: MdOutlineCheckBoxOutlineBlank,
  // recipe: FaThList,
  // ingredient: FaBottleWater,
  close: MdClose,
  // warning: IoMdWarning,
  info: IoInformationCircleOutline,
  error: MdError,
  success: LuPartyPopper,
  // expandVertical: BiExpandVertical,
  // collapseVertical: BiCollapseVertical,
  // details: CgDetailsMore,
  settings: IoMdSettings,
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
