import { QRCodeSVG } from 'qrcode.react'
import { generateSwishPayload } from '@/lib/swish'

interface SwishQRProps {
  swishNumber: string
  amount: number
  message?: string
}

export default function SwishQR({ swishNumber, amount, message = '' }: SwishQRProps) {
  const payload = generateSwishPayload(swishNumber, amount, message)

  return (
    <div className="flex flex-col items-center">
      <div className="rounded-2xl bg-white p-4 shadow-lg">
        <QRCodeSVG
          value={payload}
          size={220}
          level="M"
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        Skanna med Swish-appen
      </p>
      <p className="mt-1 text-center text-xs text-muted">
        Swish-nummer: {swishNumber}
      </p>
    </div>
  )
}
