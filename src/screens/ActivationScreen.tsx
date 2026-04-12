import { useState } from 'react'
import { useKiosk } from '@/hooks/useKiosk'

export default function ActivationScreen() {
  const { activate, error } = useKiosk()
  const [licenseKey, setLicenseKey] = useState('')
  const [kioskName, setKioskName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleActivate = async () => {
    if (!licenseKey.trim() || !kioskName.trim()) return
    setLoading(true)
    try {
      await activate(licenseKey.trim(), kioskName.trim())
    } catch {
      // Error is set in context
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full items-center justify-center bg-primary">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">Corevo POS</h1>
          <p className="mt-2 text-muted">Aktivera kiosk</p>
        </div>

        {/* License key */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-muted">
            Licensnyckel
          </label>
          <input
            type="text"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-center font-mono text-lg tracking-wider focus:border-primary focus:outline-none"
            autoComplete="off"
          />
        </div>

        {/* Kiosk name */}
        <div className="mb-6">
          <label className="mb-1.5 block text-sm font-medium text-muted">
            Kiosknamn
          </label>
          <input
            type="text"
            value={kioskName}
            onChange={(e) => setKioskName(e.target.value)}
            placeholder="t.ex. Kassa 1"
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-center text-lg focus:border-primary focus:outline-none"
            autoComplete="off"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-center text-sm text-danger">
            {error}
          </div>
        )}

        {/* Activate button */}
        <button
          onClick={handleActivate}
          disabled={loading || !licenseKey.trim() || !kioskName.trim()}
          className="w-full rounded-xl bg-primary py-4 text-lg font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? 'Aktiverar...' : 'Aktivera'}
        </button>
      </div>
    </div>
  )
}
