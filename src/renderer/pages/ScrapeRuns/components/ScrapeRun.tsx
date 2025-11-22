import { Chip, IconButton, TableCell, TableRow, Tooltip } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { SCRAPER_TASK_RESULT, type ScrapeRunDTO } from '../../../../shared/types'
import { CHANNEL_INVOKES } from '../../../../shared/types/messages.invokes'
import { QUERY_KEYS } from '../../../consts'
import ipcMessenger from '../../../ipcMessenger'
import Icon from '../../../sharedComponents/Icon'
import { MODAL_ID } from '../../../sharedComponents/Modal/Modal.consts'
import { activeModalSignal } from '../../../signals'
import { formatSelectOption } from '../../../utilities'

const ScrapeRun = ({
  scrapeRun,
  isExpanded,
  setExpandedRunId,
}: {
  scrapeRun: ScrapeRunDTO
  isExpanded: boolean
  setExpandedRunId: (id: string | null) => void
}) => {
  const duration =
    scrapeRun.completedAt && scrapeRun.createdAt
      ? Math.round((new Date(scrapeRun.completedAt).getTime() - new Date(scrapeRun.createdAt).getTime()) / 1000)
      : null

  const { data } = useQuery({
    queryKey: [QUERY_KEYS.SCRAPE_RUNS, scrapeRun.id],
    queryFn: async () => {
      return await ipcMessenger.invoke(CHANNEL_INVOKES.SCRAPE_RUNS.GET_TASKS, {
        scrapeRunId: scrapeRun.id,
      })
    },
    initialData: { tasks: [] },
  })

  const handleRetryScrapeRun = (_runId: string) => {
    activeModalSignal.value = {
      id: MODAL_ID.JOB_SEARCH_SETUP_MODAL,
      siteIds: data.tasks.filter((t) => t.result === SCRAPER_TASK_RESULT.ERROR).map((t) => t.siteId),
    }
  }

  return (
    <TableRow hover>
      <TableCell>
        <Tooltip title={isExpanded ? 'Collapse details' : 'Expand details'}>
          <IconButton size="small" onClick={() => setExpandedRunId(isExpanded ? null : scrapeRun.id)}>
            <Icon name={isExpanded ? 'down' : 'right'} />
          </IconButton>
        </Tooltip>
      </TableCell>
      <TableCell>{new Date(scrapeRun.createdAt).toLocaleString()}</TableCell>
      <TableCell>
        <Chip
          label={formatSelectOption(scrapeRun.status)}
          // color={getStatusColor(run.status)}
          size="small"
        />
      </TableCell>
      <TableCell>{scrapeRun.totalSites}</TableCell>
      <TableCell>{scrapeRun.successfulSites}</TableCell>
      <TableCell>{scrapeRun.failedSites}</TableCell>
      <TableCell>{duration !== null ? `${duration}s` : 'In progress...'}</TableCell>
      <TableCell>{scrapeRun.comments || '-'}</TableCell>
      <TableCell>
        {scrapeRun.failedSites > 0 && (
          <Tooltip title="Retry failed sites">
            <span>
              <IconButton size="small" onClick={() => handleRetryScrapeRun(scrapeRun.id)}>
                <Icon name="refresh" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  )
}

export default ScrapeRun
