import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import type { JobPostingDTO, JobPostingDuplicateStatus } from '../../../../shared/types'
import { CHANNEL_INVOKES } from '../../../../shared/types/messages.invokes'
import { QUERY_KEYS } from '../../../consts'
import ipcMessenger from '../../../ipcMessenger'
import { SPACING } from '../../../styles/consts'
import type { MODAL_ID } from '../Modal.consts'
import DefaultModal from './DefaultModal'

export type DuplicateDetectionModalProps = {
  id: typeof MODAL_ID.DUPLICATE_POSTINGS_MODAL
}

type DuplicatePair = {
  unique: JobPostingDTO
  suspectedDuplicate: JobPostingDTO
}

const ComparisonTable = ({
  unique,
  suspected,
  updating,
  onUpdateStatus,
}: {
  unique?: JobPostingDTO
  suspected?: JobPostingDTO
  updating: boolean
  onUpdateStatus: (status: JobPostingDuplicateStatus) => void
}) => {
  if (!unique || !suspected) {
    return (
      <Box sx={{ p: SPACING.MEDIUM.PX, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Select a duplicate pair to compare
        </Typography>
      </Box>
    )
  }

  const openJob = (url: string) => {
    ipcMessenger.invoke(CHANNEL_INVOKES.UTILS.OPEN_URL, { url })
  }

  const fields = [
    { label: 'Title', uniqueValue: unique.title, suspectedValue: suspected.title },
    { label: 'Site', uniqueValue: unique.siteTitle, suspectedValue: suspected.siteTitle },
    { label: 'Status', uniqueValue: unique.status, suspectedValue: suspected.status },
    { label: 'Location', uniqueValue: unique.location, suspectedValue: suspected.location },
    {
      label: 'Found On',
      uniqueValue: new Date(unique.createdAt).toLocaleString(),
      suspectedValue: new Date(suspected.createdAt).toLocaleString(),
    },
    {
      label: 'Posted On',
      uniqueValue: unique.datePosted ? new Date(unique.datePosted).toLocaleString() : 'Unknown',
      suspectedValue: suspected.datePosted ? new Date(suspected.datePosted).toLocaleString() : 'Unknown',
    },
    {
      label: 'Description',
      uniqueValue: unique.description,
      suspectedValue: suspected.description,
      isLongText: true,
    },
    {
      label: 'Job URL',
      uniqueValue: unique.jobUrl ? (
        <Button size="small" onClick={() => openJob(unique.jobUrl)} variant="outlined">
          Open Original
        </Button>
      ) : (
        '—'
      ),
      suspectedValue: suspected.jobUrl ? (
        <Button size="small" onClick={() => openJob(suspected.jobUrl)} variant="outlined">
          Open Suspected
        </Button>
      ) : (
        '—'
      ),
    },
  ]

  return (
    <Box>
      <TableContainer sx={{ maxHeight: '60vh' }}>
        <Table stickyHeader size="small" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, width: '150px' }}>Field</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '50%' }}>Original Posting</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '50%', borderLeft: '3px solid', borderColor: 'warning.main' }}>
                Suspected Duplicate
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field.label}>
                <TableCell sx={{ fontWeight: 500, bgcolor: 'action.hover' }}>{field.label}</TableCell>
                <TableCell sx={{ ...(field.isLongText && { maxWidth: '300px' }) }}>
                  {typeof field.uniqueValue === 'string' ? (
                    <Typography
                      variant="body2"
                      sx={{
                        wordBreak: field.isLongText ? 'break-word' : 'normal',
                        ...(field.isLongText && {
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }),
                      }}
                    >
                      {field.uniqueValue || '—'}
                    </Typography>
                  ) : (
                    field.uniqueValue
                  )}
                </TableCell>
                <TableCell
                  sx={{
                    ...(field.isLongText && { maxWidth: '300px' }),
                    borderLeft: '3px solid',
                    borderColor: 'warning.main',
                  }}
                >
                  {typeof field.suspectedValue === 'string' ? (
                    <Typography
                      variant="body2"
                      sx={{
                        wordBreak: field.isLongText ? 'break-word' : 'normal',
                        ...(field.isLongText && {
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }),
                      }}
                    >
                      {field.suspectedValue || '—'}
                    </Typography>
                  ) : (
                    field.suspectedValue
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack
        direction="row"
        spacing={SPACING.SMALL.PX}
        sx={{ mt: SPACING.MEDIUM.PX, p: SPACING.SMALL.PX, bgcolor: 'action.hover', borderRadius: 1 }}
      >
        <Button
          variant="contained"
          color="warning"
          disabled={updating}
          onClick={() => onUpdateStatus('confirmed_duplicate')}
        >
          {updating ? 'Updating...' : 'Confirm Duplicate'}
        </Button>
        <Button variant="outlined" disabled={updating} onClick={() => onUpdateStatus('unique')}>
          {updating ? 'Updating...' : 'Not a Duplicate'}
        </Button>
      </Stack>
    </Box>
  )
}

const DuplicateDetectionModal = (_props: DuplicateDetectionModalProps) => {
  const [loading, setLoading] = useState(true)
  const [duplicatePairs, setDuplicatePairs] = useState<DuplicatePair[]>([])
  const [selectedPairIndex, setSelectedPairIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const result = await ipcMessenger.invoke(CHANNEL_INVOKES.JOB_POSTINGS.GET_SUSPECTED_DUPLICATES, undefined)
        if (!mounted) return
        setDuplicatePairs(result)
        if (result.length > 0) setSelectedPairIndex(0)
      } catch (_e) {
        setError('Failed to load suspected duplicates')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const { olderPosting, suspectedPosting } = useMemo(() => {
    if (selectedPairIndex === null || !duplicatePairs[selectedPairIndex]) {
      return { olderPosting: undefined, suspectedPosting: undefined }
    }
    const pair = duplicatePairs[selectedPairIndex]
    return {
      olderPosting: pair.unique,
      suspectedPosting: pair.suspectedDuplicate,
    }
  }, [duplicatePairs, selectedPairIndex])

  const reloadPairsAndSelection = async (currentSelectedIndex?: number | null) => {
    const result = await ipcMessenger.invoke(CHANNEL_INVOKES.JOB_POSTINGS.GET_SUSPECTED_DUPLICATES, undefined)
    setDuplicatePairs(result)
    const newSelectedIndex: number | null =
      currentSelectedIndex !== null && currentSelectedIndex !== undefined && currentSelectedIndex < result.length
        ? currentSelectedIndex
        : result.length > 0
          ? 0
          : null
    setSelectedPairIndex(newSelectedIndex)
  }

  const updateSuspectedStatus = async (status: JobPostingDuplicateStatus) => {
    if (!suspectedPosting) return
    try {
      setUpdating(true)
      await ipcMessenger.invoke(CHANNEL_INVOKES.JOB_POSTINGS.UPDATE, {
        id: suspectedPosting.id,
        data: { duplicateStatus: status },
      })
      await reloadPairsAndSelection(selectedPairIndex)
    } catch (_e) {
      setError('Failed to update duplicate status')
    } finally {
      setUpdating(false)
    }
  }

  const markAllAsDuplicates = async () => {
    if (!duplicatePairs.length) return
    try {
      setBulkUpdating(true)
      for (const pair of duplicatePairs) {
        await ipcMessenger.invoke(CHANNEL_INVOKES.JOB_POSTINGS.UPDATE, {
          id: pair.suspectedDuplicate.id,
          data: { duplicateStatus: 'confirmed_duplicate' },
        })
      }
      await reloadPairsAndSelection(selectedPairIndex)
    } catch (_e) {
      setError('Failed to mark all as duplicates')
    } finally {
      setBulkUpdating(false)
    }
  }

  const handleClose = () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.JOB_POSTINGS] })
  }

  return (
    <DefaultModal
      closeCallback={handleClose}
      title="Duplicate Detection"
      sx={{ width: '1100px', maxWidth: '95%', height: '90vh' }}
    >
      <Alert severity="info" sx={{ mb: SPACING.MEDIUM.PX }}>
        Do you keep seeing duplicates? Try changing the CSS selectors under a site's advanced config to be more
        specific.
      </Alert>
      {loading ? (
        <Stack alignItems="center" justifyContent="center">
          <CircularProgress size={28} />
        </Stack>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Box sx={{ display: 'flex', gap: SPACING.MEDIUM.PX, height: '70vh' }}>
          {/* Left sidebar: duplicate pairs */}
          <Box sx={{ width: 280, borderRight: '1px solid', borderColor: 'divider', pr: SPACING.SMALL.PX }}>
            <Button
              size="small"
              variant="contained"
              color="warning"
              onClick={markAllAsDuplicates}
              disabled={duplicatePairs.length === 0 || updating || bulkUpdating}
              sx={{ mb: SPACING.SMALL.PX }}
            >
              {bulkUpdating ? 'Marking…' : 'Mark all as duplicates'}
            </Button>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: SPACING.SMALL.PX }}>
              Suspected Duplicates ({duplicatePairs.length})
            </Typography>
            <Stack spacing={0.5} sx={{ overflow: 'auto', height: '100%' }}>
              {duplicatePairs.map((pair, index) => {
                const selected = selectedPairIndex === index
                return (
                  <Box
                    key={`${pair.unique.id}-${pair.suspectedDuplicate.id}`}
                    onClick={() => setSelectedPairIndex(index)}
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      cursor: 'pointer',
                      backgroundColor: selected ? 'action.selected' : 'transparent',
                      '&:hover': { backgroundColor: selected ? 'action.selected' : 'action.hover' },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {pair.suspectedDuplicate.title}
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Chip size="small" label={pair.unique.siteTitle} variant="outlined" />
                      <Typography variant="caption">→</Typography>
                      <Chip size="small" label={pair.suspectedDuplicate.siteTitle} />
                    </Stack>
                  </Box>
                )
              })}
              {duplicatePairs.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No suspected duplicates
                </Typography>
              )}
            </Stack>
          </Box>

          {/* Main comparison table */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <ComparisonTable
              unique={olderPosting}
              suspected={suspectedPosting}
              updating={updating}
              onUpdateStatus={updateSuspectedStatus}
            />
          </Box>
        </Box>
      )}
    </DefaultModal>
  )
}

export default DuplicateDetectionModal
