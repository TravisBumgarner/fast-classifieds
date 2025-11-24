import { hashContent } from '../utilities'

/**
 * Currently, a scrape run is hashed, via siteContentHash, promptHash, and jobToJSONPromptHash.
 * If a user alter's a prompt, all the jobs previous discovered will be rediscovered. This is
 * the beginnings of preventing that from happening.
 */

export const generateDuplicationDetectionId = ({
  siteUrl,
  jobUrl,
  jobTitle,
}: {
  siteUrl: string
  jobUrl: string
  jobTitle: string
}) => {
  /**
   * Hypothesis - If a site is small, there will be unique names even if there are not URLs to each job postings.
   *    If a site is large, there will be URLs per job posting.
   *    This algorithm could definitely be improved. For example, if a site posts a "Software Engineer" job today,
   *    and then again in 2 months, it'll be marked as a suspected duplicate.
   */

  if (siteUrl !== jobUrl) {
    return hashContent(jobUrl)
  }

  return hashContent(jobTitle)
}
