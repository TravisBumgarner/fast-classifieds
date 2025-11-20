import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { CHANNEL } from '../../../../shared/messages.types'
import type { JobPostingDTO, JobPostingDuplicateStatus, JobPostingStatus } from '../../../../shared/types'
import { QUERY_KEYS } from '../../../consts'
import ipcMessenger from '../../../ipcMessenger'
import logger from '../../../logger'
import { activeModalSignal } from '../../../signals'
import { SPACING } from '../../../styles/consts'
import { formatSelectOption } from '../../../utilities'
import type { MODAL_ID } from '../Modal.consts'
import DefaultModal from './DefaultModal'

export interface EditJobPostingModalProps {
  id: typeof MODAL_ID.EDIT_JOB_POSTING_MODAL
  jobPostingId: string
}

type JobPostingModalProps = EditJobPostingModalProps

const JOB_POSTING_STATUSES: JobPostingStatus[] = ['new', 'applied', 'skipped', 'interview', 'rejected', 'offer']

const JobPostingModal = (props: JobPostingModalProps) => {
  const isEditMode = props.id === 'EDIT_JOB_POSTING_MODAL'
  const jobPostingId = isEditMode ? (props as EditJobPostingModalProps).jobPostingId : undefined

  const [siteTitle, setSiteTitle] = useState('')
  const [title, setTitle] = useState('')
  const [siteUrl, setSiteUrl] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState<JobPostingStatus>('new')
  const [duplicateStatus, setDuplicateStatus] = useState<JobPostingDuplicateStatus>('unique')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const handleClose = () => {
    activeModalSignal.value = null
  }

  const loadJobPosting = useCallback(async () => {
    if (!jobPostingId) return
    try {
      setLoading(true)
      const result = await ipcMessenger.invoke(CHANNEL.JOB_POSTINGS.GET_ALL, undefined)
      const posting = result.postings.find((p: JobPostingDTO) => p.id === jobPostingId)
      if (posting) {
        setSiteTitle(posting.siteTitle)
        setTitle(posting.title)
        setSiteUrl(posting.siteUrl)
        setDescription(posting.description)
        setLocation(posting.location)
        setStatus(posting.status)
        // Don't allow selecting 'suspected_duplicate' in this editor; default to 'unique' if encountered
        setDuplicateStatus(posting.duplicateStatus === 'suspected_duplicate' ? 'unique' : posting.duplicateStatus)
      }
    } catch (err) {
      setError('Failed to load posting')
      logger.error(err)
    } finally {
      setLoading(false)
    }
  }, [jobPostingId])

  useEffect(() => {
    if (isEditMode && jobPostingId) {
      loadJobPosting()
    }
  }, [isEditMode, jobPostingId, loadJobPosting])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (!title.trim() || !siteUrl.trim() || !status) {
        setError('Title, Site URL, and Status are required')
        setLoading(false)
        return
      }
      if (isEditMode && jobPostingId) {
        const result = await ipcMessenger.invoke(CHANNEL.JOB_POSTINGS.UPDATE, {
          id: jobPostingId,
          data: {
            title,
            siteUrl,
            description,
            location,
            status,
            duplicateStatus,
          },
        })
        if (result.success) {
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.JOB_POSTINGS] })
          activeModalSignal.value = null
        } else {
          setError(result.error || 'Failed to update posting')
        }
      } else {
        // No CREATE channel for postings in current API, so just close for now
        setError('Adding new postings is not supported via modal.')
      }
    } catch (err) {
      setError('An error occurred')
      logger.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DefaultModal title={isEditMode ? 'Edit Posting' : 'Add Posting'}>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={SPACING.MEDIUM.PX}>
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          <TextField
            size="small"
            label="Company"
            value={siteTitle}
            onChange={(e) => setSiteTitle(e.target.value)}
            fullWidth
            disabled
            placeholder="e.g., Acme Corp"
          />

          <TextField
            size="small"
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            disabled={loading}
            placeholder="e.g., Senior Software Engineer"
          />

          <TextField
            size="small"
            label="Site URL"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            required
            fullWidth
            disabled={loading}
            type="url"
            placeholder="https://example.com/job"
          />

          <TextField
            size="small"
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            fullWidth
            disabled={loading}
            placeholder="e.g., Remote, San Francisco, CA"
          />

          <TextField
            size="small"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            disabled={loading}
            placeholder="Why this job was matched..."
          />

          <FormControl fullWidth required disabled={loading} size="small">
            <InputLabel>Status</InputLabel>
            <Select value={status} onChange={(e) => setStatus(e.target.value as JobPostingStatus)} label="Status">
              {JOB_POSTING_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {formatSelectOption(s)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={loading} size="small">
            <InputLabel>Duplicate Status</InputLabel>
            <Select
              value={duplicateStatus}
              label="Duplicate Status"
              onChange={(e) => setDuplicateStatus(e.target.value as JobPostingDuplicateStatus)}
            >
              {(['unique', 'confirmed_duplicate'] as JobPostingDuplicateStatus[]).map((s) => (
                <MenuItem key={s} value={s}>
                  {formatSelectOption(s)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack direction="row" spacing={SPACING.SMALL.PX} justifyContent="flex-end">
            <Button variant="outlined" onClick={handleClose} disabled={loading} type="button">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading || !title.trim() || !siteUrl.trim() || !status}>
              {loading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </DefaultModal>
  )
}

export default JobPostingModal
