import { useEffect, useState } from 'react'
import { isEloDevice, configureEloKiosk } from '@/lib/elo-detect'

export function useElo() {
  const [isElo, setIsElo] = useState(false)

  useEffect(() => {
    const elo = isEloDevice()
    setIsElo(elo)

    // Configure kiosk mode (hides status bar etc.)
    configureEloKiosk()
  }, [])

  return { isElo }
}
