import { CHANNEL_INVOKES } from '../../shared/types/messages.invokes'
import store, { getStore } from '../store'
import { typedIpcMain } from './ipcMain'

typedIpcMain.handle(CHANNEL_INVOKES.STORE.GET, async () => {
  return getStore()
})

typedIpcMain.handle(CHANNEL_INVOKES.STORE.SET, async (_event, params) => {
  for (const [key, value] of Object.entries(params)) {
    store.set(key as keyof typeof params, value)
  }
  return { type: 'store_set', success: true }
})
