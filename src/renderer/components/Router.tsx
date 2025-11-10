import { Route, Routes } from 'react-router-dom'
import { ROUTES } from '../consts'
import Postings from '../pages/Postings'
import Prompts from '../pages/Prompts'
import ScrapeRuns from '../pages/ScrapeRuns'
import SiteJobs from '../pages/SiteJobs'
import Sites from '../pages/Sites'

export default function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.postings.href()} element={<Postings />} />
      <Route path={ROUTES.sites.href()} element={<Sites />} />
      <Route path="/sites/:siteId/jobs" element={<SiteJobs />} />
      <Route path={ROUTES.prompts.href()} element={<Prompts />} />
      <Route path={ROUTES.scrapeRuns.href()} element={<ScrapeRuns />} />
    </Routes>
  )
}
