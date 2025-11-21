import {
  type AIRecommendationStatus,
  JOB_POSTING_DUPLICATE_STATUS,
  JOB_POSTING_STATUS,
  type NewJobPostingDTO,
} from '../../shared/types'
import { generateDuplicationDetectionId } from './duplicateDetection'

export const buildNewJobPostingDTO = (job: {
  title: string
  jobUrl: string
  recommendationExplanation: string
  description: string
  location: string
  aiRecommendationStatus: AIRecommendationStatus
  siteId: string
  scrapeRunId: string
  siteUrl: string
  existingDuplicationDetectionIds: Set<string>
}): NewJobPostingDTO => {
  const duplicationDetectionId = generateDuplicationDetectionId({
    siteUrl: job.siteUrl,
    jobUrl: job.jobUrl,
    jobTitle: job.title,
  })

  return {
    ...job,
    status: JOB_POSTING_STATUS.NEW,
    duplicationDetectionId,
    duplicateStatus: job.existingDuplicationDetectionIds.has(duplicationDetectionId)
      ? JOB_POSTING_DUPLICATE_STATUS.SUSPECTED_DUPLICATE
      : JOB_POSTING_DUPLICATE_STATUS.UNIQUE,
  }
}
