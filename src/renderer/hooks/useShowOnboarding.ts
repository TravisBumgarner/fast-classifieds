import { useEffect, useState } from 'react'
import { CHANNEL } from '../../shared/messages.types'
import ipcMessenger from '../ipcMessenger'
import { MODAL_ID } from '../sharedComponents/Modal/Modal.consts'
import { activeModalSignal, onboardingCompletedSignal } from '../signals'

const useShowOnboarding = () => {
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false)

  useEffect(() => {
    const checkFirstLaunch = async () => {
      if (hasCheckedOnboarding) return

      const { onboardingCompleted } = await ipcMessenger.invoke(CHANNEL.STORE.GET, undefined)
      if (onboardingCompleted) {
        setHasCheckedOnboarding(true)
        onboardingCompletedSignal.value = true
        return
      }

      activeModalSignal.value = { id: MODAL_ID.ONBOARDING_MODAL }
      setHasCheckedOnboarding(true)
    }

    checkFirstLaunch()
  }, [hasCheckedOnboarding])
}

export default useShowOnboarding
