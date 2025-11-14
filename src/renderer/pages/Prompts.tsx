import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  FormGroup,
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
import { useEffect, useState } from 'react'
import { CHANNEL } from '../../shared/messages.types'
import { PromptDTO, PromptStatus } from '../../shared/types'
import { PAGINATION } from '../consts'
import ipcMessenger from '../ipcMessenger'
import Icon from '../sharedComponents/Icon'
import Message from '../sharedComponents/Message'
import { MODAL_ID } from '../sharedComponents/Modal/Modal.consts'
import PageWrapper from '../sharedComponents/PageWrapper'
import { activeModalSignal } from '../signals'
import { SPACING } from '../styles/consts'
import { logger } from '../utilities'

type SortField = 'title' | 'status' | 'updatedAt'
type SortDirection = 'asc' | 'desc'

const Prompts = () => {
  const [prompts, setPrompts] = useState<PromptDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [statusFilter, setStatusFilter] = useState<PromptStatus[]>([
    'active',
    'inactive',
  ])
  const [sortField, setSortField] = useState<SortField>('title')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
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

  const sortedPrompts = [...prompts].sort((a, b) => {
    let aVal: string | number
    let bVal: string | number

    switch (sortField) {
      case 'title':
        aVal = a.title.toLowerCase()
        bVal = b.title.toLowerCase()
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

  const filteredPrompts = sortedPrompts.filter(prompt => {
    if (statusFilter.length === 0) return true
    return statusFilter.includes(prompt.status)
  })

  const paginatedPrompts = filteredPrompts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  )

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const loadPrompts = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await ipcMessenger.invoke(
        CHANNEL.PROMPTS.GET_ALL,
        undefined,
      )
      setPrompts(result.prompts)
    } catch (err) {
      setError('Failed to load prompts')
      logger.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPrompts()
  }, [])

  const handleAddPrompt = () => {
    activeModalSignal.value = {
      id: MODAL_ID.ADD_PROMPT_MODAL,
      onSuccess: loadPrompts,
    }
  }

  const handleEditPrompt = (prompt: PromptDTO) => {
    activeModalSignal.value = {
      id: MODAL_ID.EDIT_PROMPT_MODAL,
      promptId: prompt.id,
      onSuccess: loadPrompts,
    }
  }

  const handleDeletePrompt = async (id: number, title: string) => {
    activeModalSignal.value = {
      id: MODAL_ID.CONFIRMATION_MODAL,
      title: 'Delete Prompt',
      body: `Are you sure you want to delete "${title}"?`,
      showCancel: true,
      confirmationCallback: async () => {
        try {
          const result = await ipcMessenger.invoke(CHANNEL.PROMPTS.DELETE, {
            id,
          })
          if (result.success) {
            await loadPrompts()
          } else {
            setError('Failed to delete prompt')
          }
        } catch (err) {
          setError('Failed to delete prompt')
          logger.error(err)
        }
      },
    }
  }

  const toggleRowExpansion = (id: number) => {
    const newExpandedRows = new Set(expandedRows)
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id)
    } else {
      newExpandedRows.add(id)
    }
    setExpandedRows(newExpandedRows)
  }

  if (loading) {
    return <></>
  }

  return (
    <PageWrapper>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ marginBottom: SPACING.MEDIUM.PX }}
      >
        <Button variant="contained" onClick={handleAddPrompt} size="small">
          Add Prompt
        </Button>

        <FormControl component="fieldset">
          <FormGroup row>
            {(['active', 'inactive'] as PromptStatus[]).map(status => (
              <FormControlLabel
                key={status}
                control={
                  <Checkbox
                    checked={statusFilter.includes(status)}
                    onChange={() => {
                      const newFilter = statusFilter.includes(status)
                        ? statusFilter.filter(s => s !== status)
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

      {prompts.length === 0 && !error && (
        <Alert severity="info" sx={{ mb: SPACING.MEDIUM.PX }}>
          <Typography variant="subtitle2" gutterBottom>
            <strong>How to create effective prompts:</strong>
          </Typography>
          <Typography variant="body2" paragraph>
            1. Upload your resume(s) to ChatGPT and ask: &quot;Take my resume
            and extract all useful tokens and keywords for finding relevant
            jobs, return this as a prompt I can give you in the future..&quot;
          </Typography>
          <Typography variant="body2" paragraph>
            2. Create a prompt like: &quot;I&apos;m looking for jobs that match
            my background. Use the following tokens and keywords to find highly
            relevant roles for me: Full Stack Software Engineer, Senior Software
            Engineer, Tech Lead, React, English, Spanish, Remote&quot;
          </Typography>
          <Typography variant="body2">
            3. You can create multiple prompts for different job types (e.g.,
            one for senior roles, one for startup positions, etc.)
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
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'title'}
                    direction={sortField === 'title' ? sortDirection : 'asc'}
                    onClick={() => handleSort('title')}
                  >
                    Title
                  </TableSortLabel>
                </TableCell>
                <TableCell>Prompt</TableCell>
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
                    direction={
                      sortField === 'updatedAt' ? sortDirection : 'asc'
                    }
                    onClick={() => handleSort('updatedAt')}
                  >
                    Updated
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPrompts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Stack
                      spacing={SPACING.SMALL.PX}
                      alignItems="center"
                      sx={{ py: 4 }}
                    >
                      <Typography variant="body2" color="textSecondary">
                        {prompts.length === 0
                          ? 'No prompts found. Click "Add Prompt" to create your first one.'
                          : 'No prompts match the current filter.'}
                      </Typography>
                      {prompts.length > 0 && statusFilter.length > 0 && (
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
                      {prompts.length === 0 && (
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{ fontStyle: 'italic' }}
                        >
                          Example: &quot;Senior Full Stack Engineer&quot; with
                          keywords like React, TypeScript, Node.js, Remote
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPrompts.map(prompt => {
                  const isExpanded = expandedRows.has(prompt.id)
                  const contentLength = prompt.content.length
                  const showToggle = contentLength > 100 // Only show if content is longer than 100 characters

                  return (
                    <TableRow key={prompt.id} hover>
                      <TableCell>{prompt.title}</TableCell>
                      <TableCell>
                        {isExpanded || !showToggle ? (
                          <Typography
                            variant="body2"
                            sx={{ whiteSpace: 'pre-wrap' }}
                          >
                            {prompt.content}
                          </Typography>
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 400,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {prompt.content}
                          </Typography>
                        )}
                        {showToggle && (
                          <Button
                            size="small"
                            onClick={() => toggleRowExpansion(prompt.id)}
                            sx={{ mt: 0.5 }}
                          >
                            {isExpanded ? 'Show less' : 'Show more'}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            prompt.status === 'active' ? 'Active' : 'Inactive'
                          }
                          color={
                            prompt.status === 'active' ? 'success' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(prompt.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit prompt">
                          <IconButton
                            size="small"
                            onClick={() => handleEditPrompt(prompt)}
                          >
                            <Icon name="edit" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete prompt">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleDeletePrompt(prompt.id, prompt.title)
                            }
                            color="error"
                          >
                            <Icon name="delete" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Box>
        <TablePagination
          rowsPerPageOptions={PAGINATION.ROWS_PER_PAGE_OPTIONS}
          component="div"
          count={filteredPrompts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </PageWrapper>
  )
}

export default Prompts
