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
import { Fragment, useRef, useState } from 'react'
import { KNOWN_MODELS } from '../../shared/consts'
import type { ApiUsageDTO } from '../../shared/types'
import { CHANNEL_INVOKES } from '../../shared/types/messages.invokes'
import { PAGINATION, QUERY_KEYS } from '../consts'
import { useLocalStorage } from '../hooks/useLocalStorage'
import ipcMessenger from '../ipcMessenger'
import Icon from '../sharedComponents/Icon'
import Link from '../sharedComponents/Link'
import PageWrapper from '../sharedComponents/PageWrapper'
import { SPACING } from '../styles/consts'
import { createQueryKey } from '../utilities'

const calculateCost = (usage: ApiUsageDTO): number => {
  const modelConfig = KNOWN_MODELS.find((m) => m.model === usage.userSelectedModel)
  if (!modelConfig) return 0

  const inputCost = (usage.inputTokens / 1_000_000) * modelConfig.input
  const outputCost = (usage.outputTokens / 1_000_000) * modelConfig.output
  const cachedCost =
    usage.cachedTokens && modelConfig.cachedInput ? (usage.cachedTokens / 1_000_000) * modelConfig.cachedInput : 0

  return inputCost + outputCost - cachedCost // Subtract cached cost as it's a discount
}

const formatCost = (cost: number): string => {
  return `$${cost.toFixed(4)}`
}

type SortField = 'userSelectedModel' | 'createdAt' | 'cost' | 'siteTitle'
type SortDirection = 'asc' | 'desc'

const CostRow = ({
  expandedUsageId,
  setExpandedUsageId,
  usage,
}: {
  expandedUsageId: string | null
  setExpandedUsageId: (id: string | null) => void
  usage: ApiUsageDTO
}) => {
  const handleToggleExpand = (usageId: string) => {
    if (expandedUsageId === usageId) {
      setExpandedUsageId(null)
    } else {
      setExpandedUsageId(usageId)
    }
  }

  const formatTokens = (tokens: number | null): string => {
    if (tokens === null) return '-'
    return tokens.toLocaleString()
  }

  const isExpanded = expandedUsageId === usage.id

  return (
    <Fragment key={usage.id}>
      <TableRow hover>
        <TableCell padding="checkbox">
          <Tooltip title={isExpanded ? 'Collapse details' : 'Expand details'}>
            <IconButton onClick={() => handleToggleExpand(usage.id)}>
              <Icon name={isExpanded ? 'down' : 'right'} />
            </IconButton>
          </Tooltip>
        </TableCell>
        <TableCell>{usage.userSelectedModel}</TableCell>
        <TableCell>{formatCost(calculateCost(usage))}</TableCell>
        <TableCell>
          <Typography
            variant="body2"
            sx={{
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {usage.siteTitle}
          </Typography>
        </TableCell>
        <TableCell>{new Date(usage.createdAt).toLocaleString()}</TableCell>
        <TableCell align="right">
          <Tooltip title={`Open site in browser: ${usage.siteUrl}`}>
            <span>
              <Link url={usage.siteUrl} />
            </span>
          </Tooltip>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Stack spacing={SPACING.MEDIUM.PX}>
                <Typography variant="h6">Detailed Information</Typography>

                <Stack direction="row" spacing={SPACING.LARGE.PX}>
                  <Box sx={{ minWidth: 200 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Token Usage
                    </Typography>
                    <Typography variant="body2">
                      <strong>Input Tokens:</strong> {formatTokens(usage.inputTokens)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Output Tokens:</strong> {formatTokens(usage.outputTokens)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Total Tokens:</strong> {formatTokens(usage.totalTokens)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Cached Tokens:</strong> {formatTokens(usage.cachedTokens)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Reasoning Tokens:</strong> {formatTokens(usage.reasoningTokens)}
                    </Typography>
                  </Box>
                  <Box sx={{ minWidth: 200 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Cost Breakdown
                    </Typography>
                    {(() => {
                      const modelConfig = KNOWN_MODELS.find((m) => m.model === usage.userSelectedModel)
                      if (!modelConfig) {
                        return (
                          <Typography variant="body2" color="warning.main">
                            Unknown model - cost calculation unavailable
                          </Typography>
                        )
                      }
                      const inputCost = (usage.inputTokens / 1_000_000) * modelConfig.input
                      const outputCost = (usage.outputTokens / 1_000_000) * modelConfig.output
                      const cachedDiscount =
                        usage.cachedTokens && modelConfig.cachedInput
                          ? (usage.cachedTokens / 1_000_000) * modelConfig.cachedInput
                          : 0
                      const totalCost = inputCost + outputCost - cachedDiscount

                      return (
                        <>
                          <Typography variant="body2">
                            <strong>Input Cost:</strong> {formatCost(inputCost)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Output Cost:</strong> {formatCost(outputCost)}
                          </Typography>
                          {cachedDiscount > 0 && (
                            <Typography variant="body2" color="success.main">
                              <strong>Cache Discount:</strong> -{formatCost(cachedDiscount)}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ fontWeight: 'bold', pt: 1 }}>
                            <strong>Total Cost:</strong> {formatCost(totalCost)}
                          </Typography>
                        </>
                      )
                    })()}
                  </Box>
                  <Box sx={{ minWidth: 200 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Model Information
                    </Typography>
                    <Typography variant="body2">
                      <strong>User Selected:</strong> {usage.userSelectedModel}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Actually Used:</strong> {usage.actualModel}
                    </Typography>
                  </Box>
                  <Box sx={{ minWidth: 200 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Request Details
                    </Typography>
                    <Typography variant="body2">
                      <strong>Response ID:</strong> {usage.responseId || '-'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> {usage.status || '-'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Temperature:</strong> {usage.temperature || '-'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Service Tier:</strong> {usage.servicetier || '-'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Reasoning Effort:</strong> {usage.reasoningEffort || '-'}
                    </Typography>
                  </Box>
                </Stack>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Prompt
                  </Typography>
                  <Paper
                    sx={{
                      p: SPACING.SMALL.PX,
                      bgcolor: 'grey.50',
                      maxHeight: 200,
                      overflow: 'auto',
                    }}
                  >
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                      }}
                    >
                      {usage.prompt}
                    </Typography>
                  </Paper>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Site Content (Preview)
                  </Typography>
                  <Paper
                    sx={{
                      p: SPACING.SMALL.PX,
                      bgcolor: 'grey.50',
                      maxHeight: 200,
                      overflow: 'auto',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                      }}
                    >
                      {usage.siteContent.substring(0, 1000)}
                      {usage.siteContent.length > 1000 && '...'}
                    </Typography>
                  </Paper>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    AI Output
                  </Typography>
                  <Paper
                    sx={{
                      p: SPACING.SMALL.PX,
                      bgcolor: 'grey.50',
                      maxHeight: 200,
                      overflow: 'auto',
                    }}
                  >
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                      }}
                    >
                      {usage.outputText}
                    </Typography>
                  </Paper>
                </Box>
              </Stack>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  )
}

const ApiUsage = () => {
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [expandedUsageId, setExpandedUsageId] = useState<string | null>(null)
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

  const sortedApiUsage = [...apiUsageData.apiUsage].sort((a, b) => {
    let aVal: string | number | Date
    let bVal: string | number | Date

    switch (sortField) {
      case 'userSelectedModel':
        aVal = a.userSelectedModel.toLowerCase()
        bVal = b.userSelectedModel.toLowerCase()
        break
      case 'createdAt':
        aVal = new Date(a.createdAt).getTime()
        bVal = new Date(b.createdAt).getTime()
        break
      case 'cost':
        aVal = calculateCost(a)
        bVal = calculateCost(b)
        break
      case 'siteTitle':
        aVal = a.siteTitle.toLowerCase()
        bVal = b.siteTitle.toLowerCase()
        break
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const paginatedApiUsage = sortedApiUsage.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleChangePage = (_event: unknown, newPage: number) => {
    if (tableScrollContainerRef.current) {
      tableScrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' })
    }
    setPage(newPage)
    setExpandedUsageId(null) // Collapse expanded rows when changing pages
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
    setExpandedUsageId(null)
  }

  if (isLoading) {
    return
  }

  return (
    <PageWrapper>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: SPACING.MEDIUM.PX }}>
        <Stack direction="row" spacing={SPACING.MEDIUM.PX} alignItems="center">
          <Typography variant="body2" color="textSecondary">
            Total Records: {apiUsageData.apiUsage.length}
          </Typography>
          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'bold' }}>
            Total Cost: {formatCost(apiUsageData.apiUsage.reduce((sum, usage) => sum + calculateCost(usage), 0))}
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
                    active={sortField === 'userSelectedModel'}
                    direction={sortField === 'userSelectedModel' ? sortDirection : 'asc'}
                    onClick={() => handleSort('userSelectedModel')}
                  >
                    User Selected Model
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'cost'}
                    direction={sortField === 'cost' ? sortDirection : 'asc'}
                    onClick={() => handleSort('cost')}
                  >
                    Cost
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'siteTitle'}
                    direction={sortField === 'siteTitle' ? sortDirection : 'asc'}
                    onClick={() => handleSort('siteTitle')}
                  >
                    Site Title
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'createdAt'}
                    direction={sortField === 'createdAt' ? sortDirection : 'asc'}
                    onClick={() => handleSort('createdAt')}
                  >
                    Created
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {apiUsageData.apiUsage.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Stack spacing={SPACING.SMALL.PX} alignItems="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        No API usage data found.
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedApiUsage.map((usage) => {
                  return (
                    <CostRow
                      key={usage.id}
                      usage={usage}
                      expandedUsageId={expandedUsageId}
                      setExpandedUsageId={setExpandedUsageId}
                    />
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
          count={sortedApiUsage.length}
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
