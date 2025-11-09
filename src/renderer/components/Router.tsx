import { Route, Routes } from 'react-router-dom'
import { ROUTES } from '../consts'
import Home from '../pages/Home'
import Prompts from '../pages/Prompts'
import ScrapeRuns from '../pages/ScrapeRuns'
import Sites from '../pages/Sites'

export default function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.home.href()} element={<Home />} />
      <Route path={ROUTES.sites.href()} element={<Sites />} />
      <Route path={ROUTES.prompts.href()} element={<Prompts />} />
      <Route path={ROUTES.scrapeRuns.href()} element={<ScrapeRuns />} />
    </Routes>
  )
}
