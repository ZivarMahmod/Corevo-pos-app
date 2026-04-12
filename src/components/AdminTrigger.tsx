import { useNavigate } from 'react-router-dom'

export default function AdminTrigger() {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate('/admin')}
      className="absolute top-4 left-1/2 -translate-x-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/10 transition active:scale-90"
      aria-label="Admin"
    >
      <svg
        width="18"
        height="18"
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
