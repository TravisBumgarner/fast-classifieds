import { contextBridge, type IpcRendererEvent, ipcRenderer } from 'electron'
import type { FromMain } from '../shared/types/messages.fromMain'
import type { Invokes } from '../shared/types/messages.invokes'

const electronHandler = {
  ipcRenderer: {
    // Main → Renderer (listen)
    on<T extends keyof FromMain>(channel: T, listener: (params: FromMain[T]) => void) {
      const subscription = (_event: IpcRendererEvent, params: FromMain[T]) => listener(params)

      ipcRenderer.on(channel, subscription)
      return () => ipcRenderer.removeListener(channel, subscription)
    },

    // Renderer → Main (invoke / handle roundtrip)
    invoke<T extends keyof Invokes>(channel: T, args: Invokes[T]['args']): Promise<Invokes[T]['result']> {
      return ipcRenderer.invoke(channel, args)
    },
  },
}

contextBridge.exposeInMainWorld('electron', electronHandler)

export type ElectronHandler = typeof electronHandler
