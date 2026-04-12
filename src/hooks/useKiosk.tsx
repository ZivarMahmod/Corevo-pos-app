import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  activateKiosk,
  getCachedKiosk,
  refreshKioskData,
  clearKiosk,
  verifyAdminPin,
  type KioskState,
} from '@/lib/kiosk-identity'
import { startSyncListener } from '@/lib/sync'

interface KioskContextValue {
  kiosk: KioskState | null
  isActivated: boolean
  isLoading: boolean
  error: string | null
  activate: (licenseKey: string, name: string) => Promise<void>
  deactivate: () => Promise<void>
  verifyPin: (pin: string) => boolean
  refresh: () => Promise<void>
}

const KioskContext = createContext<KioskContextValue | null>(null)

export function KioskProvider({ children }: { children: ReactNode }) {
  const [kiosk, setKiosk] = useState<KioskState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load cached kiosk on mount
  useEffect(() => {
    let mounted = true
    async function init() {
      try {
        const cached = await getCachedKiosk()
        if (mounted) setKiosk(cached)

        // Background refresh if cached
        if (cached) {
          const refreshed = await refreshKioskData()
          if (mounted && refreshed) setKiosk(refreshed)
        }
      } catch {
        // Ignore — we'll show activation screen
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    init()

    // Start sync listener for offline orders
    startSyncListener()

    return () => { mounted = false }
  }, [])

  const activate = useCallback(async (licenseKey: string, name: string) => {
    setError(null)
    try {
      const state = await activateKiosk(licenseKey, name)
      setKiosk(state)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Aktivering misslyckades'
      setError(msg)
      throw err
    }
  }, [])

  const deactivate = useCallback(async () => {
    await clearKiosk()
    setKiosk(null)
  }, [])

  const verifyPin = useCallback((pin: string): boolean => {
    if (!kiosk) return false
    return verifyAdminPin(pin, kiosk.adminPin)
  }, [kiosk])

  const refresh = useCallback(async () => {
    const refreshed = await refreshKioskData()
    if (refreshed) setKiosk(refreshed)
  }, [])

  return (
    <KioskContext.Provider
      value={{
        kiosk,
        isActivated: kiosk !== null,
        isLoading,
        error,
        activate,
        deactivate,
        verifyPin,
        refresh,
      }}
    >
      {children}
    </KioskContext.Provider>
  )
}

export function useKiosk(): KioskContextValue {
  const ctx = useContext(KioskContext)
  if (!ctx) throw new Error('useKiosk must be used inside KioskProvider')
  return ctx
}
