import { db } from './client'
import queries from './queries'
import { prompts, sites } from './schema'

export async function backfill() {
  console.log('Backfilling…')
  const existingPrompts = (await db.select().from(prompts).all().length) > 0
  const existingSites = (await db.select().from(sites).all().length) > 0

  if (existingPrompts || existingSites) {
    console.log('Backfill not needed')
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
  console.log('Inserted site')

  console.log('Done')
}

// allow running directly
if (require.main === module) {
  backfill().then(() => process.exit(0))
}
