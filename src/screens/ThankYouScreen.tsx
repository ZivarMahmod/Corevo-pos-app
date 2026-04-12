import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function ThankYouScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const receiptNumber = (location.state as { receiptNumber?: string })?.receiptNumber ?? ''

  // Auto-redirect after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => navigate('/'), 8000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="flex h-full flex-col items-center justify-center bg-white">
      {/* Animated checkmark */}
      <div className="animate-scale-in mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-green-100">
        <svg
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#16a34a"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="mb-3 text-4xl font-bold text-text">Tack för ditt köp!</h1>
      <p className="mb-6 text-xl text-muted">Din betalning är genomförd</p>

      {receiptNumber && (
        <div className="mb-8 rounded-xl bg-gray-50 px-6 py-3">
          <p className="text-sm text-muted">Kvittonummer</p>
          <p className="text-2xl font-mono font-bold">{receiptNumber}</p>
        </div>
      )}

      <button
        onClick={() => navigate('/')}
        className="rounded-xl bg-primary px-10 py-4 text-lg font-semibold text-white transition active:scale-95"
      >
        Klar
      </button>
    </div>
  )
}
