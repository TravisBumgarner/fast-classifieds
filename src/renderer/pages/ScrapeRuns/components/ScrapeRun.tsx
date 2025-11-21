import { Chip, IconButton, TableCell, TableRow, Tooltip } from '@mui/material'
import type { ScrapeRunDTO } from '../../../../shared/types'
import Icon from '../../../sharedComponents/Icon'
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

  const handleRetryScrapeRun = (runId: string) => {}

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
        <Tooltip title="Retry failed sites">
          <span>
            <IconButton
              size="small"
              disabled={scrapeRun.failedSites === 0}
              onClick={() => handleRetryScrapeRun(scrapeRun.id)}
            >
              <Icon name="refresh" />
            </IconButton>
          </span>
        </Tooltip>
      </TableCell>
    </TableRow>
  )
}

export default ScrapeRun
