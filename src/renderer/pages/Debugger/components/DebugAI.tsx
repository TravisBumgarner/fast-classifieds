import {
  Box,
  Button,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CHANNEL } from '../../../../shared/messages.types'
import type { PromptDTO, ScrapedContentDTO, StoreSchema } from '../../../../shared/types'
import { renderPrompt } from '../../../../shared/utils'
import { ROUTES } from '../../../consts'
import ipcMessenger from '../../../ipcMessenger'
import Icon from '../../../sharedComponents/Icon'
import Message from '../../../sharedComponents/Message'
import { activeModalSignal } from '../../../signals'
import { SPACING } from '../../../styles/consts'

const DebugAI = ({
  url,
  scrapedContent,
  promptId,
  setPromptId,
}: {
  url: string
  scrapedContent: ScrapedContentDTO
  promptId: string | null
  setPromptId: React.Dispatch<React.SetStateAction<string | null>>
}) => {
  const [loadingPrompts, setLoadingPrompts] = useState(true)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prompts, setPrompts] = useState<PromptDTO[]>([])
  const [jobs, setJobs] = useState<string>('')
  const navigate = useNavigate()
  const [storeFromServer, setStoreFromServer] = useState<StoreSchema | null>(null)

  const loadStoreSettings = useCallback(async () => {
    const store = await ipcMessenger.invoke(CHANNEL.STORE.GET, undefined)
    setStoreFromServer(store)
    setLoadingSettings(false)
  }, [])

  const loadPrompts = useCallback(async () => {
    try {
      setLoadingPrompts(true)
      setError(null)
      const result = await ipcMessenger.invoke(CHANNEL.PROMPTS.GET_ALL)
      setPrompts(result.prompts)
      setPromptId(result.prompts[0]?.id || null)
    } catch {
      setError('Failed to load prompts')
    } finally {
      setLoadingPrompts(false)
    }
  }, [setPromptId])

  const handleEditPrompt = () => {
    if (!promptId) return
    activeModalSignal.value = {
      id: 'EDIT_PROMPT_MODAL',
      promptId,
      onSuccess: () => {
        loadPrompts()
      },
    }
  }

  const handleGenerateJobs = async () => {
    setLoadingJobs(true)
    setError(null)

    try {
      const response = await ipcMessenger.invoke(CHANNEL.DEBUG.AI, {
        prompt: prompts[prompts.findIndex((p) => p.id === promptId)]?.content,
        scrapedContent,
        siteUrl: url,
        siteId: '',
        jobToJSONPrompt: storeFromServer?.openAiSiteHTMLToJSONJobsPrompt || '',
      })
      setJobs(JSON.stringify(response.jobs, null, 2))
    } finally {
      setLoadingJobs(false)
    }
  }

  useEffect(() => {
    loadPrompts()
  }, [loadPrompts])

  useEffect(() => {
    loadStoreSettings()
  }, [loadStoreSettings])

  if (loadingPrompts || loadingSettings || !storeFromServer) return

  if (!prompts.length) {
    return (
      <Box>
        <Message
          message="No prompts available. Please create a prompt first."
          color="error"
          callback={() => navigate(ROUTES.prompts.href())}
          callbackText="Go to Prompts"
        />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.SMALL.PX,
      }}
    >
      {error && <Message message={error} color="error" />}

      <Stack direction="row" alignItems="center" spacing={SPACING.SMALL.PX}>
        <FormControl fullWidth required size="small" sx={{ gap: SPACING.SMALL.PX }}>
          <InputLabel>Prompt</InputLabel>
          <Select fullWidth value={promptId} onChange={(e) => setPromptId(e.target.value)} label="Prompt">
            {prompts.map((prompt) => (
              <MenuItem key={prompt.id} value={prompt.id}>
                {prompt.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tooltip title="Edit the selected prompt">
          <IconButton onClick={handleEditPrompt}>
            <Icon name="edit" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Typography>Full Prompt</Typography>

      <Typography
        component="pre"
        sx={{
          flex: 1,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          border: '1px solid #ccc',
          p: SPACING.SMALL.PX,
          minHeight: 0,
        }}
      >
        {renderPrompt({
          prompt: prompts[prompts.findIndex((p) => p.id === promptId)]?.content || '',
          scrapedContent,
          siteUrl: url,
          jobToJSONPrompt: storeFromServer.openAiSiteHTMLToJSONJobsPrompt,
        })}
      </Typography>

      <Button
        onClick={handleGenerateJobs}
        fullWidth
        variant="contained"
        disabled={!promptId || !scrapedContent || !url || loadingJobs}
      >
        {loadingJobs ? 'Generating Jobs...' : 'Generate Jobs'}
      </Button>

      <Divider />

      <Typography>Generated Jobs</Typography>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          border: '1px solid #ccc',
          p: SPACING.SMALL.PX,
          minHeight: 0,
        }}
      >
        {jobs}
      </Box>
    </Box>
  )
}

export default DebugAI
