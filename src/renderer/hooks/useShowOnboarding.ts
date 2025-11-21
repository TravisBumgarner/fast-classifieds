import { useEffect, useState } from 'react'
import { CHANNEL_INVOKES } from '../../shared/types/messages.invokes'
import ipcMessenger from '../ipcMessenger'
import { MODAL_ID } from '../sharedComponents/Modal/Modal.consts'
import { activeModalSignal, onboardingCompletedSignal } from '../signals'

const useShowOnboarding = () => {
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false)

  useEffect(() => {
    const checkFirstLaunch = async () => {
      if (hasCheckedOnboarding) return

      const { onboardingCompleted } = await ipcMessenger.invoke(CHANNEL_INVOKES.STORE.GET, undefined)
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
