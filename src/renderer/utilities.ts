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

export const createQueryKey = (queryKey: QueryKey, subIdentifiers: string | string[]) => {
  // If a query key is used twice, it'll cause the app to crash.
  // Query invalidation just needs to match on the queryKey so use a sub-identifier
  // for unique identification.
  return [queryKey, subIdentifiers].flat()
}
