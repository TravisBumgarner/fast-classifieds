import { useSignalEffect, useSignals } from '@preact/signals-react/runtime'
import { useEffect } from 'react'
import { CURRENT_VERSION } from '../../shared/changelog'
import { CHANNEL } from '../../shared/messages.types'
import ipcMessenger from '../ipcMessenger'
import { MODAL_ID } from '../sharedComponents/Modal/Modal.consts'
import { activeModalSignal, onboardingCompletedSignal } from '../signals'

const useShowChangelog = () => {
  useSignals()
  useSignalEffect(() => {
    // Wait for onboarding check to complete before showing changelog

    if (!onboardingCompletedSignal.value) return

    ipcMessenger.invoke(CHANNEL.STORE.GET, undefined).then(({ changelogLastSeenVersion }) => {
      if (changelogLastSeenVersion !== CURRENT_VERSION) {
        // Show changelog modal after a short delay to let the app render
        activeModalSignal.value = {
          id: MODAL_ID.CHANGELOG_MODAL,
          showLatestOnly: true,
        }
        // Update the last seen version
        ipcMessenger.invoke(CHANNEL.STORE.SET, {
          changelogLastSeenVersion: CURRENT_VERSION,
        })
      }
    })
  })
}

export default useShowChangelog
