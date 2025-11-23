import {
  Box,
  Chip,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { SCRAPER_TASK_RESULT, type ScraperTaskResult } from '../../../../shared/types'
import { CHANNEL_INVOKES } from '../../../../shared/types/messages.invokes'
import { QUERY_KEYS } from '../../../consts'
import ipcMessenger from '../../../ipcMessenger'
import Icon from '../../../sharedComponents/Icon'
import { createQueryKey } from '../../../utilities'

type TaskSortField = 'siteUrl' | 'result' | 'newPostingsFound' | 'completedAt'
type SortDirection = 'asc' | 'desc'

const getScrapeTaskResult = (status: ScraperTaskResult): 'success' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case SCRAPER_TASK_RESULT.NEW_DATA:
      return 'success'
    case SCRAPER_TASK_RESULT.HASH_EXISTS:
      return 'warning'
    case SCRAPER_TASK_RESULT.ERROR:
      return 'error'
    default:
      return 'default'
  }
}

const getStatusText = (status: ScraperTaskResult): string => {
  switch (status) {
    case SCRAPER_TASK_RESULT.NEW_DATA:
      return 'New Data Found'
    case SCRAPER_TASK_RESULT.HASH_EXISTS:
      return 'No New Data'
    case SCRAPER_TASK_RESULT.ERROR:
      return 'Error Occurred'
    default:
      return 'Unknown Status'
  }
}

const ScrapeRunTasks = ({ scrapeRunId, isExpanded }: { scrapeRunId: string; isExpanded: boolean }) => {
  const [taskSortField, setTaskSortField] = useState<TaskSortField>('siteUrl')
  const [taskSortDirection, setTaskSortDirection] = useState<SortDirection>('asc')

  const { data } = useQuery({
    queryKey: createQueryKey(QUERY_KEYS.SCRAPE_RUNS, ['scrapeRunTasks', scrapeRunId]),
    queryFn: async () => {
      return await ipcMessenger.invoke(CHANNEL_INVOKES.SCRAPE_RUNS.GET_TASKS, {
        scrapeRunId,
      })
    },
    initialData: { tasks: [] },
  })

  const handleTaskSort = (field: TaskSortField) => {
    if (taskSortField === field) {
      setTaskSortDirection(taskSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setTaskSortField(field)
      setTaskSortDirection('asc')
    }
  }

  const sortedTasks = [...data.tasks].sort((a, b) => {
    let aVal: string | number
    let bVal: string | number

    switch (taskSortField) {
      case 'siteUrl':
        aVal = a.siteTitle
        bVal = b.siteTitle
        break
      case 'result':
        aVal = a.result
        bVal = b.result
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

  return (
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
                      active={taskSortField === 'result'}
                      direction={taskSortField === 'result' ? taskSortDirection : 'asc'}
                      onClick={() => handleTaskSort('result')}
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
                      <TableCell>{task.siteTitle}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(task.result)}
                          color={getScrapeTaskResult(task.result)}
                          size="small"
                        />
                        {task.result === SCRAPER_TASK_RESULT.ERROR && (
                          <Tooltip title={task.errorMessage || 'No error message provided'}>
                            <span>
                              <Icon name="info" />
                            </span>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>{task.newPostingsFound}</TableCell>
                      <TableCell>{task.completedAt ? new Date(task.completedAt).toLocaleString() : '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Collapse>
      </TableCell>
    </TableRow>
  )
}

export default ScrapeRunTasks
