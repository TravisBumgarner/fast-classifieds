import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PromptDTO } from 'src/shared/types'
import { CHANNEL } from '../../../../shared/messages.types'
import { ROUTES, TOOLTIPS } from '../../../consts'
import ipcMessenger from '../../../ipcMessenger'
import { activeModalSignal } from '../../../signals'
import { SPACING } from '../../../styles/consts'
import { logger } from '../../../utilities'
import Icon from '../../Icon'
import { MODAL_ID } from '../Modal.consts'
import DefaultModal from './DefaultModal'

export interface AddSiteModalProps {
  id: typeof MODAL_ID.ADD_SITE_MODAL
  onSuccess?: () => void
}

export interface EditSiteModalProps {
  id: typeof MODAL_ID.EDIT_SITE_MODAL
  siteId: string
  onSuccess?: () => void
}

type SiteModalProps = AddSiteModalProps | EditSiteModalProps

type SiteStatus = 'active' | 'inactive'

const SiteModal = (props: SiteModalProps) => {
  const isEditMode = props.id === MODAL_ID.EDIT_SITE_MODAL
  const siteId = isEditMode ? (props as EditSiteModalProps).siteId : undefined
  const navigate = useNavigate()

  const [siteTitle, setSiteTitle] = useState('')
  const [siteUrl, setSiteUrl] = useState('')
  const [promptId, setPromptId] = useState<string>('')
  const [selector, setSelector] = useState('')
  const [status, setStatus] = useState<SiteStatus>('active')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prompts, setPrompts] = useState<PromptDTO[]>([])

  const handleUrlAndTitleSync = () => {
    if (!siteTitle) {
      try {
        setSiteTitle(new URL(siteUrl).hostname)
      } catch {
        logger.error('Invalid URL provided')
      }
    }
  }

  const handleUrlChange = (url: string) => {
    setSiteUrl(url)
  }

  const loadPrompts = useCallback(async () => {
    try {
      const result = await ipcMessenger.invoke(CHANNEL.PROMPTS.GET_ALL, undefined)
      // Filter to only show active prompts
      const activePrompts = result.prompts.filter((p) => p.status === 'active')
      setPrompts(activePrompts)
    } catch (err) {
      logger.error('Failed to load prompts:', err)
    }
  }, [])

  const handleClose = () => {
    activeModalSignal.value = null
  }

  const loadSite = useCallback(async () => {
    if (!siteId) return

    try {
      setLoading(true)
      const result = await ipcMessenger.invoke(CHANNEL.SITES.GET_BY_ID, {
        id: siteId,
      })
      if (result.site) {
        setSiteTitle(result.site.siteTitle)
        setSiteUrl(result.site.siteUrl)
        setSelector(result.site.selector)
        setStatus(result.site.status || 'active')

        // Find matching prompt by content
        const matchingPrompt = prompts.find((p) => p.id === result.site?.promptId)
        if (matchingPrompt) {
          setPromptId(matchingPrompt.id)
        }
      }
    } catch (err) {
      setError('Failed to load site')
      logger.error(err)
    } finally {
      setLoading(false)
    }
  }, [prompts, siteId])

  useEffect(() => {
    loadPrompts()
  }, [loadPrompts])

  useEffect(() => {
    if (isEditMode && siteId) {
      loadSite()
    }
  }, [isEditMode, siteId, loadSite])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const selectedPrompt = prompts.find((p) => p.id === promptId)
      if (!selectedPrompt) {
        setError('Please select a prompt')
        setLoading(false)
        return
      }

      if (isEditMode && siteId) {
        const result = await ipcMessenger.invoke(CHANNEL.SITES.UPDATE, {
          id: siteId,
          siteTitle,
          siteUrl,
          promptId: selectedPrompt.id,
          selector,
          status,
        })
        if (result.success) {
          props.onSuccess?.()
          activeModalSignal.value = null
        } else {
          setError(result.error || 'Failed to update site')
        }
      } else {
        const result = await ipcMessenger.invoke(CHANNEL.SITES.CREATE, {
          siteTitle,
          siteUrl,
          promptId: selectedPrompt.id,
          selector,
          status,
        })
        if (result.success) {
          props.onSuccess?.()
          activeModalSignal.value = null
        } else {
          setError(result.error || 'Failed to create site')
        }
      }
    } catch (err) {
      setError('An error occurred')
      logger.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (prompts.length === 0 && !loading) {
    return (
      <DefaultModal title={isEditMode ? 'Edit Site' : 'Add Site'}>
        <Stack spacing={SPACING.MEDIUM.PX} alignItems="center" py={4}>
          <Typography variant="h6" textAlign="center">
            No Active Prompts Available
          </Typography>
          <Typography variant="body1" textAlign="center" color="text.secondary">
            You need to have at least one active prompt before you can add a site. Please create a new prompt or
            activate an existing one.
          </Typography>
          <Stack direction="row" spacing={SPACING.SMALL.PX} justifyContent="center" width="100%">
            <Button variant="outlined" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                navigate(ROUTES.prompts.href())
                activeModalSignal.value = null
                // Navigate to Prompts page
              }}
            >
              Manage Prompts
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                activeModalSignal.value = {
                  id: MODAL_ID.ADD_PROMPT_MODAL,
                  onSuccess: () => {
                    // Reload prompts after creating new one
                    loadPrompts()
                  },
                }
              }}
            >
              Create Prompt
            </Button>
          </Stack>
        </Stack>
      </DefaultModal>
    )
  }

  return (
    <DefaultModal title={isEditMode ? 'Edit Site' : 'Add Site'}>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={SPACING.MEDIUM.PX}>
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          <TextField
            size="small"
            label="Site URL"
            value={siteUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            onBlur={handleUrlAndTitleSync}
            required
            fullWidth
            disabled={loading}
            type="url"
            placeholder="https://example.com/careers"
          />

          <TextField
            size="small"
            label="Site Title"
            value={siteTitle}
            onChange={(e) => setSiteTitle(e.target.value)}
            required
            fullWidth
            disabled={loading}
            placeholder="e.g., Company Name"
            helperText="Auto-generated from URL, but you can edit it"
          />

          <Stack direction="row" spacing={SPACING.SMALL.PX} alignItems="center">
            <TextField
              size="small"
              label="CSS Selector"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              required
              fullWidth
              disabled={loading}
              placeholder=".job-list or #jobs"
            />
            <Typography variant="body2">
              New to selectors?{' '}
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
            </Typography>
            <Tooltip title={TOOLTIPS.CSS_SELECTOR} arrow>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Icon name="info" size={20} />
              </Box>
            </Tooltip>
          </Stack>

          <FormControl fullWidth required disabled={loading} size="small">
            <InputLabel>Prompt</InputLabel>
            <Select value={promptId} onChange={(e) => setPromptId(e.target.value)} label="Prompt">
              {prompts.map((prompt) => (
                <MenuItem key={prompt.id} value={prompt.id}>
                  {prompt.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth required disabled={loading} size="small">
            <InputLabel>Status</InputLabel>
            <Select value={status} onChange={(e) => setStatus(e.target.value as SiteStatus)} label="Status">
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>

          <Stack direction="row" spacing={SPACING.SMALL.PX} justifyContent="flex-end">
            <Button variant="outlined" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !siteTitle || !siteUrl || !selector || !promptId}
            >
              {loading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </DefaultModal>
  )
}

export default SiteModal
