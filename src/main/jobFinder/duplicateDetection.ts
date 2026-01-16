import { JOB_POSTING_DUPLICATE_STATUS, type JobPostingDuplicateStatus } from '../../shared/types'
import queries from '../database/queries'
import { hashContent } from '../utilities'

/* ---------------- utils ---------------- */

const normalize = (v: string) => v.trim().toLowerCase()

const hashJobUrl = (jobUrl: string) => hashContent(normalize(jobUrl))

const hashTitle = (title: string) => hashContent(normalize(title))

const hashTitleDate = (title: string, datePosted: Date) =>
  hashContent(`${normalize(title)}_${datePosted.toISOString()}`)

/* ---------------- build map ---------------- */

/**
 * Detect duplicates in job postings.
 */
export const generateDuplicateHashMapBySite = async () => {
  const existingJobPostings = await queries.getJobPostings({})
  const hashMapBySite: Record<
    string,
    Record<string, { duplicateStatus: JobPostingDuplicateStatus; jobPostingId: string }>
  > = {}

  for (const job of existingJobPostings) {
    const siteKey = normalize(job.siteUrl)
    hashMapBySite[siteKey] ??= {}

    const siteMap = hashMapBySite[siteKey]

    // 1. Unique job URL → confirmed duplicate
    if (job.jobUrl && normalize(job.jobUrl) !== siteKey) {
      siteMap[hashJobUrl(job.jobUrl)] = {
        duplicateStatus: JOB_POSTING_DUPLICATE_STATUS.CONFIRMED_DUPLICATE,
        jobPostingId: job.id,
      }
      continue
    }

    // 2. Title + datePosted → confirmed duplicate
    if (job.datePosted) {
      const hash = hashTitleDate(job.title, job.datePosted)
      siteMap[hash] = { duplicateStatus: JOB_POSTING_DUPLICATE_STATUS.CONFIRMED_DUPLICATE, jobPostingId: job.id }
      continue
    }

    // 3. Title only → suspected duplicate (do not override confirmed)
    const titleHash = hashTitle(job.title)
    siteMap[titleHash] ??= { duplicateStatus: JOB_POSTING_DUPLICATE_STATUS.SUSPECTED_DUPLICATE, jobPostingId: job.id }
  }

  return hashMapBySite
}

/* ---------------- lookup ---------------- */

const getHash = ({
  title,
  jobUrl,
  siteUrl,
  datePosted,
}: {
  title: string
  jobUrl: string
  siteUrl: string
  datePosted: Date | null
}): string => {
  const siteKey = normalize(siteUrl)

  if (jobUrl && normalize(jobUrl) !== siteKey) {
    return hashJobUrl(jobUrl)
  }

  if (datePosted) {
    return hashTitleDate(title, datePosted)
  }

  return hashTitle(title)
}

/**
 * Check if a job is a duplicate against the provided hash maps
 */
export const checkDuplicate = (
  job: {
    title: string
    jobUrl: string
    siteUrl: string
    datePosted: Date | null
  },
  hashMaps: Record<string, Record<string, { duplicateStatus: JobPostingDuplicateStatus; jobPostingId: string }>>,
): { duplicateStatus: JobPostingDuplicateStatus; jobPostingId?: string } => {
  const siteMap = hashMaps[normalize(job.siteUrl)]
  if (!siteMap) return { duplicateStatus: JOB_POSTING_DUPLICATE_STATUS.UNIQUE }

  const hash = getHash(job)
  return siteMap[hash] ?? { duplicateStatus: JOB_POSTING_DUPLICATE_STATUS.UNIQUE }
}
