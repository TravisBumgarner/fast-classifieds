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
import { CHANNEL_INVOKES } from '../../shared/types/messages.invokes'
import { PAGINATION, QUERY_KEYS } from '../consts'
import ipcMessenger from '../ipcMessenger'
import Icon from '../sharedComponents/Icon'
import Link from '../sharedComponents/Link'
import PageWrapper from '../sharedComponents/PageWrapper'
import { SPACING } from '../styles/consts'
import { createQueryKey } from '../utilities'

type SortField = 'model' | 'createdAt' | 'inputTokens' | 'outputTokens' | 'totalTokens' | 'siteTitle'
type SortDirection = 'asc' | 'desc'

const ApiUsage = () => {
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [expandedUsageId, setExpandedUsageId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(PAGINATION.DEFAULT_ROWS_PER_PAGE)
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
      case 'model':
        aVal = a.model.toLowerCase()
        bVal = b.model.toLowerCase()
        break
      case 'createdAt':
        aVal = new Date(a.createdAt).getTime()
        bVal = new Date(b.createdAt).getTime()
        break
      case 'inputTokens':
        aVal = a.inputTokens
        bVal = b.inputTokens
        break
      case 'outputTokens':
        aVal = a.outputTokens
        bVal = b.outputTokens
        break
      case 'totalTokens':
        aVal = a.totalTokens
        bVal = b.totalTokens
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

  if (isLoading) {
    return
  }

  return (
    <PageWrapper>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: SPACING.MEDIUM.PX }}>
        <Typography variant="h4">API Usage</Typography>
        <Typography variant="body2" color="textSecondary">
          Total Records: {apiUsageData.apiUsage.length}
        </Typography>
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
                    active={sortField === 'model'}
                    direction={sortField === 'model' ? sortDirection : 'asc'}
                    onClick={() => handleSort('model')}
                  >
                    Model
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'inputTokens'}
                    direction={sortField === 'inputTokens' ? sortDirection : 'asc'}
                    onClick={() => handleSort('inputTokens')}
                  >
                    Input Tokens
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'outputTokens'}
                    direction={sortField === 'outputTokens' ? sortDirection : 'asc'}
                    onClick={() => handleSort('outputTokens')}
                  >
                    Output Tokens
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'totalTokens'}
                    direction={sortField === 'totalTokens' ? sortDirection : 'asc'}
                    onClick={() => handleSort('totalTokens')}
                  >
                    Total Tokens
                  </TableSortLabel>
                </TableCell>
                <TableCell>Cached Tokens</TableCell>
                <TableCell>Reasoning Tokens</TableCell>
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
                  <TableCell colSpan={10} align="center">
                    <Stack spacing={SPACING.SMALL.PX} alignItems="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        No API usage data found.
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedApiUsage.map((usage) => {
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
                        <TableCell>{usage.model}</TableCell>
                        <TableCell>{formatTokens(usage.inputTokens)}</TableCell>
                        <TableCell>{formatTokens(usage.outputTokens)}</TableCell>
                        <TableCell>{formatTokens(usage.totalTokens)}</TableCell>
                        <TableCell>{formatTokens(usage.cachedTokens)}</TableCell>
                        <TableCell>{formatTokens(usage.reasoningTokens)}</TableCell>
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
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2 }}>
                              <Stack spacing={SPACING.MEDIUM.PX}>
                                <Typography variant="h6">Detailed Information</Typography>

                                <Stack direction="row" spacing={SPACING.LARGE.PX}>
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
