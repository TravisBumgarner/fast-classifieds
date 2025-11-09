import {
  Alert,
  Box,
  Button,
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
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material'
import { Fragment, useEffect, useState } from 'react'
import { CHANNEL } from '../../shared/messages.types'
import ipcMessenger from '../ipcMessenger'
import Message from '../sharedComponents/Message'
import { MODAL_ID } from '../sharedComponents/Modal/Modal.consts'
import { activeModalSignal } from '../signals'
import { SPACING } from '../styles/consts'

type Status = 'hash_exists' | 'new_data' | 'error'

interface ScrapeTask {
  id: number
  scrapeRunId: number
  siteId: number
  siteUrl: string
  status: Status
  newPostingsFound: number
  errorMessage?: string | null
  createdAt: Date
  completedAt?: Date | null
}

interface ScrapeRun {
  id: number
  status: Status
  totalSites: number
  successfulSites: number
  failedSites: number
  comments?: string | null
  createdAt: Date
  completedAt?: Date | null
}

type RunSortField =
  | 'createdAt'
  | 'status'
  | 'totalSites'
  | 'successfulSites'
  | 'failedSites'
type TaskSortField = 'siteUrl' | 'status' | 'newPostingsFound' | 'completedAt'
type SortDirection = 'asc' | 'desc'

interface Site {
  id: number
  siteTitle: string
  siteUrl: string
}

const ScrapeRuns = () => {
  const [runs, setRuns] = useState<ScrapeRun[]>([])
  const [tasks, setTasks] = useState<Record<number, ScrapeTask[]>>({})
  const [sites, setSites] = useState<Site[]>([])
  const [expandedRunId, setExpandedRunId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [runSortField, setRunSortField] = useState<RunSortField>('createdAt')
  const [runSortDirection, setRunSortDirection] =
    useState<SortDirection>('desc')
  const [taskSortField, setTaskSortField] = useState<TaskSortField>('siteUrl')
  const [taskSortDirection, setTaskSortDirection] =
    useState<SortDirection>('asc')

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

  const getSiteTitle = (siteId: number): string => {
    const site = sites.find(s => s.id === siteId)
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

  const loadScrapeRuns = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await ipcMessenger.invoke(
        CHANNEL.SCRAPE_RUNS.GET_ALL,
        undefined,
      )
      setRuns(result.runs)
    } catch (err) {
      setError('Failed to load scrape runs')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadSites = async () => {
    try {
      const result = await ipcMessenger.invoke(CHANNEL.SITES.GET_ALL, undefined)
      setSites(result.sites)
    } catch (err) {
      console.error('Failed to load sites:', err)
    }
  }

  const handleRetry = async (runId: number) => {
    try {
      activeModalSignal.value = {
        id: MODAL_ID.SCRAPE_PROGRESS_MODAL,
        onComplete: loadScrapeRuns,
        retryRunId: runId,
      }
    } catch (err) {
      setError('Failed to retry scrape')
      console.error(err)
    }
  }

  const loadTasksForRun = async (runId: number) => {
    if (tasks[runId]) {
      // Already loaded
      setExpandedRunId(expandedRunId === runId ? null : runId)
      return
    }

    try {
      const result = await ipcMessenger.invoke(CHANNEL.SCRAPE_RUNS.GET_TASKS, {
        scrapeRunId: runId,
      })
      setTasks(prev => ({ ...prev, [runId]: result.tasks }))
      setExpandedRunId(runId)
    } catch (err) {
      setError('Failed to load scrape tasks')
      console.error(err)
    }
  }

  useEffect(() => {
    loadScrapeRuns()
    loadSites()
  }, [])

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

  const getStatusColor = (
    status: Status,
  ): 'success' | 'warning' | 'error' | 'default' => {
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
    return <></>
  }

  return (
    <Box sx={{ p: SPACING.LARGE.PX }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: SPACING.MEDIUM.PX }}
      >
        <Typography variant="h4">Scrape Run History</Typography>
      </Stack>

      {runs.length === 0 && !error && !loading && (
        <Alert severity="info" sx={{ mb: SPACING.MEDIUM.PX }}>
          <Typography variant="subtitle2" gutterBottom>
            <strong>No scrape runs yet</strong>
          </Typography>
          <Typography variant="body2">
            Scrape runs will appear here once you start scanning your sites for
            job postings. Each run shows which sites were scanned, how many new
            jobs were found, and any errors encountered.
          </Typography>
        </Alert>
      )}

      {error && <Message message={error} color="error" />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50}></TableCell>
              <TableCell>
                <TableSortLabel
                  active={runSortField === 'createdAt'}
                  direction={
                    runSortField === 'createdAt' ? runSortDirection : 'asc'
                  }
                  onClick={() => handleRunSort('createdAt')}
                >
                  Run Date
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={runSortField === 'status'}
                  direction={
                    runSortField === 'status' ? runSortDirection : 'asc'
                  }
                  onClick={() => handleRunSort('status')}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={runSortField === 'totalSites'}
                  direction={
                    runSortField === 'totalSites' ? runSortDirection : 'asc'
                  }
                  onClick={() => handleRunSort('totalSites')}
                >
                  Sites Scanned
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={runSortField === 'successfulSites'}
                  direction={
                    runSortField === 'successfulSites'
                      ? runSortDirection
                      : 'asc'
                  }
                  onClick={() => handleRunSort('successfulSites')}
                >
                  Successful
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={runSortField === 'failedSites'}
                  direction={
                    runSortField === 'failedSites' ? runSortDirection : 'asc'
                  }
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
                  <Stack
                    spacing={SPACING.SMALL.PX}
                    alignItems="center"
                    sx={{ py: 4 }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      No scrape runs found. Run your first scrape to see results
                      here.
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              sortedRuns.map(run => {
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
                      aVal = a.completedAt
                        ? new Date(a.completedAt).getTime()
                        : 0
                      bVal = b.completedAt
                        ? new Date(b.completedAt).getTime()
                        : 0
                      break
                  }

                  if (aVal < bVal) return taskSortDirection === 'asc' ? -1 : 1
                  if (aVal > bVal) return taskSortDirection === 'asc' ? 1 : -1
                  return 0
                })
                const duration =
                  run.completedAt && run.createdAt
                    ? Math.round(
                        (new Date(run.completedAt).getTime() -
                          new Date(run.createdAt).getTime()) /
                          1000,
                      )
                    : null

                return (
                  <Fragment key={run.id}>
                    <TableRow hover>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => loadTasksForRun(run.id)}
                        >
                          {isExpanded ? '▲' : '▼'}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        {new Date(run.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatStatus(run.status)}
                          color={getStatusColor(run.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{run.totalSites}</TableCell>
                      <TableCell>{run.successfulSites}</TableCell>
                      <TableCell>{run.failedSites}</TableCell>
                      <TableCell>
                        {duration !== null ? `${duration}s` : 'In progress...'}
                      </TableCell>
                      <TableCell>{run.comments || '-'}</TableCell>
                      <TableCell>
                        {run.failedSites > 0 && (
                          <Tooltip title="Retry failed sites">
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => handleRetry(run.id)}
                            >
                              Retry ({run.failedSites})
                            </Button>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expandable section for tasks */}
                    <TableRow>
                      <TableCell
                        style={{ paddingBottom: 0, paddingTop: 0 }}
                        colSpan={9}
                      >
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2 }}>
                            <Typography
                              variant="h6"
                              gutterBottom
                              component="div"
                            >
                              Site Scan Details
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>
                                    <TableSortLabel
                                      active={taskSortField === 'siteUrl'}
                                      direction={
                                        taskSortField === 'siteUrl'
                                          ? taskSortDirection
                                          : 'asc'
                                      }
                                      onClick={() => handleTaskSort('siteUrl')}
                                    >
                                      Company
                                    </TableSortLabel>
                                  </TableCell>
                                  <TableCell>
                                    <TableSortLabel
                                      active={taskSortField === 'status'}
                                      direction={
                                        taskSortField === 'status'
                                          ? taskSortDirection
                                          : 'asc'
                                      }
                                      onClick={() => handleTaskSort('status')}
                                    >
                                      Status
                                    </TableSortLabel>
                                  </TableCell>
                                  <TableCell>
                                    <TableSortLabel
                                      active={
                                        taskSortField === 'newPostingsFound'
                                      }
                                      direction={
                                        taskSortField === 'newPostingsFound'
                                          ? taskSortDirection
                                          : 'asc'
                                      }
                                      onClick={() =>
                                        handleTaskSort('newPostingsFound')
                                      }
                                    >
                                      New Postings
                                    </TableSortLabel>
                                  </TableCell>
                                  <TableCell>Error Message</TableCell>
                                  <TableCell>
                                    <TableSortLabel
                                      active={taskSortField === 'completedAt'}
                                      direction={
                                        taskSortField === 'completedAt'
                                          ? taskSortDirection
                                          : 'asc'
                                      }
                                      onClick={() =>
                                        handleTaskSort('completedAt')
                                      }
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
                                      <Typography
                                        variant="body2"
                                        color="textSecondary"
                                      >
                                        No task details available
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  sortedTasks.map(task => (
                                    <TableRow key={task.id}>
                                      <TableCell>
                                        {getSiteTitle(task.siteId)}
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={formatStatus(task.status)}
                                          color={getStatusColor(task.status)}
                                          size="small"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        {task.newPostingsFound}
                                      </TableCell>
                                      <TableCell>
                                        {task.errorMessage || '-'}
                                      </TableCell>
                                      <TableCell>
                                        {task.completedAt
                                          ? new Date(
                                              task.completedAt,
                                            ).toLocaleString()
                                          : '-'}
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
      </TableContainer>
    </Box>
  )
}

export default ScrapeRuns
