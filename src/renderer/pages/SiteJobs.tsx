import {
  Box,
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
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CHANNEL } from '../../shared/messages.types'
import ipcMessenger from '../ipcMessenger'
import Link from '../sharedComponents/Link'
import Message from '../sharedComponents/Message'
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
  title: string
  siteUrl: string
  siteId?: number | null
  explanation?: string | null
  status: PostingStatus
  createdAt: Date
  updatedAt: Date
}

interface Site {
  id: number
  siteTitle: string
  siteUrl: string
}

type SortField = 'title' | 'status' | 'createdAt'
type SortDirection = 'asc' | 'desc'

const SiteJobs = () => {
  const { siteId } = useParams<{ siteId: string }>()
  const [site, setSite] = useState<Site | null>(null)
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | PostingStatus>('all')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

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

    // Handle null/undefined values
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const filteredPostings = sortedPostings.filter(posting => {
    if (statusFilter === 'all') return true
    return posting.status === statusFilter
  })

  const loadSiteAndJobs = async () => {
    if (!siteId) {
      setError('Invalid site ID')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const siteResult = await ipcMessenger.invoke(CHANNEL.SITES.GET_BY_ID, {
        id: parseInt(siteId),
      })

      if (!siteResult.site) {
        setError('Site not found')
        setLoading(false)
        return
      }

      setSite(siteResult.site)

      const postingsResult = await ipcMessenger.invoke(
        CHANNEL.JOB_POSTINGS.GET_BY_SITE_ID,
        { siteId: parseInt(siteId) },
      )
      setJobPostings(postingsResult.postings)
    } catch (err) {
      setError('Failed to load site jobs')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSiteAndJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId])

  const handleStatusChange = async (
    postingId: number,
    newStatus: PostingStatus,
  ) => {
    try {
      const result = await ipcMessenger.invoke(
        CHANNEL.JOB_POSTINGS.UPDATE_STATUS,
        {
          id: postingId,
          status: newStatus,
        },
      )
      if (result.success) {
        await loadSiteAndJobs()
      } else {
        setError('Failed to update posting status')
      }
    } catch (err) {
      setError('Failed to update posting status')
      console.error(err)
    }
  }

  if (loading) {
    return <></>
  }

  if (error) {
    return (
      <Box sx={{ p: SPACING.LARGE.PX }}>
        <Message message={error} color="error" />
      </Box>
    )
  }

  if (!site) {
    return (
      <Box sx={{ p: SPACING.LARGE.PX }}>
        <Message message="Site not found" color="error" />
      </Box>
    )
  }

  const statusOptions: {
    value: PostingStatus
    label: string
    color:
      | 'default'
      | 'primary'
      | 'secondary'
      | 'error'
      | 'info'
      | 'success'
      | 'warning'
  }[] = [
    { value: 'new', label: 'New', color: 'info' },
    { value: 'applied', label: 'Applied', color: 'success' },
    { value: 'skipped', label: 'Skipped', color: 'default' },
    { value: 'interview', label: 'Interview', color: 'primary' },
    { value: 'rejected', label: 'Rejected', color: 'error' },
    { value: 'offer', label: 'Offer', color: 'success' },
  ]

  return (
    <Box sx={{ p: SPACING.LARGE.PX }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: SPACING.MEDIUM.PX }}
      >
        <Stack>
          <Typography variant="h4">{site.siteTitle}</Typography>
          <Typography variant="body2" color="textSecondary">
            {jobPostings.length} total job{jobPostings.length !== 1 ? 's' : ''}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={SPACING.SMALL.PX} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              onChange={e =>
                setStatusFilter(e.target.value as 'all' | PostingStatus)
              }
              label="Status Filter"
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="new">New</MenuItem>
              <MenuItem value="applied">Applied</MenuItem>
              <MenuItem value="skipped">Skipped</MenuItem>
              <MenuItem value="interview">Interview</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="offer">Offer</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'title'}
                  direction={sortField === 'title' ? sortDirection : 'asc'}
                  onClick={() => handleSort('title')}
                >
                  Title
                </TableSortLabel>
              </TableCell>
              <TableCell>Explanation</TableCell>
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
            {filteredPostings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Stack
                    spacing={SPACING.SMALL.PX}
                    alignItems="center"
                    sx={{ py: 4 }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      {jobPostings.length === 0
                        ? 'No jobs found for this site.'
                        : 'No jobs match the current filter.'}
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              filteredPostings.map(posting => (
                <TableRow key={posting.id} hover>
                  <TableCell>
                    <Typography variant="body2">{posting.title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{
                        maxWidth: 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {posting.explanation || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={posting.status}
                        onChange={e =>
                          handleStatusChange(
                            posting.id,
                            e.target.value as PostingStatus,
                          )
                        }
                        renderValue={value => {
                          const option = statusOptions.find(
                            opt => opt.value === value,
                          )
                          return (
                            <Chip
                              label={option?.label}
                              color={option?.color}
                              size="small"
                            />
                          )
                        }}
                      >
                        {statusOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
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

export default SiteJobs
