import { ElectronHandler } from '../main/preload'

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    electron: ElectronHandler
    appStore: {
      get<K extends keyof StoreSchema>(key: K): StoreSchema[K]
      set<K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void
      onChange<K extends keyof StoreSchema>(
        key: K,
        cb: (newValue: StoreSchema[K], oldValue: StoreSchema[K]) => void,
      ): void
    }
  }
}

export {}
