import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { CHANNEL } from '../../../../shared/messages.types'
import ipcMessenger from '../../../ipcMessenger'
import { activeModalSignal } from '../../../signals'
import { SPACING } from '../../../styles/consts'
import Icon from '../../Icon'
import { MODAL_ID } from '../Modal.consts'
import DefaultModal from './DefaultModal'

export interface SettingsModalProps {
  id: typeof MODAL_ID.SETTINGS_MODAL
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SettingsModal = ({ id }: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState(0)
  const [backupDirectory, setBackupDirectory] = useState<string>('')
  const [apiKey, setApiKey] = useState<string>('')
  const [model, setModel] = useState<string>('gpt-4o-mini')
  const [scrapeDelay, setScrapeDelay] = useState<number>(3000)
  const [isExporting, setIsExporting] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [apiMessage, setApiMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [dataMessage, setDataMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [scrapeMessage, setScrapeMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showNukeDialog, setShowNukeDialog] = useState(false)
  const [nukeConfirmationText, setNukeConfirmationText] = useState('')
  const [isNuking, setIsNuking] = useState(false)

  useEffect(() => {
    const getBackupDirectory = async () => {
      try {
        const result = await ipcMessenger.invoke(
          CHANNEL.APP.GET_BACKUP_DIRECTORY,
          undefined,
        )
        setBackupDirectory(result.backupDirectory)
      } catch (error) {
        console.error('Error getting backup directory:', error)
      }
    }

    const loadApiSettings = () => {
      // Load from localStorage
      const savedApiKey = localStorage.getItem('openai_api_key') || ''
      const savedModel = localStorage.getItem('openai_model') || 'gpt-4o-mini'
      const savedDelay = localStorage.getItem('scrape_delay') || '3000'
      setApiKey(savedApiKey)
      setModel(savedModel)
      setScrapeDelay(Number(savedDelay))
    }

    getBackupDirectory()
    loadApiSettings()
  }, [])

  const handleSaveApiSettings = () => {
    try {
      localStorage.setItem('openai_api_key', apiKey)
      localStorage.setItem('openai_model', model)
      setApiMessage({
        type: 'success',
        text: 'API settings saved successfully',
      })
    } catch {
      setApiMessage({
        type: 'error',
        text: 'Failed to save API settings',
      })
    }
  }

  const handleExportData = async () => {
    setIsExporting(true)
    setDataMessage(null)
    try {
      const result = await ipcMessenger.invoke(
        CHANNEL.APP.EXPORT_ALL_DATA,
        undefined,
      )

      if (result.success && result.data) {
        // Create and download JSON file
        const dataStr = JSON.stringify(result.data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })

        const link = document.createElement('a')
        const url = URL.createObjectURL(dataBlob)
        link.setAttribute('href', url)

        const timestamp = new Date().toISOString().split('T')[0]
        link.setAttribute(
          'download',
          `fast-classifieds-backup-${timestamp}.json`,
        )
        link.style.visibility = 'hidden'

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        setDataMessage({ type: 'success', text: 'Data exported successfully' })
      } else {
        setDataMessage({
          type: 'error',
          text: result.error || 'Failed to export data',
        })
      }
    } catch (error) {
      setDataMessage({
        type: 'error',
        text: 'Error exporting data: ' + (error as Error).message,
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleRestoreData = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'

    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      // Show confirmation dialog
      setSelectedFile(file)
      setShowConfirmDialog(true)
    }

    input.click()
  }

  const handleConfirmRestore = async () => {
    if (!selectedFile) return

    if (confirmationText !== 'CONFIRM') {
      setDataMessage({
        type: 'error',
        text: 'Confirmation required',
      })
      return
    }

    setIsRestoring(true)
    setDataMessage(null)
    setShowConfirmDialog(false)
    setConfirmationText('')

    try {
      const text = await selectedFile.text()
      const data = JSON.parse(text)

      // Validate the data structure (basic check)
      if (!data.ingredients || !data.recipes || !data.relations) {
        throw new Error('Invalid backup file')
      }

      const result = await ipcMessenger.invoke(CHANNEL.APP.RESTORE_ALL_DATA, {
        data,
      })

      if (result.success) {
        setDataMessage({
          type: 'success',
          text: 'Data restored successfully',
        })
      } else {
        setDataMessage({
          type: 'error',
          text: result.error || 'Failed to restore data',
        })
      }
    } catch (error) {
      setDataMessage({
        type: 'error',
        text: 'Error restoring data: ' + (error as Error).message,
      })
    } finally {
      setIsRestoring(false)
      setSelectedFile(null)
    }
  }

  const handleCancelRestore = () => {
    setShowConfirmDialog(false)
    setConfirmationText('')
    setSelectedFile(null)
  }

  const handleNukeDatabase = () => {
    setShowNukeDialog(true)
  }

  const handleConfirmNuke = async () => {
    if (
      nukeConfirmationText !== 'NUKE' &&
      nukeConfirmationText !== 'ELIMINAR'
    ) {
      setDataMessage({
        type: 'error',
        text: 'Confirmation required',
      })
      return
    }

    setIsNuking(true)
    setDataMessage(null)
    setShowNukeDialog(false)
    setNukeConfirmationText('')

    try {
      const result = await ipcMessenger.invoke(
        CHANNEL.APP.NUKE_DATABASE,
        undefined,
      )

      if (result.success) {
        setDataMessage({
          type: 'success',
          text: 'Database nuked successfully',
        })
      } else {
        setDataMessage({
          type: 'error',
          text: result.error || 'Failed to nuke database',
        })
      }
    } catch (error) {
      setDataMessage({
        type: 'error',
        text: 'Error nuking database: ' + (error as Error).message,
      })
    } finally {
      setIsNuking(false)
    }
  }

  const handleCancelNuke = () => {
    setShowNukeDialog(false)
    setNukeConfirmationText('')
  }

  return (
    <DefaultModal
      title="Settings"
      sx={{
        height: '600px',
        width: '800px',
        maxWidth: '90hw',
        overflowY: 'auto',
      }}
    >
      <Box sx={{ minWidth: 500 }}>
        <Tabs
          value={activeTab}
          onChange={(_e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="OpenAI Config" />
          <Tab label="Scraper Config" />
          <Tab label="Data Management" />
          <Tab label="Help & Onboarding" />
        </Tabs>

        {/* Help & Onboarding Tab */}
        {activeTab === 3 && (
          <Box sx={{ p: SPACING.MEDIUM.PX }}>
            <Typography variant="subtitle2" gutterBottom>
              Getting Started Guide
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ mb: SPACING.SMALL.PX }}
            >
              View the step-by-step onboarding guide
            </Typography>
            <Button
              variant="outlined"
              onClick={() =>
                (activeModalSignal.value = { id: MODAL_ID.ONBOARDING_MODAL })
              }
              fullWidth
            >
              Show Onboarding Guide
            </Button>

            <Divider sx={{ my: SPACING.MEDIUM.PX }} />

            <Typography variant="subtitle2" gutterBottom>
              What&apos;s New
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ mb: SPACING.SMALL.PX }}
            >
              View the complete changelog of all updates and improvements
            </Typography>
            <Button
              variant="outlined"
              onClick={() =>
                (activeModalSignal.value = {
                  id: MODAL_ID.CHANGELOG_MODAL,
                  showLatestOnly: false,
                })
              }
              fullWidth
            >
              View Changelog
            </Button>
          </Box>
        )}

        {/* OpenAI Config Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: SPACING.MEDIUM.PX }}>
            <Typography variant="subtitle2" gutterBottom>
              OpenAI API Configuration
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ mb: SPACING.SMALL.PX }}
            >
              Configure your OpenAI API key and model for job scraping
            </Typography>

            {apiMessage && (
              <Alert severity={apiMessage.type} sx={{ mb: SPACING.MEDIUM.PX }}>
                {apiMessage.text}
              </Alert>
            )}

            <Stack spacing={SPACING.SMALL.PX}>
              <Stack
                direction="row"
                spacing={SPACING.SMALL.PX}
                alignItems="center"
              >
                <TextField
                  label="API Key"
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
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
                        onClick={e => {
                          e.preventDefault()
                          window.electron.shell.openExternal(
                            'https://platform.openai.com/settings/organization/api-keys',
                          )
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

              <Stack
                direction="row"
                spacing={SPACING.SMALL.PX}
                alignItems="center"
              >
                <TextField
                  label="Model"
                  value={model}
                  onChange={e => setModel(e.target.value)}
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
                        onClick={e => {
                          e.preventDefault()
                          window.electron.shell.openExternal(
                            'https://platform.openai.com/docs/pricing',
                          )
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

              <Button
                variant="contained"
                onClick={handleSaveApiSettings}
                fullWidth
              >
                Save API Settings
              </Button>
            </Stack>
          </Box>
        )}

        {/* Scraper Config Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: SPACING.MEDIUM.PX }}>
            <Typography variant="subtitle2" gutterBottom>
              Scraper Configuration
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ mb: SPACING.SMALL.PX }}
            >
              Configure how the scraper behaves when loading pages
            </Typography>

            {scrapeMessage && (
              <Alert
                severity={scrapeMessage.type}
                sx={{ mb: SPACING.MEDIUM.PX }}
              >
                {scrapeMessage.text}
              </Alert>
            )}

            <Stack spacing={SPACING.SMALL.PX}>
              <Stack
                direction="row"
                spacing={SPACING.SMALL.PX}
                alignItems="center"
              >
                <TextField
                  label="Page Load Delay (ms)"
                  type="number"
                  value={scrapeDelay}
                  onChange={e => setScrapeDelay(Number(e.target.value))}
                  placeholder="3000"
                  fullWidth
                  size="small"
                  inputProps={{ min: 0, step: 100 }}
                />
                <Tooltip
                  title={
                    <span>
                      Time to wait after the page selector appears before
                      scraping content. Some sites load content dynamically
                      after the initial page load. Increase this value if
                      you&apos;re missing content, decrease it to speed up
                      scraping.
                    </span>
                  }
                  arrow
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Icon name="info" size={20} />
                  </Box>
                </Tooltip>
              </Stack>

              <Button
                variant="contained"
                onClick={() => {
                  try {
                    localStorage.setItem('scrape_delay', String(scrapeDelay))
                    setScrapeMessage({
                      type: 'success',
                      text: 'Scraper settings saved successfully',
                    })
                  } catch {
                    setScrapeMessage({
                      type: 'error',
                      text: 'Failed to save scraper settings',
                    })
                  }
                }}
                fullWidth
              >
                Save Scraper Settings
              </Button>
            </Stack>
          </Box>
        )}

        {/* Data Management Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: SPACING.MEDIUM.PX }}>
            <Typography variant="subtitle2" gutterBottom>
              Database Backups
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ mb: SPACING.MEDIUM.PX }}
            >
              Backup Location: {backupDirectory || 'Loading...'}
            </Typography>

            <Divider sx={{ my: SPACING.MEDIUM.PX }} />

            <Typography variant="subtitle2" gutterBottom>
              Export & Restore
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ mb: SPACING.SMALL.PX }}
            >
              Export or restore your data
            </Typography>

            {dataMessage && (
              <Alert severity={dataMessage.type} sx={{ mb: SPACING.MEDIUM.PX }}>
                {dataMessage.text}
              </Alert>
            )}

            <Stack spacing={SPACING.SMALL.PX} sx={{ mb: SPACING.MEDIUM.PX }}>
              <Button
                variant="outlined"
                onClick={handleExportData}
                disabled={isExporting || isRestoring || isNuking}
                fullWidth
              >
                {isExporting ? 'Exporting...' : 'Export All Data'}
              </Button>

              <Button
                variant="outlined"
                color="warning"
                onClick={handleRestoreData}
                disabled={isExporting || isRestoring || isNuking}
                fullWidth
              >
                {isRestoring ? 'Restoring...' : 'Restore from Backup'}
              </Button>
            </Stack>

            <Divider sx={{ my: SPACING.MEDIUM.PX }} />

            <Typography variant="subtitle2" gutterBottom color="error">
              Danger Zone
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ mb: SPACING.SMALL.PX }}
            >
              Permanently delete all data from the database
            </Typography>

            <Button
              variant="outlined"
              color="error"
              onClick={handleNukeDatabase}
              disabled={isExporting || isRestoring || isNuking}
              fullWidth
            >
              {isNuking ? 'Nuking...' : 'Nuke Database'}
            </Button>
          </Box>
        )}
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={handleCancelRestore}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">Restore from Backup</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            This will replace all current data with the backup. Type CONFIRM to
            continue.
          </DialogContentText>
          <TextField
            margin="dense"
            fullWidth
            variant="outlined"
            placeholder="Type CONFIRM here"
            value={confirmationText}
            onChange={e => setConfirmationText(e.target.value)}
            sx={{ mt: 2 }}
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelRestore}>Cancel</Button>
          <Button
            onClick={handleConfirmRestore}
            color="warning"
            variant="contained"
            disabled={!confirmationText.trim()}
          >
            Restore from Backup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Nuke Database Confirmation Dialog */}
      <Dialog
        open={showNukeDialog}
        onClose={handleCancelNuke}
        aria-labelledby="nuke-dialog-title"
        aria-describedby="nuke-dialog-description"
      >
        <DialogTitle id="nuke-dialog-title" color="error">
          Nuke Database
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="nuke-dialog-description">
            This will permanently delete all data. Type NUKE to continue.
          </DialogContentText>
          <TextField
            margin="dense"
            fullWidth
            variant="outlined"
            placeholder="Type NUKE here"
            value={nukeConfirmationText}
            onChange={e => setNukeConfirmationText(e.target.value)}
            sx={{ mt: 2 }}
            color="error"
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelNuke}>Cancel</Button>
          <Button
            onClick={handleConfirmNuke}
            color="error"
            variant="contained"
            disabled={!nukeConfirmationText.trim()}
          >
            Nuke Database
          </Button>
        </DialogActions>
      </Dialog>
    </DefaultModal>
  )
}

export default SettingsModal
