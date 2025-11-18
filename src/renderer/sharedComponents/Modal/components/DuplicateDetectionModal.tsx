import type { MODAL_ID } from '../Modal.consts'
import DefaultModal from './DefaultModal'

export type DuplicateDetectionModalProps = {
  id: typeof MODAL_ID.DUPLICATE_POSTINGS_MODAL
}

const DuplicateDetectionModal = (_props: DuplicateDetectionModalProps) => {
  return <DefaultModal title="Duplicate Detection"> Doot doot.</DefaultModal>
}

export default DuplicateDetectionModal
