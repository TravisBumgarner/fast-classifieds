import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  FormControl,
  IconButton,
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
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { CHANNEL } from '../../shared/messages.types'
import { PAGINATION } from '../consts'
import ipcMessenger from '../ipcMessenger'
import Icon from '../sharedComponents/Icon'
import Link from '../sharedComponents/Link'
import Message from '../sharedComponents/Message'
import { MODAL_ID } from '../sharedComponents/Modal/Modal.consts'
import { activeModalSignal } from '../signals'
import { SPACING } from '../styles/consts'

type SiteStatus = 'active' | 'inactive'

type PostingStatus =
  | 'new'
  | 'applied'
  | 'skipped'
  | 'interview'
  | 'rejected'
  | 'offer'

interface Site {
  id: number
  siteTitle: string
  siteUrl: string
  prompt: string
  selector: string
  status: SiteStatus
  createdAt: Date
  updatedAt: Date
  totalJobs: number
}

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

type SortField = 'siteTitle' | 'status' | 'updatedAt'
type SortDirection = 'asc' | 'desc'

const Sites = () => {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | SiteStatus>('all')
  const [sortField, setSortField] = useState<SortField>('siteTitle')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [expandedSiteId, setExpandedSiteId] = useState<number | null>(null)
  const [siteJobs, setSiteJobs] = useState<Record<number, JobPosting[]>>({})
  const [loadingJobs, setLoadingJobs] = useState<Record<number, boolean>>({})
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(
    PAGINATION.DEFAULT_ROWS_PER_PAGE,
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedSites = [...sites].sort((a, b) => {
    let aVal: string | number | Date
    let bVal: string | number | Date

    switch (sortField) {
      case 'siteTitle':
        aVal = a.siteTitle.toLowerCase()
        bVal = b.siteTitle.toLowerCase()
        break
      case 'status':
        aVal = a.status
        bVal = b.status
        break
      case 'updatedAt':
        aVal = new Date(a.updatedAt).getTime()
        bVal = new Date(b.updatedAt).getTime()
        break
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const filteredSites = sortedSites.filter(site => {
    if (statusFilter === 'all') return true
    return site.status === statusFilter
  })

  const paginatedSites = filteredSites.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  )

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
    setExpandedSiteId(null) // Collapse expanded rows when changing pages
  }

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
    setExpandedSiteId(null)
  }

  const loadSites = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await ipcMessenger.invoke(
        CHANNEL.SITES.GET_ALL_WITH_JOB_COUNTS,
        undefined,
      )
      setSites(result.sites)
    } catch (err) {
      setError('Failed to load sites')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSites()
  }, [])

  const handleAddSite = () => {
    activeModalSignal.value = {
      id: MODAL_ID.ADD_SITE_MODAL,
      onSuccess: loadSites,
    }
  }

  const handleImportSites = () => {
    activeModalSignal.value = {
      id: MODAL_ID.IMPORT_SITES_MODAL,
      onSuccess: loadSites,
    }
  }

  const handleEditSite = (site: Site) => {
    activeModalSignal.value = {
      id: MODAL_ID.EDIT_SITE_MODAL,
      siteId: site.id,
      onSuccess: loadSites,
    }
  }

  const handleDeleteSite = async (id: number, siteTitle: string) => {
    activeModalSignal.value = {
      id: MODAL_ID.CONFIRMATION_MODAL,
      title: 'Delete Site',
      body: `Are you sure you want to delete "${siteTitle}"?`,
      showCancel: true,
      confirmationCallback: async () => {
        try {
          const result = await ipcMessenger.invoke(CHANNEL.SITES.DELETE, { id })
          if (result.success) {
            await loadSites()
          } else {
            setError('Failed to delete site')
          }
        } catch (err) {
          setError('Failed to delete site')
          console.error(err)
        }
      },
    }
  }

  const handleToggleExpand = async (siteId: number) => {
    if (expandedSiteId === siteId) {
      setExpandedSiteId(null)
    } else {
      setExpandedSiteId(siteId)

      // Load jobs if not already loaded
      if (!siteJobs[siteId]) {
        setLoadingJobs(prev => ({ ...prev, [siteId]: true }))
        try {
          const result = await ipcMessenger.invoke(
            CHANNEL.JOB_POSTINGS.GET_BY_SITE_ID,
            { siteId },
          )
          setSiteJobs(prev => ({ ...prev, [siteId]: result.postings }))
        } catch (err) {
          console.error('Failed to load jobs for site:', err)
        } finally {
          setLoadingJobs(prev => ({ ...prev, [siteId]: false }))
        }
      }
    }
  }

  const handleStatusChange = async (
    postingId: number,
    newStatus: PostingStatus,
    siteId: number,
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
        // Reload jobs for this site
        const jobsResult = await ipcMessenger.invoke(
          CHANNEL.JOB_POSTINGS.GET_BY_SITE_ID,
          { siteId },
        )
        setSiteJobs(prev => ({ ...prev, [siteId]: jobsResult.postings }))
      } else {
        setError('Failed to update posting status')
      }
    } catch (err) {
      setError('Failed to update posting status')
      console.error(err)
    }
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
        <Typography variant="h4">Sites</Typography>
        <Stack direction="row" spacing={SPACING.SMALL.PX} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              onChange={e =>
                setStatusFilter(e.target.value as 'all' | SiteStatus)
              }
              label="Status Filter"
            >
              <MenuItem value="all">All Sites</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={() =>
              (activeModalSignal.value = { id: MODAL_ID.DEBUG_SCRAPE_MODAL })
            }
          >
            Debug Scraper
          </Button>
          <Button variant="outlined" onClick={handleImportSites}>
            Import Sites
          </Button>
          <Button variant="contained" onClick={handleAddSite}>
            Add Site
          </Button>
        </Stack>
      </Stack>

      {sites.length === 0 && !error && !loading && (
        <Alert severity="info" sx={{ mb: SPACING.MEDIUM.PX }}>
          <Typography variant="subtitle2" gutterBottom>
            <strong>Getting started with sites:</strong>
          </Typography>
          <Typography variant="body2" paragraph>
            Add career pages from companies you&apos;re interested in. For each
            site, you&apos;ll need:
          </Typography>
          <Typography variant="body2" component="div">
            • <strong>Site Title:</strong> Company name (e.g., &quot;Acme
            Corp&quot;)
            <br />• <strong>URL:</strong> Link to their careers page
            <br />• <strong>CSS Selector:</strong> Target the job listings
            container (e.g., &quot;.job-list&quot; or &quot;#jobs&quot;). Use
            &quot;body&quot; if unsure.
            <br />• <strong>Prompt:</strong> Select which prompt to use for
            matching jobs
          </Typography>
        </Alert>
      )}

      {error && <Message message={error} color="error" />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>
                <TableSortLabel
                  active={sortField === 'siteTitle'}
                  direction={sortField === 'siteTitle' ? sortDirection : 'asc'}
                  onClick={() => handleSort('siteTitle')}
                >
                  Company
                </TableSortLabel>
              </TableCell>
              <TableCell>Selector</TableCell>
              <TableCell>Total Jobs</TableCell>
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
                  active={sortField === 'updatedAt'}
                  direction={sortField === 'updatedAt' ? sortDirection : 'asc'}
                  onClick={() => handleSort('updatedAt')}
                >
                  Updated
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Stack
                    spacing={SPACING.SMALL.PX}
                    alignItems="center"
                    sx={{ py: 4 }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      {sites.length === 0
                        ? 'No sites found. Click "Add Site" or "Import Sites" to get started.'
                        : 'No sites match the current filter.'}
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              paginatedSites.map(site => {
                const isExpanded = expandedSiteId === site.id
                const jobs = siteJobs[site.id] || []
                const loading = loadingJobs[site.id] || false

                return (
                  <>
                    <TableRow key={site.id} hover>
                      <TableCell padding="checkbox">
                        <Tooltip
                          title={
                            isExpanded
                              ? 'Collapse job listings'
                              : 'Expand job listings'
                          }
                        >
                          <IconButton
                            onClick={() => handleToggleExpand(site.id)}
                          >
                            <Icon name={isExpanded ? 'down' : 'right'} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{site.siteTitle}</TableCell>
                      <TableCell>
                        <code>{site.selector}</code>
                      </TableCell>
                      <TableCell>{site.totalJobs}</TableCell>
                      <TableCell>
                        <Chip
                          label={
                            site.status.charAt(0).toUpperCase() +
                            site.status.slice(1)
                          }
                          color={
                            site.status === 'active' ? 'success' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(site.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Open site in browser">
                          <span>
                            <Link url={site.siteUrl} />
                          </span>
                        </Tooltip>
                        <Tooltip title="Debug scraper">
                          <IconButton
                            onClick={() =>
                              (activeModalSignal.value = {
                                id: MODAL_ID.DEBUG_SCRAPE_MODAL,
                                siteId: site.id,
                              })
                            }
                          >
                            <Icon name="debug" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit site">
                          <IconButton onClick={() => handleEditSite(site)}>
                            <Icon name="edit" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete site">
                          <IconButton
                            onClick={() =>
                              handleDeleteSite(site.id, site.siteTitle)
                            }
                            color="error"
                          >
                            <Icon name="delete" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        style={{ paddingBottom: 0, paddingTop: 0 }}
                        colSpan={7}
                      >
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2 }}>
                            {loading ? (
                              <Typography variant="body2" color="textSecondary">
                                Loading jobs...
                              </Typography>
                            ) : jobs.length === 0 ? (
                              <Typography variant="body2" color="textSecondary">
                                No jobs found for this site.
                              </Typography>
                            ) : (
                              <Table>
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Title</TableCell>
                                    <TableCell>Explanation</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Created</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {jobs.map(job => (
                                    <TableRow key={job.id}>
                                      <TableCell>
                                        <Typography variant="body2">
                                          {job.title}
                                        </Typography>
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
                                          {job.explanation || '-'}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <FormControl sx={{ minWidth: 120 }}>
                                          <Select
                                            value={job.status}
                                            onChange={e =>
                                              handleStatusChange(
                                                job.id,
                                                e.target.value as PostingStatus,
                                                site.id,
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
                                                />
                                              )
                                            }}
                                          >
                                            {statusOptions.map(option => (
                                              <MenuItem
                                                key={option.value}
                                                value={option.value}
                                              >
                                                {option.label}
                                              </MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>
                                      </TableCell>
                                      <TableCell>
                                        {new Date(
                                          job.createdAt,
                                        ).toLocaleDateString()}
                                      </TableCell>
                                      <TableCell align="right">
                                        <Tooltip title="Open job posting in browser">
                                          <span>
                                            <Link url={job.siteUrl} />
                                          </span>
                                        </Tooltip>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
                )
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={PAGINATION.ROWS_PER_PAGE_OPTIONS}
          component="div"
          count={filteredSites.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  )
}

export default Sites
