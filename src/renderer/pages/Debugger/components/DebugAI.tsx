import { Box, Button, Divider, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CHANNEL } from '../../../../shared/messages.types'
import type { PromptDTO, StoreSchema } from '../../../../shared/types'
import { renderPrompt } from '../../../../shared/utils'
import { ROUTES } from '../../../consts'
import ipcMessenger from '../../../ipcMessenger'
import Message from '../../../sharedComponents/Message'
import { SPACING } from '../../../styles/consts'

const DebugAI = ({
  url,
  scrapedHtml,
  promptId,
  setPromptId,
}: {
  url: string
  scrapedHtml: string
  promptId: number | null
  setPromptId: React.Dispatch<React.SetStateAction<number | null>>
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

  const handleGenerateJobs = async () => {
    setLoadingJobs(true)
    setError(null)

    try {
      const response = await ipcMessenger.invoke(CHANNEL.DEBUG.AI, {
        prompt: prompts[prompts.findIndex((p) => p.id === promptId)]?.content,
        siteContent: scrapedHtml,
        siteUrl: url,
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

      <FormControl required size="small" sx={{ gap: SPACING.SMALL.PX }}>
        <InputLabel>Prompt</InputLabel>
        <Select fullWidth value={promptId} onChange={(e) => setPromptId(e.target.value as number)} label="Prompt">
          {prompts.map((prompt) => (
            <MenuItem key={prompt.id} value={prompt.id}>
              {prompt.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

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
          siteContent: scrapedHtml,
          siteUrl: url,
          jobToJSONPrompt: storeFromServer.openAiSiteHTMLToJSONJobsPrompt,
        })}
      </Typography>

      <Button
        onClick={handleGenerateJobs}
        fullWidth
        variant="contained"
        disabled={!promptId || !scrapedHtml || !url || loadingJobs}
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
