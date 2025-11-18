import { Checkbox, FormControl, FormControlLabel, FormGroup } from '@mui/material'
import { POSTING_STATUS, type PostingStatus } from '../../../../shared/types'

const Filters = ({
  statusFilter,
  setStatusFilter,
  setPage,
}: {
  statusFilter: PostingStatus[]
  setStatusFilter: React.Dispatch<React.SetStateAction<PostingStatus[]>>
  setPage: React.Dispatch<React.SetStateAction<number>>
}) => {
  return (
    <FormControl component="fieldset">
      <FormGroup row>
        {Object.values(POSTING_STATUS).map((status) => (
          <FormControlLabel
            key={status}
            control={
              <Checkbox
                checked={statusFilter.includes(status)}
                onChange={() => {
                  const newFilter = statusFilter.includes(status)
                    ? statusFilter.filter((s) => s !== status)
                    : [...statusFilter, status]
                  setStatusFilter(newFilter)
                  setPage(0)
                }}
                size="small"
              />
            }
            label={status.charAt(0).toUpperCase() + status.slice(1)}
          />
        ))}
      </FormGroup>
    </FormControl>
  )
}

export default Filters
