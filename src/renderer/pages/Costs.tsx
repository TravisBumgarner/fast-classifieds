import {
  Box,
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
import { useQuery } from '@tanstack/react-query'
import { Fragment, useMemo, useRef, useState } from 'react'
import { KNOWN_MODELS } from '../../shared/consts'
import type { ApiUsageDTO } from '../../shared/types'
import { CHANNEL_INVOKES } from '../../shared/types/messages.invokes'
import { PAGINATION, QUERY_KEYS } from '../consts'
import { useLocalStorage } from '../hooks/useLocalStorage'
import ipcMessenger from '../ipcMessenger'
import Icon from '../sharedComponents/Icon'
import PageWrapper from '../sharedComponents/PageWrapper'
import { SPACING } from '../styles/consts'
import { createQueryKey } from '../utilities'

const calculateCost = (usage: ApiUsageDTO): number => {
  const modelConfig = KNOWN_MODELS.find((m) => m.model === usage.userSelectedModel)
  if (!modelConfig) return 0

  const inputCost = (usage.inputTokens / 1_000_000) * modelConfig.input
  const outputCost = (usage.outputTokens / 1_000_000) * modelConfig.output
  const cachedDiscount =
    usage.cachedTokens && modelConfig.cachedInput ? (usage.cachedTokens / 1_000_000) * modelConfig.cachedInput : 0

  return inputCost + outputCost - cachedDiscount
}

const formatCost = (cost: number): string => {
  return `$${cost.toFixed(4)}`
}

type RunGroup = {
  scrapeRunId: string
  records: ApiUsageDTO[]
  totalCost: number
  siteCount: number
  date: Date
}

type SortField = 'date' | 'cost' | 'siteCount'
type SortDirection = 'asc' | 'desc'

const SiteRow = ({ usage }: { usage: ApiUsageDTO }) => {
  const cost = calculateCost(usage)
  const modelConfig = KNOWN_MODELS.find((m) => m.model === usage.userSelectedModel)

  return (
    <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
      <TableCell />
      <TableCell>
        <Typography variant="body2">{usage.siteTitle}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{usage.userSelectedModel}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {usage.inputTokens.toLocaleString()} in / {usage.outputTokens.toLocaleString()} out
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{formatCost(cost)}</Typography>
        {modelConfig && usage.cachedTokens ? (
          <Typography variant="caption" color="success.main">
            (cache: -{formatCost((usage.cachedTokens / 1_000_000) * (modelConfig.cachedInput || 0))})
          </Typography>
        ) : null}
      </TableCell>
    </TableRow>
  )
}

const RunRow = ({
  run,
  expandedRunId,
  setExpandedRunId,
}: {
  run: RunGroup
  expandedRunId: string | null
  setExpandedRunId: (id: string | null) => void
}) => {
  const isExpanded = expandedRunId === run.scrapeRunId

  return (
    <Fragment>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell padding="checkbox">
          <Tooltip title={isExpanded ? 'Collapse' : 'Expand to see per-site costs'}>
            <IconButton onClick={() => setExpandedRunId(isExpanded ? null : run.scrapeRunId)} size="small">
              <Icon name={isExpanded ? 'down' : 'right'} />
            </IconButton>
          </Tooltip>
        </TableCell>
        <TableCell>{run.date.toLocaleString()}</TableCell>
        <TableCell>
          {run.siteCount} {run.siteCount === 1 ? 'site' : 'sites'}
        </TableCell>
        <TableCell />
        <TableCell sx={{ fontWeight: 'bold' }}>{formatCost(run.totalCost)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ py: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>Site</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Tokens</TableCell>
                    <TableCell>Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {run.records.map((usage) => (
                    <SiteRow key={usage.id} usage={usage} />
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  )
}

const ApiUsage = () => {
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useLocalStorage('apiUsagePagination', PAGINATION.DEFAULT_ROWS_PER_PAGE)

  const tableScrollContainerRef = useRef<HTMLTableElement>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const { isLoading, data: apiUsageData } = useQuery({
    queryKey: createQueryKey(QUERY_KEYS.API_USAGE, 'apiUsagePage'),
    queryFn: async () => {
      setPage(0)
      return await ipcMessenger.invoke(CHANNEL_INVOKES.API_USAGE.GET_ALL, undefined)
    },
    initialData: { apiUsage: [] },
  })

  const runGroups = useMemo(() => {
    const groupMap = new Map<string, ApiUsageDTO[]>()
    let ungroupedCounter = 0

    for (const usage of apiUsageData.apiUsage) {
      const key = usage.scrapeRunId || `ungrouped-${++ungroupedCounter}`
      const existing = groupMap.get(key) || []
      existing.push(usage)
      groupMap.set(key, existing)
    }

    const groups: RunGroup[] = []
    for (const [scrapeRunId, records] of groupMap) {
      const totalCost = records.reduce((sum, r) => sum + calculateCost(r), 0)
      const dates = records.map((r) => new Date(r.createdAt).getTime())
      groups.push({
        scrapeRunId,
        records,
        totalCost,
        siteCount: records.length,
        date: new Date(Math.min(...dates)),
      })
    }

    return groups
  }, [apiUsageData.apiUsage])

  const sortedRuns = useMemo(() => {
    return [...runGroups].sort((a, b) => {
      let aVal: number
      let bVal: number

      switch (sortField) {
        case 'date':
          aVal = a.date.getTime()
          bVal = b.date.getTime()
          break
        case 'cost':
          aVal = a.totalCost
          bVal = b.totalCost
          break
        case 'siteCount':
          aVal = a.siteCount
          bVal = b.siteCount
          break
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [runGroups, sortField, sortDirection])

  const paginatedRuns = sortedRuns.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleChangePage = (_event: unknown, newPage: number) => {
    if (tableScrollContainerRef.current) {
      tableScrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' })
    }
    setPage(newPage)
    setExpandedRunId(null)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
    setExpandedRunId(null)
  }

  if (isLoading) {
    return
  }

  const totalCost = runGroups.reduce((sum, run) => sum + run.totalCost, 0)

  return (
    <PageWrapper>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: SPACING.MEDIUM.PX }}>
        <Stack direction="row" spacing={SPACING.MEDIUM.PX} alignItems="center">
          <Typography variant="body2" color="textSecondary">
            Total Runs: {runGroups.length}
          </Typography>
          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'bold' }}>
            Total Cost: {formatCost(totalCost)}
          </Typography>
        </Stack>
      </Stack>

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
                <TableCell padding="checkbox" />
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'date'}
                    direction={sortField === 'date' ? sortDirection : 'asc'}
                    onClick={() => handleSort('date')}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'siteCount'}
                    direction={sortField === 'siteCount' ? sortDirection : 'asc'}
                    onClick={() => handleSort('siteCount')}
                  >
                    Sites
                  </TableSortLabel>
                </TableCell>
                <TableCell />
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'cost'}
                    direction={sortField === 'cost' ? sortDirection : 'asc'}
                    onClick={() => handleSort('cost')}
                  >
                    Total Cost
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {runGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Stack spacing={SPACING.SMALL.PX} alignItems="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        No API usage data found.
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRuns.map((run) => (
                  <RunRow
                    key={run.scrapeRunId}
                    run={run}
                    expandedRunId={expandedRunId}
                    setExpandedRunId={setExpandedRunId}
                  />
                ))
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

export default ApiUsage
