import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { CHANNEL } from '../../../../shared/messages.types'
import ipcMessenger from '../../../ipcMessenger'
import { activeModalSignal } from '../../../signals'
import { SPACING } from '../../../styles/consts'
import { logger } from '../../../utilities'
import { MODAL_ID } from '../Modal.consts'
import DefaultModal from './DefaultModal'

export interface AddPromptModalProps {
  id: typeof MODAL_ID.ADD_PROMPT_MODAL
  onSuccess?: () => void
}

export interface EditPromptModalProps {
  id: typeof MODAL_ID.EDIT_PROMPT_MODAL
  promptId: string
  onSuccess?: () => void
}

type PromptModalProps = AddPromptModalProps | EditPromptModalProps
type PromptStatus = 'active' | 'inactive'

const PromptModal = (props: PromptModalProps) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<PromptStatus>('active')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = props.id === MODAL_ID.EDIT_PROMPT_MODAL

  const loadPrompt = useCallback(async (id: string) => {
    try {
      setLoading(true)
      const result = await ipcMessenger.invoke(CHANNEL.PROMPTS.GET_BY_ID, {
        id,
      })
      if (result.prompt) {
        setTitle(result.prompt.title)
        setContent(result.prompt.content)
        setStatus(result.prompt.status)
      }
    } catch (err) {
      setError('Failed to load prompt')
      logger.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleClose = () => {
    activeModalSignal.value = null
  }

  useEffect(() => {
    if (isEdit && 'promptId' in props) {
      loadPrompt(props.promptId)
    }
  }, [isEdit, props, loadPrompt])

  const handleSave = async () => {
    setError(null)

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!content.trim()) {
      setError('Content is required')
      return
    }

    try {
      setLoading(true)

      if (isEdit && 'promptId' in props) {
        const result = await ipcMessenger.invoke(CHANNEL.PROMPTS.UPDATE, {
          id: props.promptId,
          title,
          content,
          status,
        })

        if (!result.success) {
          setError(result.error || 'Failed to update prompt')
          return
        }
      } else {
        const result = await ipcMessenger.invoke(CHANNEL.PROMPTS.CREATE, {
          title,
          content,
          status,
        })

        if (!result.success) {
          setError(result.error || 'Failed to create prompt')
          return
        }
      }

      props.onSuccess?.()
      activeModalSignal.value = null
    } catch (err) {
      setError('An error occurred')
      logger.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DefaultModal title={isEdit ? 'Edit Prompt' : 'Add Prompt'} sx={{ width: '800px' }}>
      <Box>
        <Stack spacing={SPACING.MEDIUM.PX}>
          {error && <Box sx={{ color: 'error.main', fontSize: '0.875rem' }}>{error}</Box>}

          <TextField
            size="small"
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            disabled={loading}
            placeholder="e.g., Senior Full Stack Engineer"
          />

          <Alert severity="info" sx={{ mb: SPACING.MEDIUM.PX }}>
            <Typography variant="subtitle2" gutterBottom>
              <strong>How to create effective prompts:</strong>
            </Typography>
            <Typography variant="body2">
              1. Upload your resume(s) to ChatGPT and ask: &quot;Take my resume and extract all useful tokens and
              keywords for finding relevant jobs, return this as a prompt I can give you in the future.&quot;
            </Typography>
            <Typography variant="body2">
              2. Create a prompt like: &quot;I&apos;m looking for jobs that match my background. Use the following
              tokens and keywords to find highly relevant roles for me: Full Stack Software Engineer, Senior Software
              Engineer, Tech Lead, React, English, Spanish, Remote&quot;
            </Typography>
            <Typography variant="body2">
              3. You can create multiple prompts for different job types (e.g., one for senior roles, one for startup
              positions, etc.)
            </Typography>
          </Alert>

          <TextField
            size="small"
            label="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            fullWidth
            multiline
            rows={6}
            disabled={loading}
          />

          <FormControl component="fieldset" disabled={loading}>
            <FormLabel component="legend">Status</FormLabel>
            <RadioGroup row value={status} onChange={(e) => setStatus(e.target.value as PromptStatus)}>
              <FormControlLabel value="active" control={<Radio />} label="Active" />
              <FormControlLabel value="inactive" control={<Radio />} label="Inactive" />
            </RadioGroup>
          </FormControl>

          <Stack direction="row" spacing={SPACING.SMALL.PX} justifyContent="flex-end">
            <Button variant="outlined" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} variant="contained" disabled={loading || !title.trim() || !content.trim()}>
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </DefaultModal>
  )
}

export default PromptModal
