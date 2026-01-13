import { useEffect, useState } from 'react'
import { getFromLocalStorage, setToLocalStorage } from '../utilities'

/**
 * A React hook for managing localStorage state with automatic synchronization
 * @param key - The localStorage key
 * @param defaultValue - The default value if key doesn't exist
 * @returns A tuple of [value, setValue] similar to useState
 */
export const useLocalStorage = <T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] => {
  // Initialize state with value from localStorage or default
  const [storedValue, setStoredValue] = useState<T>(() => {
    return getFromLocalStorage(key, defaultValue)
  })

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value

      // Save state
      setStoredValue(valueToStore)

      // Save to localStorage
      setToLocalStorage(key, valueToStore)
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  // Listen for changes to localStorage from other windows/tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.warn(`Failed to parse storage change for key "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [key])

  return [storedValue, setValue]
}
