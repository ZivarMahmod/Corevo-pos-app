import { useEffect, useState } from 'react'
import { useKiosk } from '@/hooks/useKiosk'
import { supabase } from '@/lib/supabase'

const KIOSK_URL = import.meta.env.VITE_KIOSK_URL || 'https://corevo.se'

function buildKioskUrl(kioskId: string, accessToken: string, refreshToken: string): string {
  const url = new URL('/kiosk', KIOSK_URL)
  url.searchParams.set('kiosk', kioskId)
  url.searchParams.set('mode', 'live')
  url.searchParams.set('access_token', accessToken)
  url.searchParams.set('refresh_token', refreshToken)
  return url.toString()
}

export default function WebViewScreen() {
  const { kiosk } = useKiosk()
  const [src, setSrc] = useState('')

  useEffect(() => {
    if (!kiosk) return
    const kioskId = kiosk.kioskId

    // Prenumerera på auth-händelser — bygg URL när sessionen faktiskt finns
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token && session.refresh_token) {
        setSrc(buildKioskUrl(kioskId, session.access_token, session.refresh_token))
        subscription.unsubscribe()
      }
    })

    // Kolla om sessionen redan finns (race: sign-in kan ha hunnit innan prenumerationen)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token && session.refresh_token) {
        setSrc(buildKioskUrl(kioskId, session.access_token, session.refresh_token))
        subscription.unsubscribe()
      }
    })

    return () => subscription.unsubscribe()
  }, [kiosk])

  if (!src) {
    return (
      <div className="flex h-full items-center justify-center bg-primary">
        <div className="text-2xl font-bold text-white">Startar kiosk...</div>
      </div>
    )
  }

  return (
    <iframe
      src={src}
      className="h-full w-full border-0"
      allow="payment; camera; microphone"
      title="Corevo Kiosk"
    />
  )
}
