import {
  Box,
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
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { Fragment, useRef, useState } from 'react'
import { CHANNEL_INVOKES } from '../../../shared/types/messages.invokes'
import { PAGINATION, QUERY_KEYS } from '../../consts'
import ipcMessenger from '../../ipcMessenger'
import Message from '../../sharedComponents/Message'
import PageWrapper from '../../sharedComponents/PageWrapper'
import { SPACING } from '../../styles/consts'
import { createQueryKey } from '../../utilities'
import ScrapeRun from './components/ScrapeRun'
import ScrapeRunDetails from './components/ScrapeRunTasks'

type RunSortField = 'createdAt' | 'status' | 'totalSites' | 'successfulSites' | 'failedSites'
type SortDirection = 'asc' | 'desc'

const ScrapeRuns = () => {
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)
  const [runSortField, setRunSortField] = useState<RunSortField>('createdAt')
  const [runSortDirection, setRunSortDirection] = useState<SortDirection>('desc')
  const tableScrollContainerRef = useRef<HTMLTableElement>(null)

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(PAGINATION.DEFAULT_ROWS_PER_PAGE)

  const { data, error, isLoading } = useQuery({
    queryKey: createQueryKey(QUERY_KEYS.SCRAPE_RUNS, 'scrapeRunsPage'),
    queryFn: async () => {
      setPage(0)
      return await ipcMessenger.invoke(CHANNEL_INVOKES.SCRAPE_RUNS.GET_ALL, undefined)
    },
    initialData: { runs: [] },
  })

  const handleRunSort = (field: RunSortField) => {
    if (runSortField === field) {
      setRunSortDirection(runSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setRunSortField(field)
      setRunSortDirection('asc')
    }
  }

  const sortedRuns = [...data.runs].sort((a, b) => {
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
    if (tableScrollContainerRef.current) {
      tableScrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' })
    }
    setPage(newPage)
    setExpandedRunId(null) // Collapse expanded rows when changing pages
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
    setExpandedRunId(null)
  }

  if (isLoading) {
    return
  }

  return (
    <PageWrapper>
      {error && <Message message={error.message} color="error" />}

      <TableContainer
        component={Paper}
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ flexGrow: 1, overflow: 'auto' }} ref={tableScrollContainerRef}>
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
                  return (
                    <Fragment key={scrapeRun.id}>
                      <ScrapeRun
                        scrapeRun={scrapeRun}
                        isExpanded={expandedRunId === scrapeRun.id}
                        setExpandedRunId={setExpandedRunId}
                      />
                      <ScrapeRunDetails scrapeRunId={scrapeRun.id} isExpanded={expandedRunId === scrapeRun.id} />
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
