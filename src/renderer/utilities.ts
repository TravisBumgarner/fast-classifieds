import type { QueryKey } from './consts'

export const formatDisplayDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatSelectOption = (option: string) => {
  return (option.charAt(0).toUpperCase() + option.slice(1)).replace(/_/g, ' ')
}

export const createQueryKey = (queryKey: QueryKey, identifiers: string[] = []) => {
  return [queryKey, ...identifiers]
}
