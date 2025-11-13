import Store from 'electron-store'
import { StoreSchema } from '../shared/types'

const store = new Store<StoreSchema>()

export default store
