import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { CHANNEL } from '../../../shared/messages.types'
import type { JobPostingDTO, PostingStatus, ScrapeRunDTO } from '../../../shared/types'
import { PAGINATION, QUERY_KEYS } from '../../consts'
import ipcMessenger from '../../ipcMessenger'
import Icon from '../../sharedComponents/Icon'
import Link from '../../sharedComponents/Link'
import Message from '../../sharedComponents/Message'
import { MODAL_ID } from '../../sharedComponents/Modal/Modal.consts'
import PageWrapper from '../../sharedComponents/PageWrapper'
import { activeModalSignal } from '../../signals'
import { SPACING } from '../../styles/consts'
import { logger } from '../../utilities'
import Filters, { DEFAULT_STATUS_FILTERS } from './components/Filters'
import QuickActions from './components/QuickActions'

type SortField = 'company' | 'title' | 'status' | 'createdAt' | 'location' | 'recommendedByAI'
type SortDirection = 'asc' | 'desc'

const Postings = () => {
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<PostingStatus[]>([...DEFAULT_STATUS_FILTERS])
  const [scrapeRunsFilter, setScrapeRunsFilter] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedPostings, setSelectedPostings] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(PAGINATION.DEFAULT_ROWS_PER_PAGE)
  const queryClient = useQueryClient()

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const { isLoading: isLoadingScrapeRuns, data: scrapeRunsData } = useQuery<{ runs: ScrapeRunDTO[] }>({
    queryKey: [QUERY_KEYS.SCRAPE_RUNS],
    queryFn: async () => await ipcMessenger.invoke(CHANNEL.SCRAPE_RUNS.GET_ALL, undefined),
    initialData: { runs: [] },
  })

  const { isLoading: isLoadingJobPostings, data: jobPostingsData } = useQuery<{ postings: JobPostingDTO[] }>({
    queryKey: [QUERY_KEYS.POSTINGS],
    queryFn: async () => await ipcMessenger.invoke(CHANNEL.JOB_POSTINGS.GET_ALL, undefined),
    initialData: { postings: [] },
  })

  const sortedPostings = [...jobPostingsData.postings].sort((a, b) => {
    let aVal: string | number | Date
    let bVal: string | number | Date

    switch (sortField) {
      case 'company':
        aVal = a.siteTitle?.toLowerCase() || ''
        bVal = b.siteTitle?.toLowerCase() || ''
        break
      case 'title':
        aVal = a.title.toLowerCase()
        bVal = b.title.toLowerCase()
        break
      case 'status':
        aVal = a.status
        bVal = b.status
        break
      case 'createdAt':
        aVal = new Date(a.createdAt).getTime()
        bVal = new Date(b.createdAt).getTime()
        break
      case 'location':
        aVal = a.location?.toLowerCase() || ''
        bVal = b.location?.toLowerCase() || ''
        break
      default:
        aVal = ''
        bVal = ''
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const filteredPostings = sortedPostings.filter((posting) => {
    const truthyChecks = []

    if (statusFilter.length === 0) {
      truthyChecks.push(true)
    } else {
      truthyChecks.push(statusFilter.includes(posting.status))
    }

    if (scrapeRunsFilter.length === 0) {
      truthyChecks.push(true)
    } else {
      truthyChecks.push(scrapeRunsFilter.includes(posting.scrapeRunId))
    }
    return truthyChecks.every(Boolean)
  })

  const paginatedPostings = filteredPostings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleFindJobs = () => {
    activeModalSignal.value = {
      id: MODAL_ID.SCRAPE_PROGRESS_MODAL,
    }
  }

  const handleOpenSelectedInBrowser = () => {
    const postingsToOpen = filteredPostings.filter((posting) => selectedPostings.has(posting.id))
    postingsToOpen.forEach((posting) => {
      // @ts-expect-error - shell:openExternal is not in typed IPC but is defined in messages.ts
      window.electron.ipcRenderer.invoke('shell:openExternal', posting.siteUrl)
    })
    setSelectedPostings(new Set())
  }

  const handleTogglePosting = (id: string) => {
    const newSelected = new Set(selectedPostings)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedPostings(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedPostings.size === filteredPostings.length) {
      setSelectedPostings(new Set())
    } else {
      setSelectedPostings(new Set(filteredPostings.map((p) => p.id)))
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: PostingStatus) => {
    try {
      const result = await ipcMessenger.invoke(CHANNEL.JOB_POSTINGS.UPDATE, { id, data: { status: newStatus } })
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POSTINGS] })
      } else {
        setError('Failed to update job posting status')
      }
    } catch (err) {
      setError('Failed to update job posting status')
      logger.error(err)
    }
  }

  const getStatusColor = (status: PostingStatus): 'primary' | 'success' | 'error' | 'info' => {
    switch (status) {
      case 'new':
        return 'primary'
      case 'applied':
        return 'info'
      case 'interview':
        return 'success'
      case 'offer':
        return 'success'
      case 'skipped':
        return 'info'
      case 'rejected':
        return 'error'
      default:
        return 'primary'
    }
  }

  if (isLoadingJobPostings || isLoadingScrapeRuns) {
    return
  }

  return (
    <PageWrapper>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ marginBottom: SPACING.MEDIUM.PX }}
      >
        <Stack direction="row" spacing={SPACING.SMALL.PX} alignItems="center">
          <Button size="small" variant="contained" onClick={handleFindJobs}>
            Find Jobs
          </Button>
          {selectedPostings.size > 0 && (
            <Button size="small" variant="outlined" onClick={handleOpenSelectedInBrowser}>
              Open Selected ({selectedPostings.size})
            </Button>
          )}
        </Stack>
        <Stack direction="row" spacing={SPACING.SMALL.PX} alignItems="center">
          <QuickActions />
          <Filters
            scrapeRuns={scrapeRunsData.runs}
            scrapeRunsFilter={scrapeRunsFilter}
            setScrapeRunsFilter={setScrapeRunsFilter}
            setPage={setPage}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        </Stack>
      </Stack>

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
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedPostings.size > 0 && selectedPostings.size < filteredPostings.length}
                    checked={filteredPostings.length > 0 && selectedPostings.size === filteredPostings.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'company'}
                    direction={sortField === 'company' ? sortDirection : 'asc'}
                    onClick={() => handleSort('company')}
                  >
                    Company
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'title'}
                    direction={sortField === 'title' ? sortDirection : 'asc'}
                    onClick={() => handleSort('title')}
                  >
                    Title
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'location'}
                    direction={sortField === 'location' ? sortDirection : 'asc'}
                    onClick={() => handleSort('location')}
                  >
                    Location
                  </TableSortLabel>
                </TableCell>

                <TableCell>
                  <TableSortLabel
                    active={sortField === 'status'}
                    direction={sortField === 'status' ? sortDirection : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>

                <TableCell>
                  <Tooltip
                    title="AI matched jobs are highlighted, but accuracy is still being evaluated. All results are shown regardless."
                    arrow
                  >
                    <span style={{ position: 'relative', top: 6, paddingRight: SPACING.SMALL.PX }}>
                      <Icon name="info" />
                    </span>
                  </Tooltip>
                  <TableSortLabel
                    active={sortField === 'recommendedByAI'}
                    direction={sortField === 'recommendedByAI' ? sortDirection : 'asc'}
                    onClick={() => handleSort('recommendedByAI' as SortField)}
                  >
                    Recommended{' '}
                  </TableSortLabel>
                </TableCell>

                <TableCell>Explanation</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'createdAt'}
                    direction={sortField === 'createdAt' ? sortDirection : 'asc'}
                    onClick={() => handleSort('createdAt')}
                  >
                    Found On
                  </TableSortLabel>
                </TableCell>
                <TableCell width="90px" align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPostings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Stack spacing={SPACING.SMALL.PX} alignItems="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        {jobPostingsData.postings.length === 0
                          ? 'No job postings found. Run your first scrape to find jobs.'
                          : 'No postings match the current filter.'}
                      </Typography>
                      {jobPostingsData.postings.length > 0 && statusFilter.length > 0 && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setStatusFilter([...DEFAULT_STATUS_FILTERS])
                            setPage(0)
                            setScrapeRunsFilter([])
                          }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPostings.map((posting) => (
                  <TableRow key={posting.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedPostings.has(posting.id)}
                        onChange={() => handleTogglePosting(posting.id)}
                      />
                    </TableCell>
                    <TableCell>{posting.siteTitle || '-'}</TableCell>
                    <TableCell>{posting.title}</TableCell>
                    <TableCell>{posting.location || '-'}</TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center">
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={posting.status}
                            onChange={(e) => handleUpdateStatus(posting.id, e.target.value as PostingStatus)}
                            renderValue={(value) => (
                              <Chip
                                label={value.charAt(0).toUpperCase() + value.slice(1)}
                                color={getStatusColor(value)}
                                size="small"
                              />
                            )}
                          >
                            <MenuItem value="new">New</MenuItem>
                            <MenuItem value="applied">Applied</MenuItem>
                            <MenuItem value="interview">Interview</MenuItem>
                            <MenuItem value="offer">Offer</MenuItem>
                            <MenuItem value="skipped">Skipped</MenuItem>
                            <MenuItem value="rejected">Rejected</MenuItem>
                          </Select>
                        </FormControl>
                        <Tooltip title="Skip Posting">
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateStatus(posting.id, 'skipped')}
                            sx={{ ml: 1 }}
                          >
                            <Icon name="skip" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {posting.recommendedByAI ? (
                        <Chip label="AI Match" color="success" size="small" />
                      ) : (
                        <Chip label="Not Recommended" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={posting.explanation || 'No explanation'}>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 275,
                          }}
                        >
                          {`${posting.explanation?.slice(0, 75)}...` || '-'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{new Date(posting.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit Posting">
                        <IconButton
                          size="small"
                          onClick={() => {
                            activeModalSignal.value = {
                              id: MODAL_ID.EDIT_POSTING_MODAL,
                              postingId: posting.id,
                            }
                          }}
                        >
                          <Icon name="edit" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Open job posting in browser">
                        <span>
                          <Link url={posting.siteUrl} />
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
        <TablePagination
          rowsPerPageOptions={PAGINATION.ROWS_PER_PAGE_OPTIONS}
          component="div"
          count={filteredPostings.length}
          rowsPerPage={rowsPerPage}
          page={page}
          sx={{ flexShrink: 0 }}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </PageWrapper>
  )
}

export default Postings
