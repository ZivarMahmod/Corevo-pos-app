import { useState, useEffect } from 'react'
import { Network } from '@capacitor/network'

export function useOnlineStatus() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    Network.getStatus().then((s) => setOnline(s.connected)).catch(() => {})

    const handler = Network.addListener('networkStatusChange', (status) => {
      setOnline(status.connected)
    })

    return () => {
      handler.then((h) => h.remove()).catch(() => {})
    }
  }, [])

  return online
}
