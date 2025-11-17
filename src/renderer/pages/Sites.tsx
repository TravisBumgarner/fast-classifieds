import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  FormControl,
  FormControlLabel,
  FormGroup,
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
import { Fragment, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CHANNEL } from '../../shared/messages.types'
import type { JobPostingDTO, SiteDTO } from '../../shared/types'
import { PAGINATION, ROUTES } from '../consts'
import ipcMessenger from '../ipcMessenger'
import Icon from '../sharedComponents/Icon'
import Link from '../sharedComponents/Link'
import Message from '../sharedComponents/Message'
import { MODAL_ID } from '../sharedComponents/Modal/Modal.consts'
import PageWrapper from '../sharedComponents/PageWrapper'
import { activeModalSignal } from '../signals'
import { SPACING } from '../styles/consts'
import { logger } from '../utilities'

type SiteStatus = 'active' | 'inactive'

type PostingStatus = 'new' | 'applied' | 'skipped' | 'interview' | 'rejected' | 'offer'

type SortField = 'siteTitle' | 'status' | 'updatedAt'
type SortDirection = 'asc' | 'desc'

const Sites = () => {
  const [sites, setSites] = useState<(SiteDTO & { totalJobs: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<SiteStatus[]>(['active', 'inactive'])
  const [sortField, setSortField] = useState<SortField>('siteTitle')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null)
  const [siteJobs, setSiteJobs] = useState<Record<string, JobPostingDTO[]>>({})
  const [loadingJobs, setLoadingJobs] = useState<Record<string, boolean>>({})
  const [page, setPage] = useState(0)
  const navigate = useNavigate()
  const [rowsPerPage, setRowsPerPage] = useState(PAGINATION.DEFAULT_ROWS_PER_PAGE)

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

  const filteredSites = sortedSites.filter((site) => {
    if (statusFilter.length === 0) return true
    return statusFilter.includes(site.status)
  })

  const paginatedSites = filteredSites.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
    setExpandedSiteId(null) // Collapse expanded rows when changing pages
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
    setExpandedSiteId(null)
  }

  const loadSites = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await ipcMessenger.invoke(CHANNEL.SITES.GET_ALL_WITH_JOB_COUNTS, undefined)
      setSites(result.sites)
    } catch (err) {
      setError('Failed to load sites')
      logger.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSites()
  }, [loadSites])

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

  const handleEditSite = (site: SiteDTO) => {
    activeModalSignal.value = {
      id: MODAL_ID.EDIT_SITE_MODAL,
      siteId: site.id,
      onSuccess: loadSites,
    }
  }

  const handleDeleteSite = async (id: string, siteTitle: string) => {
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
          logger.error(err)
        }
      },
    }
  }

  const handleToggleExpand = async (siteId: string) => {
    if (expandedSiteId === siteId) {
      setExpandedSiteId(null)
    } else {
      setExpandedSiteId(siteId)

      // Load jobs if not already loaded
      if (!siteJobs[siteId]) {
        setLoadingJobs((prev) => ({ ...prev, [siteId]: true }))
        try {
          const result = await ipcMessenger.invoke(CHANNEL.JOB_POSTINGS.GET_BY_SITE_ID, { siteId })
          setSiteJobs((prev) => ({ ...prev, [siteId]: result.postings }))
        } catch (err) {
          logger.error('Failed to load jobs for site:', err)
        } finally {
          setLoadingJobs((prev) => ({ ...prev, [siteId]: false }))
        }
      }
    }
  }

  const handleStatusChange = async (postingId: string, newStatus: PostingStatus, siteId: string) => {
    try {
      const result = await ipcMessenger.invoke(CHANNEL.JOB_POSTINGS.UPDATE, {
        id: postingId,
        data: { status: newStatus },
      })
      if (result.success) {
        // Reload jobs for this site
        const jobsResult = await ipcMessenger.invoke(CHANNEL.JOB_POSTINGS.GET_BY_SITE_ID, { siteId })
        setSiteJobs((prev) => ({ ...prev, [siteId]: jobsResult.postings }))
      } else {
        setError('Failed to update posting status')
      }
    } catch (err) {
      setError('Failed to update posting status')
      logger.error(err)
    }
  }

  const statusOptions: {
    value: PostingStatus
    label: string
    color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
  }[] = [
    { value: 'new', label: 'New', color: 'info' },
    { value: 'applied', label: 'Applied', color: 'success' },
    { value: 'skipped', label: 'Skipped', color: 'default' },
    { value: 'interview', label: 'Interview', color: 'primary' },
    { value: 'rejected', label: 'Rejected', color: 'error' },
    { value: 'offer', label: 'Offer', color: 'success' },
  ]

  if (loading) {
    return
  }

  return (
    <PageWrapper>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: SPACING.MEDIUM.PX }}>
        <Stack direction="row" spacing={SPACING.SMALL.PX} alignItems="center">
          <Button size="small" variant="contained" onClick={handleAddSite}>
            Add Site
          </Button>
          <Button size="small" variant="outlined" onClick={() => navigate(ROUTES.debugger.href())}>
            Setup New Site
          </Button>
          <Button size="small" variant="outlined" onClick={handleImportSites}>
            Import Sites
          </Button>
        </Stack>

        <FormControl component="fieldset">
          <FormGroup row>
            {(['active', 'inactive'] as SiteStatus[]).map((status) => (
              <FormControlLabel
                key={status}
                control={
                  <Checkbox
                    checked={statusFilter.includes(status)}
                    onChange={() => {
                      const newFilter = statusFilter.includes(status)
                        ? statusFilter.filter((s) => s !== status)
                        : [...statusFilter, status]
                      setStatusFilter(newFilter)
                      setPage(0)
                    }}
                    size="small"
                  />
                }
                label={status.charAt(0).toUpperCase() + status.slice(1)}
              />
            ))}
          </FormGroup>
        </FormControl>
      </Stack>

      {sites.length === 0 && !error && !loading && (
        <Alert severity="info" sx={{ mb: SPACING.MEDIUM.PX }}>
          <Typography variant="subtitle2" gutterBottom>
            <strong>Getting started with sites:</strong>
          </Typography>
          <Typography variant="body2" paragraph>
            Add career pages from companies you&apos;re interested in. For each site, you&apos;ll need:
          </Typography>
          <Typography variant="body2" component="div">
            • <strong>Site Title:</strong> Company name (e.g., &quot;Acme Corp&quot;)
            <br />• <strong>URL:</strong> Link to their careers page
            <br />• <strong>CSS Selector:</strong> Target the job listings container (e.g., &quot;.job-list&quot; or
            &quot;#jobs&quot;). Use &quot;body&quot; if unsure. New to selectors?{' '}
            <a
              href="https://www.youtube.com/watch?v=4rQ9Alr6GIk&feature=youtu.be"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'underline',
              }}
              onClick={(e) => {
                e.preventDefault()
                window.electron.shell.openExternal('https://www.youtube.com/watch?v=4rQ9Alr6GIk&feature=youtu.be')
              }}
            >
              Watch the tutorial
            </a>
            <br />• <strong>Prompt:</strong> Select which prompt to use for matching jobs
          </Typography>
        </Alert>
      )}

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
                <TableCell
                  align="right"
                  sx={{
                    width: '200px',
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Stack spacing={SPACING.SMALL.PX} alignItems="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        {sites.length === 0
                          ? 'No sites found. Click "Add Site" or "Import Sites" to get started.'
                          : 'No sites match the current filter.'}
                      </Typography>
                      {sites.length > 0 && statusFilter.length > 0 && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setStatusFilter(['active', 'inactive'])
                            setPage(0)
                          }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSites.map((site) => {
                  const isExpanded = expandedSiteId === site.id
                  const jobs = siteJobs[site.id] || []
                  const loading = loadingJobs[site.id] || false

                  return (
                    <Fragment key={site.id}>
                      <TableRow hover>
                        <TableCell padding="checkbox">
                          <Tooltip title={isExpanded ? 'Collapse job listings' : 'Expand job listings'}>
                            <IconButton onClick={() => handleToggleExpand(site.id)}>
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
                            label={site.status.charAt(0).toUpperCase() + site.status.slice(1)}
                            color={site.status === 'active' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{new Date(site.updatedAt).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                          <Tooltip title={`Open site in browser: ${site.siteUrl}`}>
                            <span>
                              <Link url={site.siteUrl} />
                            </span>
                          </Tooltip>
                          <Tooltip title="Debug Site">
                            <IconButton onClick={() => navigate(ROUTES.debugger.href(site.id))}>
                              <Icon name="debug" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit site">
                            <IconButton onClick={() => handleEditSite(site)}>
                              <Icon name="edit" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete site">
                            <IconButton onClick={() => handleDeleteSite(site.id, site.siteTitle)} color="error">
                              <Icon name="delete" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
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
                                    {jobs.map((job) => (
                                      <TableRow key={job.id}>
                                        <TableCell>
                                          <Typography variant="body2">{job.title}</Typography>
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
                                          <FormControl size="small" sx={{ minWidth: 150 }}>
                                            <Select
                                              value={job.status}
                                              onChange={(e) =>
                                                handleStatusChange(job.id, e.target.value as PostingStatus, site.id)
                                              }
                                              renderValue={(value) => {
                                                const option = statusOptions.find((opt) => opt.value === value)
                                                return <Chip label={option?.label} color={option?.color} />
                                              }}
                                            >
                                              {statusOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                  {option.label}
                                                </MenuItem>
                                              ))}
                                            </Select>
                                          </FormControl>
                                        </TableCell>
                                        <TableCell>{new Date(job.createdAt).toLocaleDateString()}</TableCell>
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
                    </Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Box>
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
    </PageWrapper>
  )
}

export default Sites
