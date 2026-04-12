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
      <div className="rounded-2xl bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <QRCodeSVG
          value={payload}
          size={200}
          level="M"
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
    </div>
  )
}
