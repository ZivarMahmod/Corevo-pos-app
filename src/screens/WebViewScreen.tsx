import { useEffect, useRef } from 'react'
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

/**
 * Startar live-kiosken genom att navigera HELA Capacitor-WebView till corevo.se.
 *
 * Skillnad mot tidigare iframe-lösning: appen laddar inte längre corevo.se in i ett
 * underordnat dokument — istället byter hela WebView:ns top-level document till
 * corevo.se. Det eliminerar:
 *   - Cloudflares X-Frame-Options: SAMEORIGIN som blockade cross-origin navigation
 *   - iframe-sandbox som blockade window.location till andra bundles (/tenant mm)
 *
 * Aktiverings-React-appen unmountas av browsern när navigationen sker. Tokens +
 * kiosk-id följer med i URL-params → KioskPreview bootstrappar Supabase-session
 * från params och kör sedan på corevo.se-origin resten av tiden.
 *
 * Återväg: om enheten behöver omaktiveras wipas app-data (`adb shell pm clear se.corevo.pos`)
 * och Capacitor startar om på den lokala dist/index.html → ActivationScreen.
 */
export default function WebViewScreen() {
  const { kiosk } = useKiosk()
  const navigatedRef = useRef(false)

  useEffect(() => {
    if (!kiosk || navigatedRef.current) return
    const kioskId = kiosk.kioskId

    const goTo = (accessToken: string, refreshToken: string): void => {
      if (navigatedRef.current) return
      navigatedRef.current = true
      const url = buildKioskUrl(kioskId, accessToken, refreshToken)
      // DIAG: full URL loggas för felsökning. Syns via `adb logcat | grep kiosk-url`.
      // eslint-disable-next-line no-console
      console.info('[kiosk-url]', url)
      // replace() undviker att /activation-sidan sparas i historik-stacken,
      // så Android-back-knappen kan inte ta användaren tillbaka hit av misstag.
      window.location.replace(url)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token && session.refresh_token) {
        goTo(session.access_token, session.refresh_token)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token && session.refresh_token) {
        goTo(session.access_token, session.refresh_token)
      }
    })

    return () => subscription.unsubscribe()
  }, [kiosk])

  // Visas medan session/token-hämtning pågår — går över i full corevo.se när goTo() kör.
  return (
    <div className="flex h-full items-center justify-center bg-primary">
      <div className="text-2xl font-bold text-white">Startar kiosk...</div>
    </div>
  )
}
