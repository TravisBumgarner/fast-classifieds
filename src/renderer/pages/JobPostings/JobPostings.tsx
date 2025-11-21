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
import { useEffect, useState } from 'react'
import {
  AI_RECOMMENDATION_STATUS,
  type JobPostingStatus,
  type AIRecommendationStatus as TypeAIRecommendationStatus,
} from '../../../shared/types'
import { CHANNEL_INVOKES_FROM_MAIN } from '../../../shared/types/messages.fromMain'
import { CHANNEL_INVOKES } from '../../../shared/types/messages.invokes'
import { PAGINATION, QUERY_KEYS } from '../../consts'
import ipcMessenger from '../../ipcMessenger'
import logger from '../../logger'
import Icon from '../../sharedComponents/Icon'
import Link from '../../sharedComponents/Link'
import Message from '../../sharedComponents/Message'
import { MODAL_ID } from '../../sharedComponents/Modal/Modal.consts'
import PageWrapper from '../../sharedComponents/PageWrapper'
import { activeModalSignal } from '../../signals'
import { SPACING } from '../../styles/consts'
import Filters, { DEFAULT_STATUS_FILTERS } from './components/Filters'
import QuickActions from './components/QuickActions'

type SortField = 'company' | 'title' | 'status' | 'createdAt' | 'location' | 'aiRecommendationStatus'
type SortDirection = 'asc' | 'desc'

const AIRecommendationStatus = ({ status, id }: { status: TypeAIRecommendationStatus; id: string }) => {
  const markAsHumanOverride = async () => {
    await ipcMessenger.invoke(CHANNEL_INVOKES.JOB_POSTINGS.UPDATE, {
      id,
      data: { aiRecommendationStatus: AI_RECOMMENDATION_STATUS.HUMAN_OVERRIDE },
    })
  }

  if (status === AI_RECOMMENDATION_STATUS.RECOMMENDED) {
    return <Chip label="AI Match" color="success" size="small" />
  }

  if (status === AI_RECOMMENDATION_STATUS.NOT_RECOMMENDED) {
    return (
      <Box>
        <Chip label="No match" color="default" size="small" />
        <Tooltip title="Mark as human approved">
          <IconButton onClick={markAsHumanOverride}>
            <Icon name="check" />
          </IconButton>
        </Tooltip>
      </Box>
    )
  }

  if (status === AI_RECOMMENDATION_STATUS.HUMAN_OVERRIDE) {
    return <Chip label="User Match" color="info" size="small" />
  }
}

const JobPostings = () => {
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<JobPostingStatus[]>([...DEFAULT_STATUS_FILTERS])
  const [scrapeRunsFilter, setScrapeRunsFilter] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedJobPostings, setSelectedJobPostings] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(PAGINATION.DEFAULT_ROWS_PER_PAGE)
  const [isScraping, setIsScraping] = useState(false)
  const queryClient = useQueryClient()

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const { isLoading: isLoadingScrapeRuns, data: scrapeRunsData } = useQuery({
    queryKey: [QUERY_KEYS.SCRAPE_RUNS],
    queryFn: async () => await ipcMessenger.invoke(CHANNEL_INVOKES.SCRAPE_RUNS.GET_ALL, undefined),
    initialData: { runs: [] },
  })

  const { isLoading: isLoadingJobPostings, data: jobPostingsData } = useQuery({
    queryKey: [QUERY_KEYS.JOB_POSTINGS],
    queryFn: async () => await ipcMessenger.invoke(CHANNEL_INVOKES.JOB_POSTINGS.GET_ALL, undefined),
    initialData: { postings: [], suspectedDuplicatesCount: 0 },
  })

  const sortedJobPostings = [...jobPostingsData.postings].sort((a, b) => {
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

  const filteredJobPostings = sortedJobPostings.filter((posting) => {
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

  const paginatedJobPostings = filteredJobPostings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleFindJobPostings = async () => {
    try {
      const active = await ipcMessenger.invoke(CHANNEL_INVOKES.SCRAPER.GET_ACTIVE_RUN, undefined)
      if (active?.hasActive) {
        setIsScraping(true)
        activeModalSignal.value = { id: MODAL_ID.SCRAPE_PROGRESS_MODAL }
      } else {
        const result = await ipcMessenger.invoke(CHANNEL_INVOKES.SCRAPER.START, undefined)
        if (result.success) {
          setIsScraping(true)
          activeModalSignal.value = { id: MODAL_ID.SCRAPE_PROGRESS_MODAL }
        } else {
          // Show error inside progress modal for consistent UX
          activeModalSignal.value = {
            id: MODAL_ID.SCRAPE_PROGRESS_MODAL,
            initialError: result.error || 'No sites available to scrape',
          }
        }
      }
    } catch (err) {
      // Fallback to modal error display
      activeModalSignal.value = {
        id: MODAL_ID.SCRAPE_PROGRESS_MODAL,
        initialError: 'Failed to start scraping',
      }
      logger.error(err)
    }
  }

  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on(CHANNEL_INVOKES_FROM_MAIN.SCRAPE.COMPLETE, () => {
      setIsScraping(false)
    })
    return () => {
      unsubscribe()
    }
  }, [])

  const handleOpenSelectedInBrowser = () => {
    const postingsToOpen = filteredJobPostings.filter((posting) => selectedJobPostings.has(posting.id))
    postingsToOpen.forEach((posting) => {
      ipcMessenger.invoke(CHANNEL_INVOKES.UTILS.OPEN_URL, { url: posting.siteUrl })
    })
    setSelectedJobPostings(new Set())
  }

  const handleToggleJobPosting = (id: string) => {
    const newSelected = new Set(selectedJobPostings)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedJobPostings(newSelected)
  }

  const handleSelectAllJobPostings = () => {
    if (selectedJobPostings.size === filteredJobPostings.length) {
      setSelectedJobPostings(new Set())
    } else {
      setSelectedJobPostings(new Set(filteredJobPostings.map((p) => p.id)))
    }
  }

  const handleSelectedDuplicateJobPostings = () => {
    activeModalSignal.value = {
      id: MODAL_ID.DUPLICATE_POSTINGS_MODAL,
    }
  }

  const handleUpdateJobPostingStatus = async (id: string, newStatus: JobPostingStatus) => {
    try {
      const result = await ipcMessenger.invoke(CHANNEL_INVOKES.JOB_POSTINGS.UPDATE, {
        id,
        data: { status: newStatus },
      })
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.JOB_POSTINGS] })
      } else {
        setError('Failed to update job posting status')
      }
    } catch (err) {
      setError('Failed to update job posting status')
      logger.error(err)
    }
  }

  const getJobPostingStatusColor = (status: JobPostingStatus): 'primary' | 'success' | 'error' | 'info' => {
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
          <Button size="small" variant="contained" onClick={handleFindJobPostings}>
            {isScraping ? 'Finding jobs…' : 'Find Jobs'}
          </Button>
          {selectedJobPostings.size > 0 && (
            <Button size="small" variant="outlined" onClick={handleOpenSelectedInBrowser}>
              Open Selected ({selectedJobPostings.size})
            </Button>
          )}
          {jobPostingsData.suspectedDuplicatesCount > 0 && (
            <Button color="error" size="small" variant="outlined" onClick={handleSelectedDuplicateJobPostings}>
              Suspected duplicates found! ({jobPostingsData.suspectedDuplicatesCount})
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
                    indeterminate={
                      selectedJobPostings.size > 0 && selectedJobPostings.size < filteredJobPostings.length
                    }
                    checked={filteredJobPostings.length > 0 && selectedJobPostings.size === filteredJobPostings.length}
                    onChange={handleSelectAllJobPostings}
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
                    active={sortField === 'aiRecommendationStatus'}
                    direction={sortField === 'aiRecommendationStatus' ? sortDirection : 'asc'}
                    onClick={() => handleSort('aiRecommendationStatus' as SortField)}
                  >
                    Recommended{' '}
                  </TableSortLabel>
                </TableCell>

                <TableCell>Description</TableCell>
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
              {filteredJobPostings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
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
                paginatedJobPostings.map((jobPosting) => (
                  <TableRow key={jobPosting.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedJobPostings.has(jobPosting.id)}
                        onChange={() => handleToggleJobPosting(jobPosting.id)}
                      />
                    </TableCell>
                    <TableCell>{jobPosting.siteTitle || '-'}</TableCell>
                    <TableCell>{jobPosting.title}</TableCell>
                    <TableCell>{jobPosting.location || '-'}</TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center">
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={jobPosting.status}
                            onChange={(e) =>
                              handleUpdateJobPostingStatus(jobPosting.id, e.target.value as JobPostingStatus)
                            }
                            renderValue={(value) => (
                              <Chip
                                label={value.charAt(0).toUpperCase() + value.slice(1)}
                                color={getJobPostingStatusColor(value)}
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
                            onClick={() => handleUpdateJobPostingStatus(jobPosting.id, 'skipped')}
                            sx={{ ml: 1 }}
                          >
                            <Icon name="skip" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <AIRecommendationStatus id={jobPosting.id} status={jobPosting.aiRecommendationStatus} />
                      <Tooltip title={jobPosting.recommendationExplanation}>
                        <span>
                          <Icon name="info" />
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={jobPosting.description || 'No description'}>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 275,
                          }}
                        >
                          {`${jobPosting.description?.slice(0, 75)}...` || '-'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{new Date(jobPosting.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit Posting">
                        <IconButton
                          size="small"
                          onClick={() => {
                            activeModalSignal.value = {
                              id: MODAL_ID.EDIT_JOB_POSTING_MODAL,
                              jobPostingId: jobPosting.id,
                            }
                          }}
                        >
                          <Icon name="edit" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Open job posting in browser">
                        <span>
                          <Link url={jobPosting.jobUrl} />
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
          count={filteredJobPostings.length}
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

export default JobPostings
