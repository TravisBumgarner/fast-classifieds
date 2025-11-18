import { Alert, Box, Button, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'
import { CHANNEL } from '../../../../shared/messages.types'
import ipcMessenger from '../../../ipcMessenger'
import Icon from '../../../sharedComponents/Icon'
import { SPACING } from '../../../styles/consts'

const TabOpenAI = ({
  loadStoreSettings,
  initialOpenAiApiKey,
  initialOpenAIModel,
}: {
  loadStoreSettings: () => Promise<void>
  initialOpenAiApiKey: string
  initialOpenAIModel: string
}) => {
  const [apiKey, setApiKey] = useState<string>(initialOpenAiApiKey)
  const [model, setModel] = useState<string>(initialOpenAIModel)
  const hasChanges = apiKey !== initialOpenAiApiKey || model !== initialOpenAIModel

  const [apiMessage, setApiMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleSaveApiSettings = async () => {
    try {
      await ipcMessenger.invoke(CHANNEL.STORE.SET, {
        openaiApiKey: apiKey,
        openaiModel: model,
      })
      setApiMessage({
        type: 'success',
        text: 'API settings saved successfully',
      })
      loadStoreSettings()
    } catch {
      setApiMessage({
        type: 'error',
        text: 'Failed to save API settings',
      })
    }
  }

  return (
    <Box sx={{ p: SPACING.MEDIUM.PX }}>
      <Typography variant="subtitle2" gutterBottom>
        OpenAI API Configuration
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: SPACING.SMALL.PX }}>
        Configure your OpenAI API key and model for job scraping
      </Typography>

      {apiMessage && (
        <Alert severity={apiMessage.type} sx={{ mb: SPACING.MEDIUM.PX }}>
          {apiMessage.text}
        </Alert>
      )}

      <Stack spacing={SPACING.SMALL.PX}>
        <Stack direction="row" spacing={SPACING.SMALL.PX} alignItems="center">
          <TextField
            label="API Key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            fullWidth
            size="small"
          />
          <Tooltip
            title={
              <span>
                <a
                  href="https://platform.openai.com/settings/organization/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'lightblue',
                    textDecoration: 'underline',
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    window.electron.shell.openExternal('https://platform.openai.com/settings/organization/api-keys')
                  }}
                >
                  Get your API key from OpenAI
                </a>
              </span>
            }
            arrow
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Icon name="info" size={20} />
            </Box>
          </Tooltip>
        </Stack>

        <Stack direction="row" spacing={SPACING.SMALL.PX} alignItems="center">
          <TextField
            label="Model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gpt-4o-mini"
            fullWidth
            size="small"
          />
          <Tooltip
            title={
              <span>
                <a
                  href="https://platform.openai.com/docs/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'lightblue',
                    textDecoration: 'underline',
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    window.electron.shell.openExternal('https://platform.openai.com/docs/pricing')
                  }}
                >
                  View available models
                </a>
              </span>
            }
            arrow
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Icon name="info" size={20} />
            </Box>
          </Tooltip>
        </Stack>

        <Button variant="contained" onClick={handleSaveApiSettings} fullWidth disabled={!hasChanges}>
          Save API Settings
        </Button>
      </Stack>
    </Box>
  )
}

export default TabOpenAI
