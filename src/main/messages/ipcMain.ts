import { type IpcMainEvent, type IpcMainInvokeEvent, ipcMain } from 'electron'
import type { FromMain } from '../../shared/types/messages.fromMain'
import type { FromRenderer } from '../../shared/types/messages.fromRenderer'
import type { Invokes } from '../../shared/types/messages.invokes'

// ----- typed IPC main -----
export const typedIpcMain = {
  // Renderer → Main (fire and forget)
  on<T extends keyof FromRenderer>(
    CHANNEL_INVOKES: T,
    listener: (event: TypedIpcMainEvent, params: FromRenderer[T]) => void,
  ) {
    ipcMain.on(CHANNEL_INVOKES, (event, params) => listener(wrapEvent(event), params as FromRenderer[T]))
  },

  // Main handles invoke() calls (Renderer → Main request/response)
  handle<T extends keyof Invokes>(
    CHANNEL_INVOKES: T,
    handler: (
      event: IpcMainInvokeEvent,
      args: Invokes[T]['args'],
    ) => Invokes[T]['result'] | Promise<Invokes[T]['result']>,
  ) {
    ipcMain.handle(CHANNEL_INVOKES, (event, args) => handler(event, args as Invokes[T]['args']))
  },

  send<T extends keyof FromMain>(CHANNEL_INVOKES: T, params: FromMain[T]) {
    // Note: this is a fire-and-forget operation, so we don't provide a way to know if it succeeded
    // or failed. If you need that, use `invoke`/`handle`.
    ipcMain.emit(CHANNEL_INVOKES, params)
  },

  // Helper for replying to renderer
  reply<T extends keyof FromMain>(event: IpcMainEvent, CHANNEL_INVOKES: T, params: FromMain[T]) {
    event.reply(CHANNEL_INVOKES, params)
  },
}

// ----- event wrapper -----
type TypedIpcMainEvent = Omit<IpcMainEvent, 'reply'> & {
  reply<T extends keyof FromMain>(CHANNEL_INVOKES: T, params: FromMain[T]): void
}

function wrapEvent(event: IpcMainEvent): TypedIpcMainEvent {
  return {
    ...event,
    reply: (CHANNEL_INVOKES, params) => event.reply(CHANNEL_INVOKES, params),
  }
}
