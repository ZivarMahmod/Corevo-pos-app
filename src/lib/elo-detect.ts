import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

export function isEloDevice(): boolean {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('elo')) return true

  // Check Android device model via Capacitor
  const platform = Capacitor.getPlatform()
  if (platform === 'android') {
    // The Elo I-Series 4 reports model as 'i4_in15' or similar
    if (ua.includes('i-series') || ua.includes('i4_in')) return true
  }

  return false
}

export async function configureEloKiosk(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  try {
    await StatusBar.hide()
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#2d6b5a' })
  } catch {
    // StatusBar API might not be available in all contexts
  }
}
