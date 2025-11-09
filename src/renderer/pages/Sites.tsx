import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Link as MuiLink,
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
import Icon from '../sharedComponents/Icon'
import Message from '../sharedComponents/Message'
import { MODAL_ID } from '../sharedComponents/Modal/Modal.consts'
import { activeModalSignal } from '../signals'
import { SPACING } from '../styles/consts'

type SiteStatus = 'active' | 'inactive'

interface Site {
  id: number
  siteTitle: string
  siteUrl: string
  prompt: string
  selector: string
  status: SiteStatus
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

  const loadSites = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await ipcMessenger.invoke(CHANNEL.SITES.GET_ALL, undefined)
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
    if (!confirm(`Are you sure you want to delete "${siteTitle}"?`)) {
      return
    }

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
              <TableCell>
                <TableSortLabel
                  active={sortField === 'siteTitle'}
                  direction={sortField === 'siteTitle' ? sortDirection : 'asc'}
                  onClick={() => handleSort('siteTitle')}
                >
                  Company
                </TableSortLabel>
              </TableCell>
              <TableCell>URL</TableCell>
              <TableCell>Selector</TableCell>
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
                <TableCell colSpan={6} align="center">
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
              filteredSites.map(site => (
                <TableRow key={site.id} hover>
                  <TableCell>{site.siteTitle}</TableCell>
                  <TableCell>
                    <Tooltip title={site.siteUrl} placement="right">
                      <MuiLink
                        component="button"
                        variant="body2"
                        onClick={() => {
                          window.electron.shell.openExternal(site.siteUrl)
                        }}
                        sx={{ cursor: 'pointer' }}
                      >
                        Link
                      </MuiLink>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <code>{site.selector}</code>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        site.status.charAt(0).toUpperCase() +
                        site.status.slice(1)
                      }
                      color={site.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(site.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Debug scraper">
                      <IconButton
                        size="small"
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
                      <IconButton
                        size="small"
                        onClick={() => handleEditSite(site)}
                      >
                        <Icon name="edit" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete site">
                      <IconButton
                        size="small"
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
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default Sites
