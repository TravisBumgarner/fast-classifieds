import { signal } from '@preact/signals-react'
import { type ActiveModal } from './sharedComponents/Modal'

export const activeModalSignal = signal<ActiveModal | null>(null)
export const onboardingCompletedSignal = signal<boolean>(false)
