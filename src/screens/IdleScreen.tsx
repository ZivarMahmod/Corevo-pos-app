import { useNavigate } from 'react-router-dom'
import { useKiosk } from '@/hooks/useKiosk'
import AdminTrigger from '@/components/AdminTrigger'

export default function IdleScreen() {
  const navigate = useNavigate()
  const { kiosk } = useKiosk()

  const handleTap = () => {
    navigate('/products')
  }

  const tenantName = kiosk?.tenant.kiosk_club_name || kiosk?.tenant.name || 'Corevo POS'
  const welcomeText = kiosk?.tenant.kiosk_welcome_text || 'Välkommen!'
  const idleMessage = kiosk?.tenant.kiosk_idle_message || 'Tryck för att börja'

  return (
    <div
      className="relative flex h-full flex-col items-center justify-center bg-primary cursor-pointer"
      onClick={handleTap}
    >
      {/* Admin trigger — gear icon top center */}
      <AdminTrigger />

      {/* Logo */}
      {kiosk?.tenant.kiosk_logo_emoji && (
        <span className="mb-6 text-7xl">{kiosk.tenant.kiosk_logo_emoji}</span>
      )}

      {/* Tenant name */}
      <h1 className="mb-4 text-5xl font-bold text-white">{tenantName}</h1>

      {/* Welcome text */}
      <p className="mb-12 text-2xl text-white/80">{welcomeText}</p>

      {/* Touch prompt */}
      <p className="animate-pulse-slow text-xl text-white/60">
        {idleMessage}
      </p>

      {/* Bottom branding */}
      <div className="absolute bottom-6 text-sm text-white/30">
        Powered by Corevo
      </div>
    </div>
  )
}
