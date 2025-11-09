import { type FC } from 'react'

import { useSignals } from '@preact/signals-react/runtime'
import { activeModalSignal } from '../../signals'
import ChangelogModal, {
  type ChangelogModalProps,
} from './components/ChangelogModal'
import ConfirmationModal, {
  type ConfirmationModalProps,
} from './components/ConfirmationModal'
import DebugScrapeModal from './components/DebugScrapeModal'
import ImportSitesModal, {
  type ImportSitesModalProps,
} from './components/ImportSitesModal'
import OnboardingModal, {
  type OnboardingModalProps,
} from './components/OnboardingModal'
import PromptModal, {
  type AddPromptModalProps,
  type EditPromptModalProps,
} from './components/PromptModal'
import ScrapeProgressModal, {
  type ScrapeProgressModalProps,
} from './components/ScrapeProgressModal'
import SettingsModal, { SettingsModalProps } from './components/Settings'
import SiteModal, {
  AddSiteModalProps,
  EditSiteModalProps,
} from './components/SiteModal'
import { MODAL_ID } from './Modal.consts'

export type DebugScrapeModalProps = {
  id: typeof MODAL_ID.DEBUG_SCRAPE_MODAL
  siteId?: number
}

export type ActiveModal =
  | ConfirmationModalProps
  | SettingsModalProps
  | AddSiteModalProps
  | EditSiteModalProps
  | ImportSitesModalProps
  | AddPromptModalProps
  | EditPromptModalProps
  | OnboardingModalProps
  | ScrapeProgressModalProps
  | ChangelogModalProps
  | DebugScrapeModalProps

export type ModalId = (typeof MODAL_ID)[keyof typeof MODAL_ID]

const RenderModal: FC = () => {
  useSignals()

  if (!activeModalSignal.value?.id) return null

  switch (activeModalSignal.value.id) {
    case MODAL_ID.CONFIRMATION_MODAL:
      return <ConfirmationModal {...activeModalSignal.value} />
    case MODAL_ID.SETTINGS_MODAL:
      return <SettingsModal {...activeModalSignal.value} />
    case MODAL_ID.ADD_SITE_MODAL:
      return <SiteModal {...(activeModalSignal.value as AddSiteModalProps)} />
    case MODAL_ID.EDIT_SITE_MODAL:
      return <SiteModal {...(activeModalSignal.value as EditSiteModalProps)} />
    case MODAL_ID.IMPORT_SITES_MODAL:
      return (
        <ImportSitesModal
          {...(activeModalSignal.value as ImportSitesModalProps)}
        />
      )
    case MODAL_ID.ADD_PROMPT_MODAL:
      return (
        <PromptModal {...(activeModalSignal.value as AddPromptModalProps)} />
      )
    case MODAL_ID.EDIT_PROMPT_MODAL:
      return (
        <PromptModal {...(activeModalSignal.value as EditPromptModalProps)} />
      )
    case MODAL_ID.ONBOARDING_MODAL:
      return <OnboardingModal />
    case MODAL_ID.SCRAPE_PROGRESS_MODAL:
      return (
        <ScrapeProgressModal
          {...(activeModalSignal.value as ScrapeProgressModalProps)}
        />
      )
    case MODAL_ID.CHANGELOG_MODAL:
      return (
        <ChangelogModal {...(activeModalSignal.value as ChangelogModalProps)} />
      )
    case MODAL_ID.DEBUG_SCRAPE_MODAL:
      return (
        <DebugScrapeModal
          {...(activeModalSignal.value as DebugScrapeModalProps)}
        />
      )
    default:
      return null
  }
}

export default RenderModal
