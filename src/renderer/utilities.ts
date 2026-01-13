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

/**
 * Get a value from localStorage with type safety and fallback support
 * @param key - The localStorage key
 * @param fallback - The fallback value if key doesn't exist or parsing fails
 * @returns The parsed value or fallback
 */
export const getFromLocalStorage = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key)
    if (item === null) {
      return fallback
    }
    return JSON.parse(item) as T
  } catch (error) {
    console.warn(`Failed to parse localStorage item "${key}":`, error)
    return fallback
  }
}

/**
 * Set a value in localStorage with JSON serialization
 * @param key - The localStorage key
 * @param value - The value to store
 */
export const setToLocalStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Failed to set localStorage item "${key}":`, error)
  }
}
