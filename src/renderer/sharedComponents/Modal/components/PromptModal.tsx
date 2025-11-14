import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
} from '@mui/material'
import { useEffect, useState } from 'react'
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
  promptId: number
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

  useEffect(() => {
    if (isEdit && 'promptId' in props) {
      loadPrompt(props.promptId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadPrompt = async (id: number) => {
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
  }

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
    <DefaultModal title={isEdit ? 'Edit Prompt' : 'Add Prompt'}>
      <Box>
        <Stack spacing={SPACING.MEDIUM.PX}>
          {error && (
            <Box sx={{ color: 'error.main', fontSize: '0.875rem' }}>
              {error}
            </Box>
          )}

          <TextField
            size="small"
            label="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            fullWidth
            disabled={loading}
            placeholder="e.g., Senior Full Stack Engineer"
            helperText="Give your prompt a descriptive name"
          />

          <TextField
            size="small"
            label="Content"
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            fullWidth
            multiline
            rows={12}
            disabled={loading}
            placeholder={`I'm looking for jobs that match my background. Use the following tokens and keywords to find highly relevant roles for me:

Full Stack Software Engineer, Senior Software Engineer, Tech Lead, React, TypeScript, Node.js, Python, Remote, USA

Use these to match roles by relevance, not just by keyword overlap.`}
            helperText="Enter the full prompt text that will be used for job matching. Include relevant skills, technologies, job titles, and locations."
          />

          <FormControl component="fieldset" disabled={loading}>
            <FormLabel component="legend">Status</FormLabel>
            <RadioGroup
              row
              value={status}
              onChange={e => setStatus(e.target.value as PromptStatus)}
            >
              <FormControlLabel
                value="active"
                control={<Radio />}
                label="Active"
              />
              <FormControlLabel
                value="inactive"
                control={<Radio />}
                label="Inactive"
              />
            </RadioGroup>
          </FormControl>

          <Stack
            direction="row"
            spacing={SPACING.SMALL.PX}
            justifyContent="flex-end"
          >
            <Button
              variant="outlined"
              onClick={() => (activeModalSignal.value = null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={loading || !title.trim() || !content.trim()}
            >
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </DefaultModal>
  )
}

export default PromptModal
