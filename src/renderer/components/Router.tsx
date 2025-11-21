import { Route, Routes } from 'react-router-dom'
import { ROUTES } from '../consts'
import Debugger from '../pages/Debugger'
import Feedback from '../pages/Feedback'
import JobPostings from '../pages/JobPostings/JobPostings'
import NotFound from '../pages/NotFound'
import Prompts from '../pages/Prompts'
import ScrapeRuns from '../pages/ScrapeRuns/ScrapeRuns'
import Settings from '../pages/Settings'
import Sites from '../pages/Sites'

export default function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.postings.href()} element={<JobPostings />} />
      <Route path={ROUTES.settings.href()} element={<Settings />} />
      <Route path={ROUTES.sites.href()} element={<Sites />} />
      <Route path={ROUTES.prompts.href()} element={<Prompts />} />
      <Route path={ROUTES.scrapeRuns.href()} element={<ScrapeRuns />} />
      <Route path={ROUTES.debugger.href()} element={<Debugger />} />
      <Route path={ROUTES.feedback.href()} element={<Feedback />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
