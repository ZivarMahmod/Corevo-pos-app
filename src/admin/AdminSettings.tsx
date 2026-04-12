import { useNavigate } from 'react-router-dom'
import { useKiosk } from '@/hooks/useKiosk'
import { useIdleTimer } from '@/hooks/useIdleTimer'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

export default function AdminSettings() {
  const navigate = useNavigate()
  const { kiosk, deactivate, refresh } = useKiosk()
  const [saving, setSaving] = useState(false)
  const [showDeactivate, setShowDeactivate] = useState(false)

  useIdleTimer(300_000, () => navigate('/'))

  const toggleSetting = async (field: string, currentValue: boolean) => {
    setSaving(true)
    await supabase
      .from('tenants')
      .update({ [field]: !currentValue })
      .eq('id', kiosk?.tenantId)
    await refresh()
    setSaving(false)
  }

  const handleDeactivate = async () => {
    await deactivate()
    navigate('/')
  }

  const settings = [
    {
      label: 'Swish',
      description: 'Betala med Swish QR',
      field: 'swish_enabled',
      value: kiosk?.tenant.swish_enabled ?? false,
    },
    {
      label: 'Kort (SumUp)',
      description: 'Betala med kort via NFC',
      field: 'terminal_enabled',
      value: kiosk?.tenant.terminal_enabled ?? false,
    },
    {
      label: 'SumUp testläge',
      description: 'Simulera kortbetalning (inga riktiga pengar)',
      field: 'sumup_test_mode',
      value: kiosk?.tenant.sumup_test_mode === true,
    },
  ]

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h1 className="text-xl font-bold">Inställningar</h1>
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium transition active:scale-95"
        >
          Tillbaka
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Kiosk info */}
        <div className="mb-6 rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-semibold">Kiosk-information</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted">Namn:</span>
            <span className="font-medium">{kiosk?.name}</span>
            <span className="text-muted">ID:</span>
            <span className="font-mono text-xs">{kiosk?.kioskId}</span>
            <span className="text-muted">Tenant:</span>
            <span className="font-medium">{kiosk?.tenant.name}</span>
            <span className="text-muted">Swish-nummer:</span>
            <span className="font-medium">{kiosk?.swishNumber || '—'}</span>
          </div>
        </div>

        {/* Toggle settings */}
        <div className="mb-6 rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-semibold">Betalmetoder</h2>
          <div className="flex flex-col gap-4">
            {settings.map((s) => (
              <div key={s.field} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{s.label}</p>
                  <p className="text-sm text-muted">{s.description}</p>
                </div>
                <button
                  onClick={() => toggleSetting(s.field, s.value)}
                  disabled={saving}
                  className={`relative h-8 w-14 rounded-full transition-colors ${
                    s.value ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                      s.value ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h2 className="mb-3 font-semibold text-danger">Avaktivera kiosk</h2>
          {!showDeactivate ? (
            <button
              onClick={() => setShowDeactivate(true)}
              className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition active:scale-95"
            >
              Avaktivera denna kiosk
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm text-danger">Är du säker?</p>
              <button
                onClick={handleDeactivate}
                className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition active:scale-95"
              >
                Ja, avaktivera
              </button>
              <button
                onClick={() => setShowDeactivate(false)}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium transition active:scale-95"
              >
                Avbryt
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
