import { Box, Button, Chip, CircularProgress, Divider, Stack, Typography } from '@mui/material'
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

type GroupSummary = {
  duplicationDetectionId: string
  total: number
  titleSample: string
  siteTitleSample: string
  latestCreatedAt: Date
}

const FieldRow = ({ label, value }: { label: string; value?: string | React.ReactNode }) => (
  <Box>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
      {value || '—'}
    </Typography>
  </Box>
)

const PostingCard = ({ posting, title }: { posting?: JobPostingDTO; title: string }) => {
  if (!posting) {
    return (
      <Box sx={{ p: SPACING.SMALL.PX }}>
        <Typography variant="body2" color="text.secondary">
          No posting selected
        </Typography>
      </Box>
    )
  }

  const openJob = () => {
    if (posting.jobUrl) ipcMessenger.invoke(CHANNEL_INVOKES.UTILS.OPEN_URL, { url: posting.jobUrl })
  }

  return (
    <Stack spacing={SPACING.SMALL.PX} sx={{ p: SPACING.SMALL.PX }}>
      <Typography variant="subtitle1" fontWeight={600}>
        {title}
      </Typography>
      <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>
        {posting.title}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip size="small" label={posting.siteTitle} />
        <Chip size="small" label={posting.status} />
        <Chip
          size="small"
          label={posting.duplicateStatus}
          color={posting.duplicateStatus === 'suspected_duplicate' ? 'warning' : 'default'}
        />
      </Stack>
      <FieldRow label="Location" value={posting.location} />
      <FieldRow
        label="Job URL"
        value={
          posting.jobUrl ? (
            <Button size="small" onClick={openJob} variant="outlined">
              Open
            </Button>
          ) : (
            '—'
          )
        }
      />
      <FieldRow label="Description" value={posting.description} />
      <FieldRow label="Created" value={new Date(posting.createdAt).toLocaleString()} />
    </Stack>
  )
}

const DuplicateDetectionModal = (_props: DuplicateDetectionModalProps) => {
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [postings, setPostings] = useState<JobPostingDTO[] | null>(null)
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
        setGroups(result.groups)
        if (result.groups.length > 0) setSelectedGroupId(result.groups[0].duplicationDetectionId)
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

  useEffect(() => {
    let mounted = true
    const loadGroup = async () => {
      if (!selectedGroupId) {
        setPostings(null)
        return
      }
      try {
        const res = await ipcMessenger.invoke(CHANNEL_INVOKES.JOB_POSTINGS.GET_DUPLICATE_GROUP, {
          duplicationDetectionId: selectedGroupId,
        })
        if (!mounted) return
        setPostings(res.postings)
      } catch (_e) {
        if (mounted) setError('Failed to load duplicate group')
      }
    }
    loadGroup()
    return () => {
      mounted = false
    }
  }, [selectedGroupId])

  const { olderPosting, suspectedPosting } = useMemo(() => {
    if (!postings || postings.length === 0) return { olderPosting: undefined, suspectedPosting: undefined }
    const sortedAsc = [...postings].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    const sortedDesc = [...postings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const older =
      sortedAsc.find((p) => p.duplicateStatus !== ('suspected_duplicate' as JobPostingDuplicateStatus)) || sortedAsc[0]
    const suspected =
      sortedDesc.find((p) => p.duplicateStatus === ('suspected_duplicate' as JobPostingDuplicateStatus)) ||
      sortedDesc[0]

    return { olderPosting: older, suspectedPosting: suspected }
  }, [postings])

  const reloadGroupsAndSelection = async (currentSelected?: string | null) => {
    const result = await ipcMessenger.invoke(CHANNEL_INVOKES.JOB_POSTINGS.GET_SUSPECTED_DUPLICATES, undefined)
    setGroups(result.groups)
    const stillExists = result.groups.some((g: GroupSummary) => g.duplicationDetectionId === (currentSelected ?? ''))
    const newSelected: string | null =
      stillExists && currentSelected
        ? currentSelected
        : result.groups.length > 0
          ? result.groups[0].duplicationDetectionId
          : null
    setSelectedGroupId(newSelected)
    if (newSelected) {
      const res = await ipcMessenger.invoke(CHANNEL_INVOKES.JOB_POSTINGS.GET_DUPLICATE_GROUP, {
        duplicationDetectionId: newSelected,
      })
      setPostings(res.postings)
    } else {
      setPostings(null)
    }
  }

  const updateSuspectedStatus = async (status: JobPostingDuplicateStatus) => {
    if (!suspectedPosting) return
    try {
      setUpdating(true)
      await ipcMessenger.invoke(CHANNEL_INVOKES.JOB_POSTINGS.UPDATE, {
        id: suspectedPosting.id,
        data: { duplicateStatus: status },
      })
      await reloadGroupsAndSelection(selectedGroupId)
    } catch (_e) {
      setError('Failed to update duplicate status')
    } finally {
      setUpdating(false)
    }
  }

  const markAllAsDuplicates = async () => {
    if (!groups.length) return
    try {
      setBulkUpdating(true)
      for (const g of groups) {
        const res = await ipcMessenger.invoke(CHANNEL_INVOKES.JOB_POSTINGS.GET_DUPLICATE_GROUP, {
          duplicationDetectionId: g.duplicationDetectionId,
        })
        const suspected = (res.postings as JobPostingDTO[]).filter((p) => p.duplicateStatus === 'suspected_duplicate')
        for (const p of suspected) {
          await ipcMessenger.invoke(CHANNEL_INVOKES.JOB_POSTINGS.UPDATE, {
            id: p.id,
            data: { duplicateStatus: 'confirmed_duplicate' },
          })
        }
      }
      await reloadGroupsAndSelection(selectedGroupId)
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
      {loading ? (
        <Stack alignItems="center" justifyContent="center">
          <CircularProgress size={28} />
        </Stack>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Box sx={{ display: 'flex', gap: SPACING.MEDIUM.PX }}>
          {/* Left sidebar: suspected groups */}
          <Box sx={{ width: 280, borderRight: '1px solid', borderColor: 'divider', pr: SPACING.SMALL.PX }}>
            <Button
              size="small"
              variant="contained"
              color="warning"
              onClick={markAllAsDuplicates}
              disabled={groups.length === 0 || updating || bulkUpdating}
              sx={{ mb: SPACING.SMALL.PX }}
            >
              {bulkUpdating ? 'Marking…' : 'Mark all as duplicates'}
            </Button>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: SPACING.SMALL.PX }}>
              Suspected Duplicates
            </Typography>
            <Stack spacing={0.5} sx={{ overflow: 'auto' }}>
              {groups.map((g) => {
                const selected = selectedGroupId === g.duplicationDetectionId
                return (
                  <Box
                    key={g.duplicationDetectionId}
                    onClick={() => setSelectedGroupId(g.duplicationDetectionId)}
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      cursor: 'pointer',
                      backgroundColor: selected ? 'action.selected' : 'transparent',
                      '&:hover': { backgroundColor: selected ? 'action.selected' : 'action.hover' },
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography
                        variant="body2"
                        sx={{ mr: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {g.titleSample}
                      </Typography>
                      <Chip size="small" label={g.total} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {g.siteTitleSample}
                    </Typography>
                  </Box>
                )
              })}
              {groups.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No suspected duplicates
                </Typography>
              )}
            </Stack>
          </Box>

          {/* Middle: older posting */}
          <Box sx={{ flex: 1 }}>
            <PostingCard posting={olderPosting} title="Older Posting" />
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* Right: suspected new posting */}
          <Box sx={{ flex: 1 }}>
            <PostingCard posting={suspectedPosting} title="Suspected Duplicate" />
            <Stack direction="row" spacing={SPACING.SMALL.PX} sx={{ p: SPACING.SMALL.PX }}>
              <Button
                variant="contained"
                color="warning"
                disabled={!suspectedPosting || updating}
                onClick={() => updateSuspectedStatus('confirmed_duplicate')}
              >
                {updating ? 'Updating...' : 'Confirm Duplicate'}
              </Button>
              <Button
                variant="outlined"
                disabled={!suspectedPosting || updating}
                onClick={() => updateSuspectedStatus('unique')}
              >
                {updating ? 'Updating...' : 'Not a Duplicate'}
              </Button>
            </Stack>
          </Box>
        </Box>
      )}
    </DefaultModal>
  )
}

export default DuplicateDetectionModal
