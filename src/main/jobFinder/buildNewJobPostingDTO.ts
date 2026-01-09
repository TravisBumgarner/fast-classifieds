import {
  type AIRecommendationStatus,
  JOB_POSTING_DUPLICATE_STATUS,
  JOB_POSTING_STATUS,
  type JobPostingDuplicateStatus,
  type NewJobPostingDTO,
} from '../../shared/types'

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
  datePosted?: string | null
  duplicateStatus: JobPostingDuplicateStatus | undefined
}): NewJobPostingDTO => {
  return {
    ...job,
    status: JOB_POSTING_STATUS.NEW,
    datePosted: job.datePosted ? new Date(job.datePosted) : null,
    duplicateStatus: job.duplicateStatus || JOB_POSTING_DUPLICATE_STATUS.UNIQUE,
  }
}
