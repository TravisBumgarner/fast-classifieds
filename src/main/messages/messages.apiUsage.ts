import { CHANNEL_INVOKES } from '../../shared/types/messages.invokes'
import queries from '../database/queries'
import { typedIpcMain } from './ipcMain'

typedIpcMain.handle(CHANNEL_INVOKES.API_USAGE.GET_ALL, async () => {
  try {
    const apiUsage = await queries.getAllApiUsage()
    return { apiUsage }
  } catch (error) {
    console.error('Error getting API usage:', error)
    return { apiUsage: [] }
  }
})
