import { useSignals } from '@preact/signals-react/runtime'
import type { FC } from 'react'
import { activeModalSignal } from '../../signals'
import ChangelogModal, { type ChangelogModalProps } from './components/ChangelogModal'
import ConfirmationModal, { type ConfirmationModalProps } from './components/ConfirmationModal'
import DuplicateDetectionModal, { type DuplicateDetectionModalProps } from './components/DuplicateDetectionModal'
import ImportSitesModal, { type ImportSitesModalProps } from './components/ImportSitesModal'
import OnboardingModal, { type OnboardingModalProps } from './components/OnboardingModal'
import PostingModal, { type EditPostingModalProps } from './components/PostingModal'
import PromptModal, { type AddPromptModalProps, type EditPromptModalProps } from './components/PromptModal'
import ScrapeProgressModal, { type ScrapeProgressModalProps } from './components/ScrapeProgressModal'
import SiteModal, { type AddSiteModalProps, type EditSiteModalProps } from './components/SiteModal'
import { MODAL_ID } from './Modal.consts'

export type ActiveModal =
  | ConfirmationModalProps
  | AddSiteModalProps
  | EditSiteModalProps
  | ImportSitesModalProps
  | AddPromptModalProps
  | EditPromptModalProps
  | OnboardingModalProps
  | ScrapeProgressModalProps
  | ChangelogModalProps
  | EditPostingModalProps
  | DuplicateDetectionModalProps

export type ModalId = (typeof MODAL_ID)[keyof typeof MODAL_ID]

const RenderModal: FC = () => {
  useSignals()

  if (!activeModalSignal.value?.id) return null

  switch (activeModalSignal.value.id) {
    case MODAL_ID.CONFIRMATION_MODAL:
      return <ConfirmationModal {...activeModalSignal.value} />
    case MODAL_ID.ADD_SITE_MODAL:
      return <SiteModal {...(activeModalSignal.value as AddSiteModalProps)} />
    case MODAL_ID.EDIT_SITE_MODAL:
      return <SiteModal {...(activeModalSignal.value as EditSiteModalProps)} />
    case MODAL_ID.IMPORT_SITES_MODAL:
      return <ImportSitesModal {...(activeModalSignal.value as ImportSitesModalProps)} />
    case MODAL_ID.ADD_PROMPT_MODAL:
      return <PromptModal {...(activeModalSignal.value as AddPromptModalProps)} />
    case MODAL_ID.EDIT_PROMPT_MODAL:
      return <PromptModal {...(activeModalSignal.value as EditPromptModalProps)} />
    case MODAL_ID.ONBOARDING_MODAL:
      return <OnboardingModal />
    case MODAL_ID.SCRAPE_PROGRESS_MODAL:
      return <ScrapeProgressModal {...(activeModalSignal.value as ScrapeProgressModalProps)} />
    case MODAL_ID.CHANGELOG_MODAL:
      return <ChangelogModal {...(activeModalSignal.value as ChangelogModalProps)} />
    case MODAL_ID.EDIT_POSTING_MODAL:
      return <PostingModal {...(activeModalSignal.value as EditPostingModalProps)} />
    case MODAL_ID.DUPLICATE_POSTINGS_MODAL:
      return <DuplicateDetectionModal {...(activeModalSignal.value as DuplicateDetectionModalProps)} />
    default:
      return null
  }
}

export default RenderModal
