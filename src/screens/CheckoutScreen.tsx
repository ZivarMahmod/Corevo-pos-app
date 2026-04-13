import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useKiosk } from '@/hooks/useKiosk'
import { usePayment } from '@/hooks/usePayment'
import { useCart } from '@/hooks/useCart'
import SwishQR from '@/components/SwishQR'

export default function CheckoutScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { kiosk } = useKiosk()
  const cart = useCart()
  const payment = usePayment(kiosk?.tenantId ?? '', kiosk?.kioskId ?? '')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const method = (location.state as { method?: string; testMode?: boolean })?.method ?? 'swish'
  const isTestMode = (location.state as { testMode?: boolean })?.testMode ?? kiosk?.tenant.sumup_test_mode === true

  // Auto-timeout for Swish: cancel after 120s
  useEffect(() => {
    if (method === 'swish') {
      timeoutRef.current = setTimeout(() => {
        payment.cancelPayment()
        navigate('/')
      }, 120_000)
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [method])

  // If payment succeeded, go to thank you
  useEffect(() => {
    if (payment.state === 'success') {
      cart.clearCart()
      navigate('/thankyou', { state: { receiptNumber: payment.receiptNumber } })
    }
  }, [payment.state])

  const handleCancel = () => {
    payment.cancelPayment()
    navigate('/products')
  }

  const handleSwishConfirm = async () => {
    await payment.confirmSwishPayment(cart.toOrderItems())
  }

  const swishNumber = kiosk?.swishNumber || kiosk?.tenant.swish_number || ''

  // Swish QR view (manuellt läge — utan Swish Handel)
  if (method === 'swish' && (payment.state === 'swish-qr' || payment.state === 'processing')) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white">
        <h2 className="mb-2 text-3xl font-bold">Betala med Swish</h2>
        <p className="mb-8 text-lg text-muted">Skanna QR-koden med din Swish-app</p>

        <SwishQR swishNumber={swishNumber} amount={cart.total} message="Corevo POS" />

        <p className="mt-8 text-3xl font-bold">{cart.total} kr</p>

        <div className="mt-8 flex gap-4">
          <button
            onClick={handleSwishConfirm}
            disabled={payment.state === 'processing'}
            className="rounded-xl bg-swish px-8 py-4 text-lg font-semibold text-white transition active:scale-95 disabled:opacity-50"
          >
            {payment.state === 'processing' ? 'Bekräftar...' : 'Jag har betalat'}
          </button>
          <button
            onClick={handleCancel}
            className="rounded-xl border-2 border-gray-300 px-8 py-4 text-lg font-semibold text-muted transition active:scale-95"
          >
            Avbryt
          </button>
        </div>
      </div>
    )
  }

  // Card NFC view
  if (method === 'card') {
    if (payment.state === 'error') {
      return (
        <div className="flex h-full flex-col items-center justify-center bg-white">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
            <span className="text-4xl">✕</span>
          </div>
          <h2 className="mb-2 text-2xl font-bold">Betalningen misslyckades</h2>
          <p className="mb-8 max-w-sm text-center text-lg text-muted">{payment.error}</p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                payment.reset()
                navigate('/products')
              }}
              className="rounded-xl border-2 border-gray-300 px-8 py-4 text-lg font-semibold transition active:scale-95"
            >
              Tillbaka
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex h-full flex-col items-center justify-center bg-white">
        {isTestMode && (
          <div className="mb-6 rounded-full bg-yellow-100 px-4 py-1.5 text-sm font-semibold text-yellow-800">
            TESTLÄGE — inga riktiga pengar dras
          </div>
        )}

        {/* Pulsing NFC animation */}
        <div className="relative mb-8 flex h-48 w-48 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-card animate-nfc-pulse" />
          <div className="absolute inset-0 rounded-full border-4 border-card/50 animate-nfc-pulse" style={{ animationDelay: '0.5s' }} />
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00B4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        </div>

        <h2 className="mb-2 text-3xl font-bold">Håll kortet mot läsaren</h2>
        <p className="mb-6 max-w-sm text-center text-lg text-muted">
          Håll ditt kort eller telefon mot kortläsaren
        </p>

        <p className="mb-8 text-3xl font-bold">{cart.total} kr</p>

        <button
          onClick={handleCancel}
          className="rounded-xl border-2 border-gray-300 px-8 py-4 text-lg font-semibold text-muted transition active:scale-95"
        >
          Avbryt
        </button>
      </div>
    )
  }

  // Loading fallback
  return (
    <div className="flex h-full items-center justify-center bg-white">
      <div className="text-xl text-muted">Bearbetar betalning...</div>
    </div>
  )
}
