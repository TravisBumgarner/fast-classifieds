import {
  Checkbox,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  type SelectChangeEvent,
  Stack,
  Tooltip,
} from '@mui/material'
import { useEffect } from 'react'
import { JOB_POSTING_STATUS, type JobPostingStatus, type ScrapeRunDTO } from '../../../../shared/types'
import Icon from '../../../sharedComponents/Icon'
import { SPACING } from '../../../styles/consts'

export const DEFAULT_STATUS_FILTERS = ['new', 'applied', 'interview', 'offer'] as JobPostingStatus[]

const Filters = ({
  statusFilter,
  setStatusFilter,
  setPage,
  scrapeRuns,
  scrapeRunsFilter,
  setScrapeRunsFilter,
}: {
  statusFilter: JobPostingStatus[]
  setStatusFilter: React.Dispatch<React.SetStateAction<JobPostingStatus[]>>
  setPage: React.Dispatch<React.SetStateAction<number>>
  scrapeRuns: ScrapeRunDTO[]
  scrapeRunsFilter: string[]
  setScrapeRunsFilter: React.Dispatch<React.SetStateAction<string[]>>
}) => {
  // Scrape Run Multi-Select
  const allScrapeRunIds = scrapeRuns.map((run) => run.id)
  const noneSelected = scrapeRunsFilter.length === 0

  // Default to all selected if empty
  useEffect(() => {
    if (scrapeRuns.length > 0 && scrapeRunsFilter.length === 0) {
      setScrapeRunsFilter(allScrapeRunIds)
    }
  }, [scrapeRuns, setScrapeRunsFilter, allScrapeRunIds, scrapeRunsFilter.length])

  const handleClearAll = () => {
    setScrapeRunsFilter([])
    setStatusFilter([...DEFAULT_STATUS_FILTERS])
    setPage(0)
  }

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value
    setScrapeRunsFilter(typeof value === 'string' ? value.split(',') : value)
    setPage(0)
  }

  return (
    <Stack direction="row" spacing={SPACING.SMALL.PX} alignItems="center">
      <FormControl sx={{ width: 200 }} size="small">
        <InputLabel id="status-filter-label">Status</InputLabel>
        <Select<JobPostingStatus[]>
          labelId="status-filter-label"
          multiple
          value={statusFilter}
          onChange={(e) => {
            const value = e.target.value
            setStatusFilter(
              typeof value === 'string' ? (value.split(',') as JobPostingStatus[]) : (value as JobPostingStatus[]),
            )
            setPage(0)
          }}
          input={<OutlinedInput label="Status" />}
          renderValue={(selected) => {
            if (selected.length === Object.values(JOB_POSTING_STATUS).length) return 'All'
            if (selected.length === 0) return 'None'
            return selected.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')
          }}
        >
          {Object.values(JOB_POSTING_STATUS).map((status) => (
            <MenuItem key={status} value={status}>
              <Checkbox checked={statusFilter.includes(status)} size="small" />
              <ListItemText primary={status.charAt(0).toUpperCase() + status.slice(1)} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Stack spacing={1} direction="row" alignItems="center">
        <FormControl sx={{ width: 200 }} size="small">
          <InputLabel id="scrape-run-multiselect-label">All job searches</InputLabel>
          <Select<string[]>
            labelId="scrape-run-multiselect-label"
            multiple
            value={scrapeRunsFilter}
            onChange={handleChange}
            input={<OutlinedInput label="All job searches" />}
            renderValue={(selected) => {
              if (selected.length === allScrapeRunIds.length) return 'All job searches'
              if (selected.length === 0) return 'None'
              return `${selected.length} Selected`
            }}
          >
            {scrapeRuns.map((run) => (
              <MenuItem key={run.id} value={run.id}>
                <Checkbox checked={scrapeRunsFilter.indexOf(run.id) > -1} size="small" />
                <ListItemText
                  primary={run.createdAt ? new Date(run.createdAt).toLocaleString() : ''}
                  secondary={`Sites Processed ${run.successfulSites} of ${run.totalSites}`}
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tooltip title="Clear filters">
          <IconButton onClick={handleClearAll} size="small" disabled={noneSelected}>
            <Icon name="filterClear" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  )
}

export default Filters
