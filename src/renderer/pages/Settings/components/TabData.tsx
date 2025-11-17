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
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { CHANNEL } from '../../../../shared/messages.types'
import ipcMessenger from '../../../ipcMessenger'
import { SPACING } from '../../../styles/consts'
import { logger } from '../../../utilities'

const TabData = () => {
  const [backupDirectory, setBackupDirectory] = useState<string>('')

  const [isExporting, setIsExporting] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showNukeDialog, setShowNukeDialog] = useState(false)
  const [nukeConfirmationText, setNukeConfirmationText] = useState('')
  const [isNuking, setIsNuking] = useState(false)

  const [dataMessage, setDataMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleExportData = async () => {
    setIsExporting(true)
    setDataMessage(null)
    try {
      const result = await ipcMessenger.invoke(CHANNEL.APP.EXPORT_ALL_DATA, undefined)

      if (result.success && result.data) {
        // Create and download JSON file
        const dataStr = JSON.stringify(result.data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })

        const link = document.createElement('a')
        const url = URL.createObjectURL(dataBlob)
        link.setAttribute('href', url)

        const timestamp = new Date().toISOString().split('T')[0]
        link.setAttribute('download', `fast-classifieds-backup-${timestamp}.json`)
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
        text: `Error exporting data: ${(error as Error).message}`,
      })
    } finally {
      setIsExporting(false)
    }
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
      // Reviver to convert ISO date strings to Date objects
      const dateReviver = (_key: string, value: unknown) => {
        // ISO 8601 date string check
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?Z$/.test(value)) {
          return new Date(value)
        }
        return value
      }
      const data = JSON.parse(text, dateReviver)

      // Validate the data structure (basic check)
      if (
        !data.sites ||
        !data.prompts ||
        !data.jobPostings ||
        !data.scrapeRuns ||
        !data.hashes ||
        !data.apiUsage ||
        !data.scrapeTasks
      ) {
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
        text: `Error restoring data: ${(error as Error).message}`,
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
    if (nukeConfirmationText !== 'NUKE') {
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
      const result = await ipcMessenger.invoke(CHANNEL.APP.NUKE_DATABASE, undefined)

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
        text: `Error nuking database: ${(error as Error).message}`,
      })
    } finally {
      setIsNuking(false)
    }
  }

  const handleCancelNuke = () => {
    setShowNukeDialog(false)
    setNukeConfirmationText('')
  }

  const handleRestoreData = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      // Show confirmation dialog
      setSelectedFile(file)
      setShowConfirmDialog(true)
    }

    input.click()
  }

  useEffect(() => {
    const getBackupDirectory = async () => {
      try {
        const result = await ipcMessenger.invoke(CHANNEL.APP.GET_BACKUP_DIRECTORY, undefined)
        setBackupDirectory(result.backupDirectory)
      } catch (error) {
        logger.error('Error getting backup directory:', error)
      }
    }

    getBackupDirectory()
  }, [])

  return (
    <>
      <Box sx={{ p: SPACING.MEDIUM.PX }}>
        <Typography variant="subtitle2" gutterBottom>
          Database Backups
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: SPACING.MEDIUM.PX }}>
          Backup Location: {backupDirectory || 'Loading...'}
        </Typography>

        <Divider sx={{ my: SPACING.MEDIUM.PX }} />

        <Typography variant="subtitle2" gutterBottom>
          Export & Restore
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: SPACING.SMALL.PX }}>
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
        <Typography variant="body2" color="textSecondary" sx={{ mb: SPACING.SMALL.PX }}>
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
            This will replace all current data with the backup. Type CONFIRM to continue.
          </DialogContentText>
          <TextField
            margin="dense"
            fullWidth
            variant="outlined"
            placeholder="Type CONFIRM here"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
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
            onChange={(e) => setNukeConfirmationText(e.target.value)}
            sx={{ mt: 2 }}
            color="error"
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelNuke}>Cancel</Button>
          <Button onClick={handleConfirmNuke} color="error" variant="contained" disabled={!nukeConfirmationText.trim()}>
            Nuke Database
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
export default TabData
