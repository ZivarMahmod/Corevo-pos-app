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
      <div className="animate-scale-in mb-10 flex h-[120px] w-[120px] items-center justify-center rounded-full bg-primary-light">
        <svg
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2d6b5a"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="mb-3 text-4xl font-extrabold text-text">Tack för ditt köp!</h1>
      <p className="mb-8 text-xl text-muted">Din betalning är genomförd</p>

      {receiptNumber && (
        <div className="mb-10 rounded-2xl bg-primary-light px-8 py-5 text-center">
          <p className="mb-1 text-sm font-medium text-muted">Kvittonummer</p>
          <p className="font-mono text-2xl font-bold text-primary">{receiptNumber}</p>
        </div>
      )}

      <button
        onClick={() => navigate('/')}
        className="rounded-full bg-primary px-12 py-4 text-lg font-bold text-white shadow-[0_4px_16px_rgba(45,107,90,0.3)] transition active:scale-[0.97]"
        style={{ willChange: 'transform' }}
      >
        Klar
      </button>
    </div>
  )
}
