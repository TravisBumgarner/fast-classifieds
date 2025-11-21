import { contextBridge, type IpcRendererEvent, ipcRenderer } from 'electron'
import type { FromMain } from '../shared/types/messages.fromMain'
import type { FromRenderer } from '../shared/types/messages.fromRenderer'
import type { Invokes } from '../shared/types/messages.invokes'

const electronHandler = {
  ipcRenderer: {
    // Renderer → Main (fire and forget)
    send<T extends keyof FromRenderer>(channel: T, params: FromRenderer[T]) {
      ipcRenderer.send(channel, params)
    },

    // Main → Renderer (listen)
    on<T extends keyof FromMain>(channel: T, listener: (params: FromMain[T]) => void) {
      const subscription = (_event: IpcRendererEvent, params: FromMain[T]) => listener(params)

      ipcRenderer.on(channel, subscription)
      return () => ipcRenderer.removeListener(channel, subscription)
    },

    // Main → Renderer (one-time listen)
    once<T extends keyof FromMain>(channel: T, listener: (params: FromMain[T]) => void) {
      ipcRenderer.once(channel, (_event, params: FromMain[T]) => listener(params))
    },

    // Renderer → Main (invoke / handle roundtrip)
    invoke<T extends keyof Invokes>(
      channel: T,
      args: Invokes[T]['args'] | undefined = undefined,
    ): Promise<Invokes[T]['result']> {
      return ipcRenderer.invoke(channel, args)
    },
  },
}

contextBridge.exposeInMainWorld('electron', electronHandler)

export type ElectronHandler = typeof electronHandler
