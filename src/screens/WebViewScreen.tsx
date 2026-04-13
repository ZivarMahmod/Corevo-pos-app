import { useEffect, useState } from 'react'
import { useKiosk } from '@/hooks/useKiosk'
import { supabase } from '@/lib/supabase'

const KIOSK_URL = import.meta.env.VITE_KIOSK_URL || 'https://corevo.se'

export default function WebViewScreen() {
  const { kiosk } = useKiosk()
  const [src, setSrc] = useState('')

  useEffect(() => {
    async function buildUrl() {
      const { data: { session } } = await supabase.auth.getSession()
      const kioskId = kiosk?.kioskId || ''

      const url = new URL('/kiosk', KIOSK_URL)
      url.searchParams.set('kiosk', kioskId)
      url.searchParams.set('mode', 'live')
      if (session?.access_token) url.searchParams.set('access_token', session.access_token)
      if (session?.refresh_token) url.searchParams.set('refresh_token', session.refresh_token)

      setSrc(url.toString())
    }
    buildUrl()
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
