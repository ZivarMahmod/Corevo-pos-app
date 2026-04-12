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
    <div className="flex h-12 items-center justify-between bg-primary px-6 text-white">
      <div className="text-lg font-semibold">{tenantName}</div>
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              online ? 'bg-green-400' : 'bg-red-500 animate-pulse'
            }`}
          />
          {online ? 'Online' : 'Offline'}
        </span>
        <span className="font-mono">{time}</span>
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
