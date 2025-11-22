import { BrowserWindow, type IpcMainInvokeEvent, ipcMain } from 'electron'
import type { FromMain } from '../../shared/types/messages.fromMain'
import type { Invokes } from '../../shared/types/messages.invokes'

// ----- typed IPC main -----
export const typedIpcMain = {
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

  send<T extends keyof FromMain>(channel: T, params: FromMain[T]) {
    const allWindows = BrowserWindow.getAllWindows()
    for (const win of allWindows) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, params)
      }
    }
  },
}

// ----- event wrapper -----
// type TypedIpcMainEvent = Omit<IpcMainEvent, 'reply'> & {
//   reply<T extends keyof FromMain>(CHANNEL_INVOKES: T, params: FromMain[T]): void
// }

// function wrapEvent(event: IpcMainEvent): TypedIpcMainEvent {
//   return {
//     ...event,
//     reply: (CHANNEL_INVOKES, params) => event.reply(CHANNEL_INVOKES, params),
//   }
// }
