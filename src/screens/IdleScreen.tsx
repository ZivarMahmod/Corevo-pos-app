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
  const idleMessage = kiosk?.tenant.kiosk_idle_message || 'Tryck för att beställa'
  const logoImage = kiosk?.tenant.kiosk_logo_image
  const logoEmoji = kiosk?.tenant.kiosk_logo_emoji

  return (
    <div
      className="relative flex h-full cursor-pointer flex-col items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #2d6b5a 0%, #1a4a3a 100%)' }}
      onClick={handleTap}
    >
      <AdminTrigger />

      {/* Logo */}
      <div className="animate-float mb-8">
        {logoImage ? (
          <img
            src={logoImage}
            alt={tenantName}
            className="h-28 w-28 rounded-3xl object-cover shadow-lg"
          />
        ) : logoEmoji ? (
          <span className="text-8xl">{logoEmoji}</span>
        ) : (
          <span className="text-8xl">🏪</span>
        )}
      </div>

      {/* Tenant name */}
      <h1 className="mb-4 text-center text-6xl font-extrabold text-white tracking-tight">
        {tenantName}
      </h1>

      {/* Welcome text */}
      <p className="mb-16 text-center text-2xl text-white/80">
        {welcomeText}
      </p>

      {/* Touch prompt */}
      <p className="animate-pulse-slow text-xl text-white/60">
        {idleMessage}
      </p>

      {/* Bottom branding */}
      <div className="absolute bottom-6 text-sm text-white/20">
        Powered by Corevo
      </div>
    </div>
  )
}
