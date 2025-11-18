import {
  Box,
  Chip,
  Collapse,
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
import { CHANNEL } from '../../shared/messages.types'
import type { ScrapeRunDTO, ScrapeTaskDTO, SiteDTO } from '../../shared/types'
import { PAGINATION } from '../consts'
import ipcMessenger from '../ipcMessenger'
import Icon from '../sharedComponents/Icon'
import Message from '../sharedComponents/Message'
import PageWrapper from '../sharedComponents/PageWrapper'
import { SPACING } from '../styles/consts'
import { logger } from '../utilities'

type Status = 'hash_exists' | 'new_data' | 'error'

type RunSortField = 'createdAt' | 'status' | 'totalSites' | 'successfulSites' | 'failedSites'
type TaskSortField = 'siteUrl' | 'status' | 'newPostingsFound' | 'completedAt'
type SortDirection = 'asc' | 'desc'

const ScrapeRuns = () => {
  const [runs, setRuns] = useState<ScrapeRunDTO[]>([])
  const [tasks, setTasks] = useState<Record<string, ScrapeTaskDTO[]>>({})
  const [sites, setSites] = useState<SiteDTO[]>([])
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [runSortField, setRunSortField] = useState<RunSortField>('createdAt')
  const [runSortDirection, setRunSortDirection] = useState<SortDirection>('desc')
  const [taskSortField, setTaskSortField] = useState<TaskSortField>('siteUrl')
  const [taskSortDirection, setTaskSortDirection] = useState<SortDirection>('asc')
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

  const handleTaskSort = (field: TaskSortField) => {
    if (taskSortField === field) {
      setTaskSortDirection(taskSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setTaskSortField(field)
      setTaskSortDirection('asc')
    }
  }

  const getSiteTitle = (siteId: string): string => {
    const site = sites.find((s) => s.id === siteId)
    return site?.siteTitle || 'Unknown'
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
      const result = await ipcMessenger.invoke(CHANNEL.SCRAPE_RUNS.GET_ALL, undefined)
      setRuns(result.runs)
    } catch (err) {
      setError('Failed to load scrape runs')
      logger.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadSites = useCallback(async () => {
    try {
      const result = await ipcMessenger.invoke(CHANNEL.SITES.GET_ALL, undefined)
      setSites(result.sites)
    } catch (err) {
      logger.error('Failed to load sites:', err)
    }
  }, [])

  const loadTasksForRun = async (runId: string) => {
    if (tasks[runId]) {
      // Already loaded
      setExpandedRunId(expandedRunId === runId ? null : runId)
      return
    }

    try {
      const result = await ipcMessenger.invoke(CHANNEL.SCRAPE_RUNS.GET_TASKS, {
        scrapeRunId: runId,
      })
      setTasks((prev) => ({ ...prev, [runId]: result.tasks }))
      setExpandedRunId(runId)
    } catch (err) {
      setError('Failed to load scrape tasks')
      logger.error(err)
    }
  }

  useEffect(() => {
    loadScrapeRuns()
    loadSites()
  }, [loadScrapeRuns, loadSites])

  const formatStatus = (status: Status): string => {
    switch (status) {
      case 'new_data':
        return 'New Data'
      case 'hash_exists':
        return 'No New Data'
      case 'error':
        return 'Error'
      default:
        return status
    }
  }

  const getStatusColor = (status: Status): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'new_data':
        return 'success'
      case 'hash_exists':
        return 'warning'
      case 'error':
        return 'error'
      default:
        return 'default'
    }
  }
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
                paginatedRuns.map((run) => {
                  const isExpanded = expandedRunId === run.id
                  const runTasks = tasks[run.id] || []

                  const sortedTasks = [...runTasks].sort((a, b) => {
                    let aVal: string | number
                    let bVal: string | number

                    switch (taskSortField) {
                      case 'siteUrl':
                        aVal = getSiteTitle(a.siteId)
                        bVal = getSiteTitle(b.siteId)
                        break
                      case 'status':
                        aVal = a.status
                        bVal = b.status
                        break
                      case 'newPostingsFound':
                        aVal = a.newPostingsFound
                        bVal = b.newPostingsFound
                        break
                      case 'completedAt':
                        aVal = a.completedAt ? new Date(a.completedAt).getTime() : 0
                        bVal = b.completedAt ? new Date(b.completedAt).getTime() : 0
                        break
                    }

                    if (aVal < bVal) return taskSortDirection === 'asc' ? -1 : 1
                    if (aVal > bVal) return taskSortDirection === 'asc' ? 1 : -1
                    return 0
                  })
                  const duration =
                    run.completedAt && run.createdAt
                      ? Math.round((new Date(run.completedAt).getTime() - new Date(run.createdAt).getTime()) / 1000)
                      : null

                  return (
                    <Fragment key={run.id}>
                      <TableRow hover>
                        <TableCell>
                          <Tooltip title={isExpanded ? 'Collapse details' : 'Expand details'}>
                            <IconButton size="small" onClick={() => loadTasksForRun(run.id)}>
                              <Icon name={isExpanded ? 'down' : 'right'} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{new Date(run.createdAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip label={formatStatus(run.status)} color={getStatusColor(run.status)} size="small" />
                        </TableCell>
                        <TableCell>{run.totalSites}</TableCell>
                        <TableCell>{run.successfulSites}</TableCell>
                        <TableCell>{run.failedSites}</TableCell>
                        <TableCell>{duration !== null ? `${duration}s` : 'In progress...'}</TableCell>
                        <TableCell>{run.comments || '-'}</TableCell>
                      </TableRow>

                      {/* Expandable section for tasks */}
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2 }}>
                              <Typography variant="h6" gutterBottom component="div">
                                Site Scan Details
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>
                                      <TableSortLabel
                                        active={taskSortField === 'siteUrl'}
                                        direction={taskSortField === 'siteUrl' ? taskSortDirection : 'asc'}
                                        onClick={() => handleTaskSort('siteUrl')}
                                      >
                                        Company
                                      </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                      <TableSortLabel
                                        active={taskSortField === 'status'}
                                        direction={taskSortField === 'status' ? taskSortDirection : 'asc'}
                                        onClick={() => handleTaskSort('status')}
                                      >
                                        Status
                                      </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                      <TableSortLabel
                                        active={taskSortField === 'newPostingsFound'}
                                        direction={taskSortField === 'newPostingsFound' ? taskSortDirection : 'asc'}
                                        onClick={() => handleTaskSort('newPostingsFound')}
                                      >
                                        New Postings
                                      </TableSortLabel>
                                    </TableCell>
                                    <TableCell>Error Message</TableCell>
                                    <TableCell>
                                      <TableSortLabel
                                        active={taskSortField === 'completedAt'}
                                        direction={taskSortField === 'completedAt' ? taskSortDirection : 'asc'}
                                        onClick={() => handleTaskSort('completedAt')}
                                      >
                                        Completed At
                                      </TableSortLabel>
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {sortedTasks.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={5} align="center">
                                        <Typography variant="body2" color="textSecondary">
                                          No task details available
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    sortedTasks.map((task) => (
                                      <TableRow key={task.id}>
                                        <TableCell>{getSiteTitle(task.siteId)}</TableCell>
                                        <TableCell>
                                          <Chip
                                            label={formatStatus(task.status)}
                                            color={getStatusColor(task.status)}
                                            size="small"
                                          />
                                        </TableCell>
                                        <TableCell>{task.newPostingsFound}</TableCell>
                                        <TableCell>{task.errorMessage || '-'}</TableCell>
                                        <TableCell>
                                          {task.completedAt ? new Date(task.completedAt).toLocaleString() : '-'}
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
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
