import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import Store from 'electron-store'
import { StoreSchema } from 'src/shared/types'
import { FromMain, FromRenderer, Invokes } from '../shared/messages.types'

const defaults: StoreSchema = {
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
  changelogLastSeenVersion: null,
  scrapeDelay: 3000,
  showStatusBarProgress: true,
  onboardingCompleted: false,
}

const store = new Store<StoreSchema>({ defaults })

contextBridge.exposeInMainWorld('appStore', {
  get<K extends keyof StoreSchema>(key: K): StoreSchema[K] {
    return store.get(key)
  },

  set<K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void {
    store.set(key, value)
  },

  onChange<K extends keyof StoreSchema>(
    key: K,
    cb: (newValue: StoreSchema[K], oldValue: StoreSchema[K]) => void,
  ): void {
    store.onDidChange(key, cb)
  },
})

const electronHandler = {
  ipcRenderer: {
    // Renderer → Main (fire and forget)
    send<T extends keyof FromRenderer>(channel: T, params: FromRenderer[T]) {
      ipcRenderer.send(channel, params)
    },

    // Main → Renderer (listen)
    on<T extends keyof FromMain>(
      channel: T,
      listener: (params: FromMain[T]) => void,
    ) {
      const subscription = (_event: IpcRendererEvent, params: FromMain[T]) =>
        listener(params)

      ipcRenderer.on(channel, subscription)
      return () => ipcRenderer.removeListener(channel, subscription)
    },

    // Main → Renderer (one-time listen)
    once<T extends keyof FromMain>(
      channel: T,
      listener: (params: FromMain[T]) => void,
    ) {
      ipcRenderer.once(channel, (_event, params: FromMain[T]) =>
        listener(params),
      )
    },

    // Renderer → Main (invoke / handle roundtrip)
    invoke<T extends keyof Invokes>(
      channel: T,
      args: Invokes[T]['args'] | undefined = undefined,
    ): Promise<Invokes[T]['result']> {
      return ipcRenderer.invoke(channel, args)
    },
  },
  shell: {
    openExternal: (url: string) =>
      ipcRenderer.invoke('shell:openExternal', url),
  },
}

contextBridge.exposeInMainWorld('electron', electronHandler)

export type ElectronHandler = typeof electronHandler
