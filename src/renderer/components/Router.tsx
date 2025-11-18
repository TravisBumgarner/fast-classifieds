import { Route, Routes } from 'react-router-dom'
import { ROUTES } from '../consts'
import Debugger from '../pages/Debugger/Debugger'
import NotFound from '../pages/NotFound'
import Postings from '../pages/Postings/Postings'
import Prompts from '../pages/Prompts'
import ScrapeRuns from '../pages/ScrapeRuns'
import Settings from '../pages/Settings'
import Sites from '../pages/Sites'

export default function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.postings.href()} element={<Postings />} />
      <Route path={ROUTES.settings.href()} element={<Settings />} />
      <Route path={ROUTES.sites.href()} element={<Sites />} />
      <Route path={ROUTES.prompts.href()} element={<Prompts />} />
      <Route path={ROUTES.scrapeRuns.href()} element={<ScrapeRuns />} />
      <Route path={ROUTES.debugger.href()} element={<Debugger />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
