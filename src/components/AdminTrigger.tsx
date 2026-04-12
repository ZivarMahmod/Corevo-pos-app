import { useNavigate } from 'react-router-dom'

/**
 * Day 1: visible gear icon button in top-center.
 * Future: hidden 5-second hold in corner.
 */
export default function AdminTrigger() {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate('/admin')}
      className="absolute top-4 left-1/2 -translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/50 backdrop-blur-sm transition hover:bg-white/20 active:scale-90"
      aria-label="Admin"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    </button>
  )
}
