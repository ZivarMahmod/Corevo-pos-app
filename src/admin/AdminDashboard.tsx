import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useKiosk } from '@/hooks/useKiosk'
import { useIdleTimer } from '@/hooks/useIdleTimer'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { kiosk } = useKiosk()

  // Auto-logout after 5 min idle
  useIdleTimer(300_000, () => navigate('/'))

  const options = [
    { label: 'Produkter', emoji: '📦', path: '/admin/products' },
    { label: 'Inställningar', emoji: '⚙️', path: '/admin/settings' },
    { label: 'Rapporter', emoji: '📊', path: '/admin/reports' },
    { label: 'Tillbaka till kiosk', emoji: '🖥️', path: '/' },
  ]

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <h1 className="text-xl font-bold">Admin — {kiosk?.name}</h1>
        <p className="text-sm text-muted">{kiosk?.tenant.name}</p>
      </div>

      {/* Option grid */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="grid grid-cols-2 gap-6 max-w-lg">
          {options.map((opt) => (
            <button
              key={opt.path}
              onClick={() => navigate(opt.path)}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-sm transition hover:border-primary/30 hover:shadow-md active:scale-95"
            >
              <span className="text-4xl">{opt.emoji}</span>
              <span className="text-lg font-semibold">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
