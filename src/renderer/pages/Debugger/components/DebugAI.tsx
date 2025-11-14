import {
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { CHANNEL } from '../../../../shared/messages.types'
import { Prompt, StoreSchema } from '../../../../shared/types'
import { renderPrompt } from '../../../../shared/utils'
import ipcMessenger from '../../../ipcMessenger'
import Message from '../../../sharedComponents/Message'
import { SPACING } from '../../../styles/consts'

const DebugAI = ({
  url,
  scrapedHtml,
}: {
  url: string
  scrapedHtml: string
}) => {
  const [loadingPrompts, setLoadingPrompts] = useState(true)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [promptId, setPromptId] = useState<number | ''>('')
  const [jobs, setJobs] = useState<string>('')
  const [storeFromServer, setStoreFromServer] = useState<StoreSchema | null>(
    null,
  )

  const loadStoreSettings = useCallback(async () => {
    const store = await ipcMessenger.invoke(CHANNEL.STORE.GET, undefined)
    setStoreFromServer(store)
    setLoadingSettings(false)
  }, [])

  const loadPrompts = async () => {
    try {
      setLoadingPrompts(true)
      setError(null)
      const result = await ipcMessenger.invoke(CHANNEL.PROMPTS.GET_ALL)
      setPrompts(result.prompts)
      setPromptId(result.prompts[0]?.id || '')
    } catch {
      setError('Failed to load prompts')
    } finally {
      setLoadingPrompts(false)
    }
  }

  const handleGenerateJobs = async () => {
    setLoadingJobs(true)
    setError(null)

    try {
      const response = await ipcMessenger.invoke(CHANNEL.DEBUG.AI, {
        prompt: prompts[prompts.findIndex(p => p.id === promptId)]?.content,
        siteContent: scrapedHtml,
        siteUrl: url,
        jobToJSONPrompt: storeFromServer?.openAiSiteHTMLToJSONJobsPrompt || '',
      })
      console.log('Response from DEBUG.AI:', response)
      setJobs(JSON.stringify(response.jobs, null, 2))
    } finally {
      setLoadingJobs(false)
    }
  }

  useEffect(() => {
    loadPrompts()
  }, [])

  useEffect(() => {
    loadStoreSettings()
  }, [loadStoreSettings])

  if (loadingPrompts || loadingSettings || !storeFromServer) return <></>

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
        <Select
          fullWidth
          value={promptId}
          onChange={e => setPromptId(e.target.value as number)}
          label="Prompt"
        >
          {prompts.map(prompt => (
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
          prompt:
            prompts[prompts.findIndex(p => p.id === promptId)]?.content || '',
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
