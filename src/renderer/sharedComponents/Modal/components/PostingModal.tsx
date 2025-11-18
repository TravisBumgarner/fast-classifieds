import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import type { JobPostingDTO, PostingStatus } from 'src/shared/types'
import { CHANNEL } from '../../../../shared/messages.types'
import ipcMessenger from '../../../ipcMessenger'
import { activeModalSignal } from '../../../signals'
import { SPACING } from '../../../styles/consts'
import { logger } from '../../../utilities'
import type { MODAL_ID } from '../Modal.consts'
import DefaultModal from './DefaultModal'

export interface EditPostingModalProps {
  id: typeof MODAL_ID.EDIT_POSTING_MODAL
  postingId: string
}

type PostingModalProps = EditPostingModalProps

const POSTING_STATUSES: PostingStatus[] = ['new', 'applied', 'skipped', 'interview', 'rejected', 'offer']

const PostingModal = (props: PostingModalProps) => {
  const isEditMode = props.id === 'EDIT_POSTING_MODAL'
  const postingId = isEditMode ? (props as EditPostingModalProps).postingId : undefined

  const [siteTitle, setSiteTitle] = useState('')
  const [title, setTitle] = useState('')
  const [siteUrl, setSiteUrl] = useState('')
  const [explanation, setExplanation] = useState('')
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState<PostingStatus>('new')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    activeModalSignal.value = null
  }

  const loadPosting = useCallback(async () => {
    if (!postingId) return
    try {
      setLoading(true)
      const result = await ipcMessenger.invoke(CHANNEL.JOB_POSTINGS.GET_ALL, undefined)
      const posting = result.postings.find((p: JobPostingDTO) => p.id === postingId)
      if (posting) {
        setSiteTitle(posting.siteTitle)
        setTitle(posting.title)
        setSiteUrl(posting.siteUrl)
        setExplanation(posting.explanation)
        setLocation(posting.location)
        setStatus(posting.status)
      }
    } catch (err) {
      setError('Failed to load posting')
      logger.error(err)
    } finally {
      setLoading(false)
    }
  }, [postingId])

  useEffect(() => {
    if (isEditMode && postingId) {
      loadPosting()
    }
  }, [isEditMode, postingId, loadPosting])

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
      if (isEditMode && postingId) {
        const result = await ipcMessenger.invoke(CHANNEL.JOB_POSTINGS.UPDATE, {
          id: postingId,
          data: {
            title,
            siteUrl,
            explanation,
            location,
            status,
          },
        })
        if (result.success) {
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
            label="Explanation"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            disabled={loading}
            placeholder="Why this job was matched..."
          />

          <FormControl fullWidth required disabled={loading} size="small">
            <InputLabel>Status</InputLabel>
            <Select value={status} onChange={(e) => setStatus(e.target.value as PostingStatus)} label="Status">
              {POSTING_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
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

export default PostingModal
