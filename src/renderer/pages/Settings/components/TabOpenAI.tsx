import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { CUSTOM_MODEL_OPTION, KNOWN_MODELS, type KnownModel } from '../../../../shared/consts'
import { CHANNEL_INVOKES } from '../../../../shared/types/messages.invokes'
import ipcMessenger from '../../../ipcMessenger'
import Icon from '../../../sharedComponents/Icon'
import { SPACING } from '../../../styles/consts'

const TabOpenAI = ({
  loadStoreSettings,
  initialOpenAiApiKey,
  initialSelectedModel,
  initialCustomModels,
}: {
  loadStoreSettings: () => Promise<void>
  initialOpenAiApiKey: string
  initialSelectedModel: KnownModel
  initialCustomModels: KnownModel[]
}) => {
  const [apiKey, setApiKey] = useState<string>(initialOpenAiApiKey)
  const [selectedModel, setSelectedModel] = useState<KnownModel>(initialSelectedModel)
  const [customModels, setCustomModels] = useState<KnownModel[]>(initialCustomModels)
  const [isCustom, setIsCustom] = useState<boolean>(!KNOWN_MODELS.some((m) => m.model === initialSelectedModel.model))

  // Custom model form fields
  const [customModelName, setCustomModelName] = useState<string>('')
  const [customInputPrice, setCustomInputPrice] = useState<string>('')
  const [customCachedInputPrice, setCustomCachedInputPrice] = useState<string>('')
  const [customOutputPrice, setCustomOutputPrice] = useState<string>('')

  const allModels = [...KNOWN_MODELS, ...customModels]
  const hasChanges =
    apiKey !== initialOpenAiApiKey ||
    selectedModel.model !== initialSelectedModel.model ||
    JSON.stringify(customModels) !== JSON.stringify(initialCustomModels)

  const [apiMessage, setApiMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleModelChange = (modelName: string) => {
    if (modelName === CUSTOM_MODEL_OPTION) {
      setIsCustom(true)
      // Reset custom form
      setCustomModelName('')
      setCustomInputPrice('')
      setCustomCachedInputPrice('')
      setCustomOutputPrice('')
    } else {
      setIsCustom(false)
      const model = allModels.find((m) => m.model === modelName)
      if (model) {
        setSelectedModel(model)
      }
    }
  }

  const handleAddCustomModel = () => {
    if (!customModelName || !customInputPrice || !customOutputPrice) {
      setApiMessage({
        type: 'error',
        text: 'Please fill in all required custom model fields',
      })
      return
    }

    const newCustomModel: KnownModel = {
      model: customModelName,
      input: parseFloat(customInputPrice),
      cachedInput: customCachedInputPrice ? parseFloat(customCachedInputPrice) : null,
      output: parseFloat(customOutputPrice),
    }

    const updatedCustomModels = [...customModels, newCustomModel]
    setCustomModels(updatedCustomModels)
    setSelectedModel(newCustomModel)
    setIsCustom(false)

    // Clear form
    setCustomModelName('')
    setCustomInputPrice('')
    setCustomCachedInputPrice('')
    setCustomOutputPrice('')
  }

  const handleSaveApiSettings = async () => {
    try {
      await ipcMessenger.invoke(CHANNEL_INVOKES.STORE.SET, {
        openaiApiKey: apiKey,
        selectedModel: selectedModel,
        customModels: customModels,
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

  const formatPrice = (price: number | null) => {
    return price !== null ? `$${price.toFixed(2)}` : 'N/A'
  }

  return (
    <Box sx={{ p: SPACING.MEDIUM.PX }}>
      <Typography variant="subtitle2" gutterBottom>
        OpenAI API Configuration
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: SPACING.MEDIUM.PX }}>
        Configure your OpenAI API key and model for job scraping
      </Typography>

      {apiMessage && (
        <Alert severity={apiMessage.type} sx={{ mb: SPACING.MEDIUM.PX }}>
          {apiMessage.text}
        </Alert>
      )}

      <Stack spacing={SPACING.MEDIUM.PX}>
        {/* API Key */}
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
                    ipcMessenger.invoke(CHANNEL_INVOKES.UTILS.OPEN_URL, {
                      url: 'https://platform.openai.com/settings/organization/api-keys',
                    })
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
          {/* Model Selection */}
          <FormControl fullWidth size="small">
            <InputLabel>Model</InputLabel>
            <Select
              value={isCustom ? CUSTOM_MODEL_OPTION : selectedModel.model}
              label="Model"
              onChange={(e) => handleModelChange(e.target.value)}
            >
              {allModels.map((m) => (
                <MenuItem key={m.model} value={m.model}>
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{
                      fontFamily: 'monospace',
                      width: '100%',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography sx={{ minWidth: 220 }}>{m.model}</Typography>

                    <Typography sx={{ minWidth: 120 }}>Input: {formatPrice(m.input)}</Typography>

                    <Typography sx={{ minWidth: 140 }}>Cached: {formatPrice(m.cachedInput)}</Typography>

                    <Typography sx={{ minWidth: 120 }}>Output: {formatPrice(m.output)}</Typography>
                  </Stack>
                </MenuItem>
              ))}

              <MenuItem value={CUSTOM_MODEL_OPTION}>Add Custom Model...</MenuItem>
            </Select>
          </FormControl>

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
                    ipcMessenger.invoke(CHANNEL_INVOKES.UTILS.OPEN_URL, {
                      url: 'https://platform.openai.com/docs/pricing',
                    })
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

        {/* Custom Model Form */}
        {isCustom && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Add Custom Model
              </Typography>
              <Stack spacing={SPACING.SMALL.PX}>
                <TextField
                  label="Model Name"
                  value={customModelName}
                  onChange={(e) => setCustomModelName(e.target.value)}
                  placeholder="e.g., gpt-4-custom"
                  fullWidth
                  size="small"
                  required
                />
                <TextField
                  label="Input Price (per 1M tokens)"
                  type="number"
                  value={customInputPrice}
                  onChange={(e) => setCustomInputPrice(e.target.value)}
                  placeholder="1.25"
                  fullWidth
                  size="small"
                  required
                />
                <TextField
                  label="Cached Input Price (per 1M tokens) - Optional"
                  type="number"
                  value={customCachedInputPrice}
                  onChange={(e) => setCustomCachedInputPrice(e.target.value)}
                  placeholder="0.125"
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Output Price (per 1M tokens)"
                  type="number"
                  value={customOutputPrice}
                  onChange={(e) => setCustomOutputPrice(e.target.value)}
                  placeholder="10.0"
                  fullWidth
                  size="small"
                  required
                />
                <Button variant="outlined" onClick={handleAddCustomModel} fullWidth>
                  Add Custom Model
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        <Button variant="contained" onClick={handleSaveApiSettings} fullWidth disabled={!hasChanges}>
          Save API Settings
        </Button>
      </Stack>
    </Box>
  )
}

export default TabOpenAI
