import logger from '../logger'
import { db } from './client'
import queries from './queries'
import { prompts, sites } from './schema'

export async function backfillDevelopment() {
  logger.info('Backfilling…')
  const existingPrompts = (await db.select().from(prompts).all().length) > 0
  const existingSites = (await db.select().from(sites).all().length) > 0

  if (existingPrompts || existingSites) {
    logger.info('Backfill not needed')
    return
  }

  const prompt = await queries.insertPrompt({
    title: 'Software',
    content: 'Find me software engineering jobs',
    status: 'active',
  })

  await queries.insertSite({
    siteTitle: 'local',
    siteUrl: 'http://acmeco.fake',
    promptId: prompt[0].id,
    selector: 'body',
    status: 'active',
  })
  logger.info('Inserted site')

  logger.info('Done')
}
