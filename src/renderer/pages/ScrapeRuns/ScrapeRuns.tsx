import {
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material'
import { Fragment, useCallback, useEffect, useState } from 'react'
import type { ScrapeRunDTO } from '../../../shared/types'
import { CHANNEL_INVOKES } from '../../../shared/types/messages.invokes'
import { PAGINATION } from '../../consts'
import ipcMessenger from '../../ipcMessenger'
import logger from '../../logger'
import Icon from '../../sharedComponents/Icon'
import Message from '../../sharedComponents/Message'
import PageWrapper from '../../sharedComponents/PageWrapper'
import { SPACING } from '../../styles/consts'
import { formatSelectOption } from '../../utilities'
import ScrapeRunDetails from './components/ScrapeRunTasks'

type RunSortField = 'createdAt' | 'status' | 'totalSites' | 'successfulSites' | 'failedSites'
type SortDirection = 'asc' | 'desc'

const ScrapeRuns = () => {
  const [runs, setRuns] = useState<ScrapeRunDTO[]>([])
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [runSortField, setRunSortField] = useState<RunSortField>('createdAt')
  const [runSortDirection, setRunSortDirection] = useState<SortDirection>('desc')

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(PAGINATION.DEFAULT_ROWS_PER_PAGE)

  const handleRunSort = (field: RunSortField) => {
    if (runSortField === field) {
      setRunSortDirection(runSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setRunSortField(field)
      setRunSortDirection('asc')
    }
  }

  const sortedRuns = [...runs].sort((a, b) => {
    let aVal: string | number
    let bVal: string | number

    switch (runSortField) {
      case 'createdAt':
        aVal = new Date(a.createdAt).getTime()
        bVal = new Date(b.createdAt).getTime()
        break
      case 'status':
        aVal = a.status
        bVal = b.status
        break
      case 'totalSites':
        aVal = a.totalSites
        bVal = b.totalSites
        break
      case 'successfulSites':
        aVal = a.successfulSites
        bVal = b.successfulSites
        break
      case 'failedSites':
        aVal = a.failedSites
        bVal = b.failedSites
        break
    }

    if (aVal < bVal) return runSortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return runSortDirection === 'asc' ? 1 : -1
    return 0
  })

  const paginatedRuns = sortedRuns.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
    setExpandedRunId(null) // Collapse expanded rows when changing pages
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
    setExpandedRunId(null)
  }

  const loadScrapeRuns = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await ipcMessenger.invoke(CHANNEL_INVOKES.SCRAPE_RUNS.GET_ALL, undefined)
      setRuns(result.runs)
    } catch (err) {
      setError('Failed to load scrape runs')
      logger.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadScrapeRuns()
  }, [loadScrapeRuns])

  if (loading) {
    return
  }

  return (
    <PageWrapper>
      {error && <Message message={error} color="error" />}

      <TableContainer
        component={Paper}
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell width={50}></TableCell>
                <TableCell>
                  <TableSortLabel
                    active={runSortField === 'createdAt'}
                    direction={runSortField === 'createdAt' ? runSortDirection : 'asc'}
                    onClick={() => handleRunSort('createdAt')}
                  >
                    Run Date
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={runSortField === 'status'}
                    direction={runSortField === 'status' ? runSortDirection : 'asc'}
                    onClick={() => handleRunSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={runSortField === 'totalSites'}
                    direction={runSortField === 'totalSites' ? runSortDirection : 'asc'}
                    onClick={() => handleRunSort('totalSites')}
                  >
                    Sites Scanned
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={runSortField === 'successfulSites'}
                    direction={runSortField === 'successfulSites' ? runSortDirection : 'asc'}
                    onClick={() => handleRunSort('successfulSites')}
                  >
                    Successful
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={runSortField === 'failedSites'}
                    direction={runSortField === 'failedSites' ? runSortDirection : 'asc'}
                    onClick={() => handleRunSort('failedSites')}
                  >
                    Failed
                  </TableSortLabel>
                </TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Comments</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRuns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Stack spacing={SPACING.SMALL.PX} alignItems="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        No scrape runs found. Run your first scrape to see results here.
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRuns.map((scrapeRun) => {
                  const isExpanded = expandedRunId === scrapeRun.id

                  const duration =
                    scrapeRun.completedAt && scrapeRun.createdAt
                      ? Math.round(
                          (new Date(scrapeRun.completedAt).getTime() - new Date(scrapeRun.createdAt).getTime()) / 1000,
                        )
                      : null

                  return (
                    <Fragment key={scrapeRun.id}>
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
                      </TableRow>

                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                          <ScrapeRunDetails scrapeRunId={scrapeRun.id} isExpanded={isExpanded} />
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Box>
        <TablePagination
          sx={{ flexShrink: 0 }}
          rowsPerPageOptions={PAGINATION.ROWS_PER_PAGE_OPTIONS}
          component="div"
          count={sortedRuns.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </PageWrapper>
  )
}

export default ScrapeRuns
