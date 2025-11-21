import { type IpcMainEvent, type IpcMainInvokeEvent, ipcMain } from 'electron'
import type { FromMain, FromRenderer, Invokes } from '../../shared/messages.types'

// ----- typed IPC main -----
export const typedIpcMain = {
  // Renderer → Main (fire and forget)
  on<T extends keyof FromRenderer>(channel: T, listener: (event: TypedIpcMainEvent, params: FromRenderer[T]) => void) {
    ipcMain.on(channel, (event, params) => listener(wrapEvent(event), params as FromRenderer[T]))
  },

  // Main handles invoke() calls (Renderer → Main request/response)
  handle<T extends keyof Invokes>(
    channel: T,
    handler: (
      event: IpcMainInvokeEvent,
      args: Invokes[T]['args'],
    ) => Invokes[T]['result'] | Promise<Invokes[T]['result']>,
  ) {
    ipcMain.handle(channel, (event, args) => handler(event, args as Invokes[T]['args']))
  },

  send<T extends keyof FromMain>(channel: T, params: FromMain[T]) {
    // Note: this is a fire-and-forget operation, so we don't provide a way to know if it succeeded
    // or failed. If you need that, use `invoke`/`handle`.
    ipcMain.emit(channel, params)
  },

  // Helper for replying to renderer
  reply<T extends keyof FromMain>(event: IpcMainEvent, channel: T, params: FromMain[T]) {
    event.reply(channel, params)
  },
}

// ----- event wrapper -----
type TypedIpcMainEvent = Omit<IpcMainEvent, 'reply'> & {
  reply<T extends keyof FromMain>(channel: T, params: FromMain[T]): void
}

function wrapEvent(event: IpcMainEvent): TypedIpcMainEvent {
  return {
    ...event,
    reply: (channel, params) => event.reply(channel, params),
  }
}
