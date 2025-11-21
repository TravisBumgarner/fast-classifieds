import { CHANNEL } from '../../shared/messages.types'
import store, { getStore } from '../store'
import { typedIpcMain } from './ipcMain'

typedIpcMain.handle(CHANNEL.STORE.GET, async () => {
  return getStore()
})

typedIpcMain.handle(CHANNEL.STORE.SET, async (_event, params) => {
  for (const [key, value] of Object.entries(params)) {
    store.set(key as keyof typeof params, value)
  }
  return { type: 'store_set', success: true }
})
