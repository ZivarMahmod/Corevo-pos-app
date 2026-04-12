import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useEffect, useState } from 'react'

interface StatusBarProps {
  tenantName: string
}

export default function StatusBar({ tenantName }: StatusBarProps) {
  const online = useOnlineStatus()
  const [time, setTime] = useState(formatTime())

  useEffect(() => {
    const interval = setInterval(() => setTime(formatTime()), 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-14 shrink-0 items-center justify-between bg-[#1a1a1a] px-6 text-white">
      <div className="text-lg font-extrabold tracking-tight">{tenantName}</div>
      <div className="flex items-center gap-5 text-sm">
        <span className="flex items-center gap-2">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              online ? 'bg-green-400' : 'bg-red-500 animate-pulse'
            }`}
          />
          <span className="text-white/70">{online ? 'Online' : 'Offline'}</span>
        </span>
        <span className="font-mono text-white/70">{time}</span>
      </div>
    </div>
  )
}

function formatTime(): string {
  return new Date().toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
