import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import { useEffect, useState } from 'react'
import { CHANNEL } from '../../shared/messages.types'
import ipcMessenger from '../ipcMessenger'
import Link from '../sharedComponents/Link'
import Message from '../sharedComponents/Message'
import { MODAL_ID } from '../sharedComponents/Modal/Modal.consts'
import { activeModalSignal, onboardingCompletedSignal } from '../signals'
import { SPACING } from '../styles/consts'

type PostingStatus =
  | 'new'
  | 'applied'
  | 'skipped'
  | 'interview'
  | 'rejected'
  | 'offer'

interface JobPosting {
  id: number
  company?: string | null
  title: string
  siteUrl: string
  siteId?: number | null
  explanation?: string | null
  status: PostingStatus
  createdAt: Date
  updatedAt: Date
}

type SortField = 'company' | 'title' | 'status' | 'createdAt'
type SortDirection = 'asc' | 'desc'

const Postings = () => {
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false)
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | PostingStatus>('all')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedPostings, setSelectedPostings] = useState<Set<number>>(
    new Set(),
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedPostings = [...jobPostings].sort((a, b) => {
    let aVal: string | number | Date | null | undefined
    let bVal: string | number | Date | null | undefined

    switch (sortField) {
      case 'company':
        aVal = a.company?.toLowerCase() || ''
        bVal = b.company?.toLowerCase() || ''
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
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const filteredPostings = sortedPostings.filter(posting => {
    if (statusFilter === 'all') return true
    return posting.status === statusFilter
  })

  const loadJobPostings = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await ipcMessenger.invoke(
        CHANNEL.JOB_POSTINGS.GET_ALL,
        undefined,
      )
      setJobPostings(result.postings)
    } catch (err) {
      setError('Failed to load job postings')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFindJobs = () => {
    activeModalSignal.value = {
      id: MODAL_ID.SCRAPE_PROGRESS_MODAL,
      onComplete: loadJobPostings,
    }
  }

  const handleOpenAllInBrowser = () => {
    filteredPostings.forEach(posting => {
      // @ts-expect-error - shell:openExternal is not in typed IPC but is defined in messages.ts
      window.electron.ipcRenderer.invoke('shell:openExternal', posting.siteUrl)
    })
  }

  const handleOpenSelectedInBrowser = () => {
    const postingsToOpen = filteredPostings.filter(posting =>
      selectedPostings.has(posting.id),
    )
    postingsToOpen.forEach(posting => {
      // @ts-expect-error - shell:openExternal is not in typed IPC but is defined in messages.ts
      window.electron.ipcRenderer.invoke('shell:openExternal', posting.siteUrl)
    })
    setSelectedPostings(new Set())
  }

  const handleTogglePosting = (id: number) => {
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
      setSelectedPostings(new Set(filteredPostings.map(p => p.id)))
    }
  }

  const handleUpdateStatus = async (id: number, newStatus: PostingStatus) => {
    try {
      const result = await ipcMessenger.invoke(
        CHANNEL.JOB_POSTINGS.UPDATE_STATUS,
        { id, status: newStatus },
      )
      if (result.success) {
        await loadJobPostings()
      } else {
        setError('Failed to update job posting status')
      }
    } catch (err) {
      setError('Failed to update job posting status')
      console.error(err)
    }
  }

  useEffect(() => {
    const checkFirstLaunch = async () => {
      if (hasCheckedOnboarding) return

      try {
        // Check if user has any prompts or sites
        const [promptsResult, sitesResult] = await Promise.all([
          ipcMessenger.invoke(CHANNEL.PROMPTS.GET_ALL, undefined),
          ipcMessenger.invoke(CHANNEL.SITES.GET_ALL, undefined),
        ])

        // If no prompts and no sites, show onboarding
        if (
          promptsResult.prompts.length === 0 &&
          sitesResult.sites.length === 0
        ) {
          activeModalSignal.value = { id: MODAL_ID.ONBOARDING_MODAL }
        }

        setHasCheckedOnboarding(true)
        // Signal that onboarding check is complete (whether shown or not)
        onboardingCompletedSignal.value = true
      } catch (err) {
        console.error('Error checking first launch:', err)
        setHasCheckedOnboarding(true)
        onboardingCompletedSignal.value = true
      }
    }

    checkFirstLaunch()
    loadJobPostings()
  }, [hasCheckedOnboarding])

  const getStatusColor = (
    status: PostingStatus,
  ): 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' => {
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
        return 'default'
      case 'rejected':
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
        <Typography variant="h4">Job Postings</Typography>
        <Stack direction="row" spacing={SPACING.SMALL.PX} alignItems="center">
          {selectedPostings.size > 0 && (
            <Button variant="outlined" onClick={handleOpenSelectedInBrowser}>
              Open Selected ({selectedPostings.size})
            </Button>
          )}
          <Button variant="contained" onClick={handleFindJobs}>
            Find Jobs
          </Button>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              onChange={e =>
                setStatusFilter(e.target.value as 'all' | PostingStatus)
              }
              label="Status Filter"
            >
              <MenuItem value="all">All Postings</MenuItem>
              <MenuItem value="new">New</MenuItem>
              <MenuItem value="applied">Applied</MenuItem>
              <MenuItem value="interview">Interview</MenuItem>
              <MenuItem value="offer">Offer</MenuItem>
              <MenuItem value="skipped">Skipped</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {filteredPostings.length === 0 && !error && !loading && (
        <Alert severity="info" sx={{ mb: SPACING.MEDIUM.PX }}>
          <Typography variant="subtitle2" gutterBottom>
            <strong>No job postings yet</strong>
          </Typography>
          <Typography variant="body2">
            Job postings will appear here after you run your first scrape. Make
            sure you&apos;ve added sites and prompts, then run a scrape to find
            matching jobs.
          </Typography>
        </Alert>
      )}

      {error && <Message message={error} color="error" />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedPostings.size > 0 &&
                    selectedPostings.size < filteredPostings.length
                  }
                  checked={
                    filteredPostings.length > 0 &&
                    selectedPostings.size === filteredPostings.length
                  }
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
                  active={sortField === 'status'}
                  direction={sortField === 'status' ? sortDirection : 'asc'}
                  onClick={() => handleSort('status')}
                >
                  Status
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
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPostings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Stack
                    spacing={SPACING.SMALL.PX}
                    alignItems="center"
                    sx={{ py: 4 }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      {jobPostings.length === 0
                        ? 'No job postings found. Run your first scrape to find jobs.'
                        : 'No postings match the current filter.'}
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              filteredPostings.map(posting => (
                <TableRow key={posting.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedPostings.has(posting.id)}
                      onChange={() => handleTogglePosting(posting.id)}
                    />
                  </TableCell>
                  <TableCell>{posting.company || '-'}</TableCell>
                  <TableCell>{posting.title}</TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={posting.status}
                        onChange={e =>
                          handleUpdateStatus(
                            posting.id,
                            e.target.value as PostingStatus,
                          )
                        }
                        renderValue={value => (
                          <Chip
                            label={
                              value.charAt(0).toUpperCase() + value.slice(1)
                            }
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
                  </TableCell>
                  <TableCell>
                    <Tooltip title={posting.explanation || 'No explanation'}>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 275,
                        }}
                      >
                        {posting.explanation?.slice(0, 75) + '...' || '-'}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {new Date(posting.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <Link url={posting.siteUrl} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default Postings
