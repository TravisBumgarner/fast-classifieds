import { useEffect } from 'react'
import type { FromMain } from '../../shared/types/messages.fromMain'
import ipcMessenger from '../ipcMessenger'

export function useIpcOn<T extends keyof FromMain>(channel: T, handler: (params: FromMain[T]) => void) {
  useEffect(() => {
    const off = ipcMessenger.on(channel, handler)
    return () => {
      off()
    }
  }, [channel, handler])
}
