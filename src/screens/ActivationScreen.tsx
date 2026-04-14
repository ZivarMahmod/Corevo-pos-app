import { useState } from 'react'
import { useKiosk } from '@/hooks/useKiosk'

export default function ActivationScreen() {
  const { activate, error, activationStep } = useKiosk()
  const [licenseKey, setLicenseKey] = useState('')
  const [kioskName, setKioskName] = useState('')
  const [loading, setLoading] = useState(false)

  // Vilka steg är färdiga? Varje fas "passeras" när nästa fas visas.
  const phaseOrder = ['verifying', 'signin', 'tenant', 'kiosk', 'caching', 'done'] as const
  const currentPhaseIdx = activationStep
    ? phaseOrder.indexOf(activationStep.phase)
    : -1
  const phaseLabels: Record<typeof phaseOrder[number], string> = {
    verifying: 'Licens',
    signin: 'Inloggning',
    tenant: 'Kundinfo',
    kiosk: 'Kioskprofil',
    caching: 'Sparar',
    done: 'Klart',
  }

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
    <div
      className="flex h-full items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #2d6b5a 0%, #1a4a3a 100%)' }}
    >
      <div className="w-full max-w-[420px] rounded-3xl bg-white p-8 shadow-[0_24px_48px_rgba(0,0,0,0.15)]">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-primary">Corevo POS</h1>
          <p className="mt-2 text-base text-muted">Aktivera kiosk</p>
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
            placeholder="XXXX-XXXX"
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3.5 text-center font-mono text-lg tracking-widest transition-colors focus:border-primary focus:outline-none"
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
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3.5 text-center text-lg transition-colors focus:border-primary focus:outline-none"
            autoComplete="off"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="animate-shake mb-4 rounded-xl bg-red-50 p-3.5 text-center text-sm font-medium text-danger">
            {error}
          </div>
        )}

        {/* Activate button */}
        <button
          onClick={handleActivate}
          disabled={loading || !licenseKey.trim() || !kioskName.trim()}
          className="w-full rounded-full bg-primary py-4 text-lg font-bold text-white shadow-[0_4px_16px_rgba(45,107,90,0.3)] transition active:scale-[0.97] disabled:opacity-50"
          style={{ willChange: 'transform' }}
        >
          {loading ? 'Aktiverar...' : 'Aktivera'}
        </button>

        {/* Step-progress — visar varje verifieringssteg så personalen ser
            att allt görs i tur och ordning istället för att det blinkar förbi. */}
        {activationStep && (
          <div className="mt-5 space-y-1.5">
            <p className="text-sm text-muted text-center">{activationStep.message}</p>
            <div className="space-y-1">
              {phaseOrder.map((phase, idx) => {
                const done = idx < currentPhaseIdx || activationStep.phase === 'done'
                const active = idx === currentPhaseIdx && activationStep.phase !== 'done'
                return (
                  <div
                    key={phase}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs transition ${
                      done ? 'text-primary' : active ? 'text-foreground' : 'text-muted/50'
                    }`}
                  >
                    <span className="font-mono">
                      {done ? '✓' : active ? '•' : '◌'}
                    </span>
                    <span>{phaseLabels[phase]}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
