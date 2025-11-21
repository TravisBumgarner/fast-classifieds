import { CHANNEL_INVOKES } from '../../shared/types/messages.invokes'
import queries from '../database/queries'
import logger from '../logger'
import { typedIpcMain } from './ipcMain'

typedIpcMain.handle(CHANNEL_INVOKES.PROMPTS.GET_ALL, async () => {
  try {
    const prompts = await queries.getAllPrompts()
    return {
      type: 'get_all_prompts',
      prompts,
    }
  } catch (error) {
    logger.error('Error getting prompts:', error)
    return {
      type: 'get_all_prompts',
      prompts: [],
    }
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.PROMPTS.GET_BY_ID, async (_event, params) => {
  try {
    const prompt = await queries.getPromptById(params.id)
    return {
      type: 'get_prompt_by_id',
      prompt,
    }
  } catch (error) {
    logger.error('Error getting prompt:', error)
    return {
      type: 'get_prompt_by_id',
      prompt: null,
    }
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.PROMPTS.CREATE, async (_event, params) => {
  try {
    const result = await queries.insertPrompt(params)
    return {
      type: 'create_prompt',
      success: true,
      id: result[0]?.id,
    }
  } catch (error) {
    logger.error('Error creating prompt:', error)
    return {
      type: 'create_prompt',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.PROMPTS.UPDATE, async (_event, params) => {
  try {
    const { id, ...updateData } = params
    await queries.updatePrompt(id, updateData)
    return {
      type: 'update_prompt',
      success: true,
    }
  } catch (error) {
    logger.error('Error updating prompt:', error)
    return {
      type: 'update_prompt',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

typedIpcMain.handle(CHANNEL_INVOKES.PROMPTS.DELETE, async (_event, params) => {
  try {
    await queries.deletePrompt(params.id)
    return {
      type: 'delete_prompt',
      success: true as const,
    }
  } catch (error) {
    logger.error('Error deleting prompt:', error)
    return {
      type: 'delete_prompt',
      success: false as const,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})
