import { z } from 'zod'

export const STATUS = {
  hash_exists: 'hash_exists',
  new_data: 'new_data',
  error: 'error',
}
export type Status = keyof typeof STATUS

export type Site = {
  siteUrl: string
  siteTitle: string
  selector: string
  prompt: string
}

export const JobSchema = z.object({
  title: z.string(),
  siteUrl: z.string(),
  explanation: z.string().optional(),
})

export const JobsResponseSchema = z.array(JobSchema)

export type Job = z.infer<typeof JobSchema>
export type JobsResponse = z.infer<typeof JobsResponseSchema>

export interface StoreSchema {
  openaiApiKey: string
  openaiModel: string
  changelogLastSeenVersion: string | null
  scrapeDelay: number
  showStatusBarProgress: boolean
  onboardingCompleted: boolean
}
